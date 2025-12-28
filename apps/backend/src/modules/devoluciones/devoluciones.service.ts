import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { CfdiService } from '../cfdi/cfdi.service';

@Injectable()
export class DevolucionesService {
    private readonly logger = new Logger(DevolucionesService.name);

    constructor(
        @Inject('DRIZZLE_CLIENT') private readonly db: any,
        private readonly cfdiService: CfdiService
    ) { }

    /**
     * 📋 LISTA DE TRÁMITES REALES
     */
    async getByEmpresa(empresaId: string) {
        return await this.db.all(sql`
            SELECT 
                id,
                empresa_id as empresaId,
                periodo,
                saldo_favor as saldoFavor,
                informe_hash as informeHash,
                estado,
                created_at as createdAt
            FROM devoluciones_iva 
            WHERE empresa_id = ${empresaId} 
            ORDER BY created_at DESC
        `);
    }

    /**
     * 🔍 DETALLE DE TRÁMITE (EXPEDIENTE)
     */
    async getById(id: number) {
        const result = await this.db.all(sql`
            SELECT 
                id,
                empresa_id as empresaId,
                periodo,
                saldo_favor as saldoFavor,
                informe_hash as informeHash,
                estado,
                uuids_cfdi as uuidsCfdi,
                uuids_complementos as uuidsComplementos,
                created_at as createdAt
            FROM devoluciones_iva 
            WHERE id = ${id}
        `);

        if (!result.length) return null;

        const item = result[0];
        return {
            ...item,
            uuidsCfdi: item.uuidsCfdi ? JSON.parse(item.uuidsCfdi) : [],
            uuidsComplementos: item.uuidsComplementos ? JSON.parse(item.uuidsComplementos) : []
        };
    }

    /**
     * 🚀 CREAR TRÁMITE DESDE INFORME SAT-GRADE
     * Valida dictamen y vincula evidencias forenses.
     */
    async createFromReport(empresaId: string, periodo: string) {
        this.logger.log(`Creando trámite de devolución para periodo ${periodo}...`);

        // 1. Obtener y Validar el Informe SAT-GRADE
        const report = await this.cfdiService.generateDefenseReport(empresaId, periodo);

        if (report.dictamen.resultado === 'RED') {
            throw new BadRequestException('Trámite BLOQUEADO: El informe tiene un dictamen CRÍTICO (RED). Debe solventar las alertas de riesgo antes de proceder.');
        }

        const warningMsg = report.dictamen.resultado === 'YELLOW'
            ? 'Atención: Informe con dictamen YELLOW. Es probable que el SAT genere un requerimiento de información.'
            : null;

        // 2. Extraer datos del reporte
        const saldoFavor = report.resumenNumerico.ivaSolicitado;
        // Determinamos un hash si no viene en el reporte (Fallback)
        const hashIntegritad = report.meta.hashIntegritad || Buffer.from(`${empresaId}-${periodo}-${saldoFavor}`).toString('base64').substring(0, 16);

        // 3. Obtener UUIDs vinculados (CFDI + Pagos) - SQL puro para trazabilidad
        const cfdis = await this.db.all(sql`
            SELECT uuid FROM cfdi_recibidos 
            WHERE empresa_id = ${empresaId} 
            AND strftime('%Y-%m', fecha) = ${periodo}
            AND estado_sat != 'Cancelado'
            AND tipo_comprobante = 'I'
        `);
        const uuidsCfdiList = cfdis.map(c => c.uuid);

        const pagos = await this.db.all(sql`
            SELECT DISTINCT cp.uuid
            FROM cfdi_recibidos cp
            JOIN cfdi_relaciones r ON r.cfdi_hijo_uuid = cp.uuid
            JOIN cfdi_recibidos c ON c.uuid = r.cfdi_padre_uuid
            WHERE c.empresa_id = ${empresaId}
            AND strftime('%Y-%m', c.fecha) = ${periodo}
            AND r.tipo_relacion = '04'
            AND cp.tipo_comprobante = 'P'
        `);
        const uuidsPagosList = pagos.map(p => p.uuid);

        // 4. Persistir Trámite
        const now = Date.now();
        await this.db.run(sql`
            INSERT INTO devoluciones_iva (
                empresa_id, periodo, saldo_favor, informe_hash, estado, uuids_cfdi, uuids_complementos, created_at
            ) VALUES (
                ${empresaId}, ${periodo}, ${saldoFavor}, ${hashIntegritad}, 'BORRADOR', 
                ${JSON.stringify(uuidsCfdiList)}, ${JSON.stringify(uuidsPagosList)}, ${now}
            )
        `);

        return {
            success: true,
            warning: warningMsg,
            data: {
                periodo,
                saldoFavor,
                hashIntegritad,
                cfdisCount: uuidsCfdiList.length,
                pagosCount: uuidsPagosList.length
            }
        };
    }

    /**
     * 🔍 VISTA PREVIA DEL TRÁMITE (PRE-VALUACIÓN)
     * Ejecuta simulacro de auditoría para mostrar en la interfaz antes de confirmar.
     */
    async preValuation(empresaId: string, periodo: string) {
        const report = await this.cfdiService.generateDefenseReport(empresaId, periodo);

        const cfdis = await this.db.all(sql`
            SELECT COUNT(*) as count FROM cfdi_recibidos 
            WHERE empresa_id = ${empresaId} 
            AND strftime('%Y-%m', fecha) = ${periodo}
            AND estado_sat != 'Cancelado'
            AND tipo_comprobante = 'I'
        `);

        const pagos = await this.db.all(sql`
            SELECT COUNT(DISTINCT cp.uuid) as count
            FROM cfdi_recibidos cp
            JOIN cfdi_relaciones r ON r.cfdi_hijo_uuid = cp.uuid
            JOIN cfdi_recibidos c ON c.uuid = r.cfdi_padre_uuid
            WHERE c.empresa_id = ${empresaId}
            AND strftime('%Y-%m', c.fecha) = ${periodo}
            AND r.tipo_relacion = '04'
            AND cp.tipo_comprobante = 'P'
        `);

        return {
            periodo,
            saldoFavor: report.resumenNumerico.ivaSolicitado,
            dictamen: report.dictamen,
            cfdisCount: cfdis[0].count,
            pagosCount: pagos[0].count
        };
    }
}
