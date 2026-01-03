import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { sql } from 'drizzle-orm';

/**
 * 📊 SERVICIO DE REPORTES SAT
 * Módulo cerrado para generación de reportes oficiales SAT
 * Fuente de verdad: CFDI tipo 'P' (REP 2.0)
 */
@Injectable()
export class ReportesService {
    constructor(
        @Inject('DRIZZLE_CLIENT') private readonly db: any,
    ) { }

    /**
     * 🧾 REPORTE SAT - FLUJO DE EFECTIVO (REP)
     * Genera reporte mensual basado EXCLUSIVAMENTE en Complementos de Pago
     * 
     * Estructura:
     * - Agrupa por año/mes
     * - Usa cfdi_relaciones.imp_pagado (monto real cobrado/pagado)
     * - Usa cfdi_impuestos WHERE nivel = 'pago' (impuestos del REP)
     * - Separa bases e impuestos por tasa (0%, 8%, 16%)
     * - Incluye ISR, IVA, IEPS
     */
    async getReporteSatRep(empresaId: string, year: string) {
        console.log(`[SAT-REP] Generando reporte para empresa: ${empresaId}, año: ${year}`);

        if (!empresaId || !year) {
            throw new BadRequestException('Se requiere empresaId y year');
        }

        try {
            // Query SQL que replica la estructura del reporte SAT oficial
            const reporteData = await this.db.all(sql`
                WITH pagos_base AS (
                    SELECT 
                        strftime('%Y-%m', p.fecha) as periodo,
                        p.uuid as rep_uuid,
                        p.fecha as fecha_pago,
                        p.rol,
                        r.imp_pagado as monto_pagado,
                        r.cfdi_hijo_uuid as factura_relacionada
                    FROM cfdi_recibidos p
                    JOIN cfdi_relaciones r ON r.cfdi_padre_uuid = p.uuid
                    WHERE p.empresa_id = ${empresaId}
                    AND p.tipo_comprobante = 'P'
                    AND strftime('%Y', p.fecha) = ${year}
                    AND (UPPER(p.estatus_fiscal) = 'VIGENTE' OR p.estatus_fiscal IS NULL OR p.estatus_fiscal = 'PENDING')
                ),
                impuestos_pago AS (
                    SELECT 
                        i.cfdi_uuid,
                        i.tipo_impuesto,
                        i.tasa_o_cuota,
                        i.tipo_factor,
                        i.importe,
                        SUM(i.importe) as total_impuesto,
                        SUM(i.base) as total_base
                    FROM cfdi_impuestos i
                    WHERE i.nivel = 'pago'
                    AND i.cfdi_uuid IN (SELECT rep_uuid FROM pagos_base)
                    GROUP BY i.cfdi_uuid, i.tipo_impuesto, i.tasa_o_cuota, i.tipo_factor
                )
                SELECT 
                    pb.periodo,
                    pb.rol,
                    COUNT(DISTINCT pb.rep_uuid) as total_reps,
                    SUM(pb.monto_pagado) as total_cobrado_pagado,
                    
                    -- IVA 16%
                    COALESCE(SUM(CASE WHEN ip.tipo_impuesto = '002' AND ip.tasa_o_cuota = 0.16 THEN ip.total_base ELSE 0 END), 0) as base_iva_16,
                    COALESCE(SUM(CASE WHEN ip.tipo_impuesto = '002' AND ip.tasa_o_cuota = 0.16 THEN ip.total_impuesto ELSE 0 END), 0) as iva_16,
                    
                    -- IVA 8%
                    COALESCE(SUM(CASE WHEN ip.tipo_impuesto = '002' AND ip.tasa_o_cuota = 0.08 THEN ip.total_base ELSE 0 END), 0) as base_iva_8,
                    COALESCE(SUM(CASE WHEN ip.tipo_impuesto = '002' AND ip.tasa_o_cuota = 0.08 THEN ip.total_impuesto ELSE 0 END), 0) as iva_8,
                    
                    -- IVA 0%
                    COALESCE(SUM(CASE WHEN ip.tipo_impuesto = '002' AND ip.tasa_o_cuota = 0.00 THEN ip.total_base ELSE 0 END), 0) as base_iva_0,
                    
                    -- ISR Retenido
                    COALESCE(SUM(CASE WHEN ip.tipo_impuesto = '001' THEN ip.total_impuesto ELSE 0 END), 0) as isr_retenido,
                    
                    -- IVA Retenido
                    COALESCE(SUM(CASE WHEN ip.tipo_impuesto = '002' AND ip.tipo_factor = 'Tasa' AND ip.importe < 0 THEN ABS(ip.total_impuesto) ELSE 0 END), 0) as iva_retenido,
                    
                    -- IEPS
                    COALESCE(SUM(CASE WHEN ip.tipo_impuesto = '003' THEN ip.total_impuesto ELSE 0 END), 0) as ieps
                    
                FROM pagos_base pb
                LEFT JOIN impuestos_pago ip ON ip.cfdi_uuid = pb.rep_uuid
                GROUP BY pb.periodo, pb.rol
                ORDER BY pb.periodo DESC, pb.rol
            `);

            console.log(`[SAT-REP] Reporte generado: ${reporteData.length} registros`);

            // Transformar a formato SAT oficial
            const reporteFormateado = reporteData.map((row: any) => ({
                periodo: row.periodo,
                flujo: row.rol === 'EMITIDO' ? 'COBRADO' : 'PAGADO',
                totalReps: Number(row.total_reps || 0),
                totalEfectivo: Number(row.total_cobrado_pagado || 0),
                baseIva16: Number(row.base_iva_16 || 0),
                iva16: Number(row.iva_16 || 0),
                baseIva8: Number(row.base_iva_8 || 0),
                iva8: Number(row.iva_8 || 0),
                baseIva0: Number(row.base_iva_0 || 0),
                isrRetenido: Number(row.isr_retenido || 0),
                ivaRetenido: Number(row.iva_retenido || 0),
                ieps: Number(row.ieps || 0),
            }));

            return {
                success: true,
                year,
                empresaId,
                data: reporteFormateado,
                metadata: {
                    generadoEn: new Date().toISOString(),
                    fuenteDatos: 'CFDI Tipo P (REP 2.0)',
                    advertencia: 'Este reporte muestra FLUJO DE EFECTIVO REAL, no facturación devengada.'
                }
            };
        } catch (error) {
            console.error('[SAT-REP] Error generando reporte:', error);
            throw new BadRequestException(`Error al generar reporte SAT-REP: ${error.message}`);
        }
    }
}
