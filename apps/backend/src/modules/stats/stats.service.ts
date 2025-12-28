import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { CacheService } from '../../common/cache.service';

@Injectable()
export class StatsService {
    constructor(
        @Inject('DRIZZLE_CLIENT') private readonly db: any,
        private readonly cacheService: CacheService,
    ) { }

    /**
     * 📊 DASHBOARD EJECUTIVO - SQL PURO
     * Consolida métricas reales de Ingresos, Egresos y Alertas.
     */
    async getDashboard(empresaId: string, periodo?: string, rol: 'emitidos' | 'recibidos' = 'recibidos') {
        try {
            const now = new Date();
            const mesActivo = periodo || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            // 1. Obtener RFC de la empresa
            const empresaResult = await this.db.all(sql`
                SELECT rfc, razon_social, sector, regimen_fiscal FROM empresas WHERE id = ${empresaId}
            `);
            if (!empresaResult.length) throw new BadRequestException('Empresa no encontrada');
            const { rfc: rfcEmpresa, razon_social, sector, regimen_fiscal } = empresaResult[0];

            const filterClause = rol === 'emitidos'
                ? sql`emisor_rfc = ${rfcEmpresa}`
                : sql`receptor_rfc = ${rfcEmpresa}`;

            // 2. Resumen del mes activo
            const kpis = await this.db.all(sql`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN tipo_comprobante = 'I' THEN total ELSE 0 END) as ingresos,
                    SUM(CASE WHEN tipo_comprobante = 'E' THEN total ELSE 0 END) as egresos,
                    COUNT(CASE WHEN tipo_comprobante = 'I' THEN 1 END) as count_ingresos,
                    COUNT(CASE WHEN tipo_comprobante = 'E' THEN 1 END) as count_egresos
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                AND ${filterClause}
                AND strftime('%Y-%m', fecha) = ${mesActivo}
                AND estado_sat != 'Cancelado'
            `);

            const counts = kpis[0] || { total: 0, ingresos: 0, egresos: 0, count_ingresos: 0, count_egresos: 0 };

            // 3. Alertas rápidas (Simplificadas para evitar errores de esquema)
            const riesgos = await this.db.all(sql`
                SELECT 
                    COUNT(CASE WHEN metodo_pago = 'PPD' THEN 1 END) as ppd_detectados,
                    COUNT(CASE WHEN version_cfdi = '3.3' AND strftime('%Y', fecha) >= '2024' THEN 1 END) as cfdi_33_extemporaneo
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                AND ${filterClause}
                AND strftime('%Y-%m', fecha) = ${mesActivo}
                AND estado_sat != 'Cancelado'
            `);

            const r = riesgos[0] || { ppd_detectados: 0, cfdi_33_extemporaneo: 0 };
            const alertasDashboard = [];
            if (Number(r.ppd_detectados) > 0 && rol === 'recibidos') alertasDashboard.push({ nivel: 'medio', titulo: 'Facturas PPD' });
            if (Number(r.cfdi_33_extemporaneo) > 0) alertasDashboard.push({ nivel: 'medio', titulo: 'CFDI 3.3 Detectado' });

            // 4. Top Concentración
            const topConcentracion = await this.db.all(sql`
                SELECT 
                    ${rol === 'emitidos' ? sql.raw('receptor_rfc') : sql.raw('emisor_rfc')} as rfc,
                    ${rol === 'emitidos' ? sql.raw('receptor_nombre') : sql.raw('emisor_nombre')} as nombre,
                    SUM(total) as total
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                AND ${filterClause}
                AND strftime('%Y-%m', fecha) = ${mesActivo}
                AND estado_sat != 'Cancelado'
                AND tipo_comprobante = 'I'
                GROUP BY rfc, nombre
                ORDER BY total DESC
                LIMIT 5
            `);

            return {
                empresa: {
                    razonSocial: razon_social,
                    rfc: rfcEmpresa,
                    sector,
                    regimenFiscal: regimen_fiscal
                },
                kpis: {
                    cfdiDelMes: {
                        total: Number(counts.total || 0),
                        ingresos: Number(counts.ingresos || 0),
                        egresos: Number(counts.egresos || 0),
                        countIngresos: Number(counts.count_ingresos || 0),
                        countEgresos: Number(counts.count_egresos || 0)
                    },
                    alertasActivas: {
                        total: alertasDashboard.length,
                        alta: alertasDashboard.filter(a => a.nivel === 'alto').length,
                        media: alertasDashboard.filter(a => a.nivel === 'medio').length
                    }
                },
                topConcentracion: topConcentracion.map(t => ({
                    id: t.rfc,
                    nombre: t.nombre,
                    total: Number(t.total || 0)
                })),
                perfilRiesgo: alertasDashboard.length > 5 ? 'CRÍTICO' : (alertasDashboard.length > 0 ? 'MEDIO' : 'BAJO')
            };

        } catch (error) {
            console.error('[StatsService] getDashboard Error:', error);
            throw new BadRequestException('Error en dashboard: ' + error.message);
        }
    }

    /**
     * 🛡️ SENTINEL SUMMARY - PUNTO DE VERDAD UNIFICADO
     */
    async getSentinelSummary(empresaId: string, periodo: string, flujoReq: 'EMITIDOS' | 'RECIBIDOS' | 'PAGOS') {
        try {
            const vista = (flujoReq === 'EMITIDOS') ? 'emitidos' : 'recibidos';
            const subFlujo = (flujoReq === 'PAGOS') ? 'pagos' : (flujoReq === 'EMITIDOS' ? 'ingresos' : 'gastos');

            const [dashboardData, alerteData, tendenciaData] = await Promise.all([
                this.getDashboard(empresaId, periodo, vista) as Promise<any>,
                this.getAlerts(empresaId, periodo, vista, subFlujo),
                this.getTendenciaAnual(empresaId)
            ]);

            return {
                periodo,
                flujo: flujoReq,
                empresaMeta: dashboardData.empresa,
                kpis: dashboardData.kpis.cfdiDelMes,
                perfilRiesgo: alerteData.hasAlerts ? (alerteData.alertas.some(a => a.tipo === 'ROJA') ? 'CRÍTICO' : 'MEDIO') : 'BAJO',
                alertas: alerteData.alertas,
                alertasMeta: alerteData.contexto,
                tendencia: tendenciaData,
                topConcentracion: dashboardData.topConcentracion,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('[StatsService] getSentinelSummary Error:', error);
            throw new BadRequestException('Error Sentinel Engine: ' + error.message);
        }
    }

    /**
     * 🛡️ ALERTAS FORENSES
     */
    async getAlerts(empresaId: string, mes: string, vista: 'emitidos' | 'recibidos', flujo: string) {
        try {
            const empresaResult = await this.db.all(sql`SELECT rfc FROM empresas WHERE id = ${empresaId}`);
            if (!empresaResult.length) throw new BadRequestException('Empresa no encontrada');
            const rfcEmpresa = empresaResult[0].rfc;

            const filterClause = vista === 'emitidos'
                ? sql`emisor_rfc = ${rfcEmpresa}`
                : sql`receptor_rfc = ${rfcEmpresa}`;

            const riesgos = await this.db.all(sql`
                SELECT 
                    COUNT(CASE WHEN metodo_pago = 'PPD' THEN 1 END) as ppd_detectados,
                    COUNT(CASE WHEN version_cfdi = '3.3' AND strftime('%Y', fecha) >= '2024' THEN 1 END) as cfdi_33_extemporaneo
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                AND ${filterClause}
                AND strftime('%Y-%m', fecha) = ${mes}
                AND estado_sat != 'Cancelado'
                AND tipo_comprobante = 'I'
            `);

            const r = riesgos[0] || {};
            const alertas = [];

            if (vista === 'recibidos' && Number(r.ppd_detectados) > 0) {
                alertas.push({
                    tipo: 'AMARILLA',
                    titulo: 'PAGOS PPD DETECTADOS',
                    desc: `Se identificaron ${r.ppd_detectados} CFDI en modalidad PPD. Asegúrese de contar con los complementos de pago correspondientes.`,
                    fundamento: 'Art. 29-A CFF'
                });
            }

            if (Number(r.cfdi_33_extemporaneo) > 0 && vista === 'emitidos') {
                alertas.push({
                    tipo: 'ROJA',
                    titulo: 'CFDI 3.3 EXTEMPORÁNEO',
                    desc: `Se detectaron ${r.cfdi_33_extemporaneo} facturas emitidas en versión 3.3 durante 2024+, lo cual es inválido.`,
                    fundamento: 'Anexo 20 RMF'
                });
            }

            return {
                alertas,
                mensaje: alertas.length === 0 ? "✓ OPERACIÓN COHERENTE" : `Se detectaron ${alertas.length} hallazgos.`,
                timestamp: new Date().toISOString(),
                hasAlerts: alertas.length > 0,
                contexto: { vista, flujo, periodo: mes }
            };
        } catch (error) {
            throw new BadRequestException('Error al calcular alertas: ' + error.message);
        }
    }

    /**
     * 📈 TENDENCIA ANUAL - COMPARATIVA
     */
    async getTendenciaAnual(empresaId: string) {
        try {
            const empresaResult = await this.db.all(sql`SELECT rfc FROM empresas WHERE id = ${empresaId}`);
            if (!empresaResult.length) throw new BadRequestException('Empresa no encontrada');
            const rfcEmpresa = empresaResult[0].rfc;

            const historico = await this.db.all(sql`
                SELECT 
                    strftime('%Y-%m', fecha) as mes_key,
                    SUM(CASE WHEN emisor_rfc = ${rfcEmpresa} AND tipo_comprobante = 'I' THEN total ELSE 0 END) as ingresos,
                    SUM(CASE WHEN receptor_rfc = ${rfcEmpresa} AND tipo_comprobante = 'I' THEN total ELSE 0 END) as egresos
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                AND estado_sat != 'Cancelado'
                GROUP BY mes_key
                ORDER BY mes_key ASC
            `);

            return {
                status: historico.length >= 2 ? "OK" : "INSUFICIENTE",
                mesesDisponibles: historico.length,
                data: historico.map(h => ({
                    mes: h.mes_key,
                    ingresos: Number(h.ingresos || 0),
                    egresos: Number(h.egresos || 0)
                }))
            };
        } catch (error) {
            throw new BadRequestException('Error en tendencia: ' + error.message);
        }
    }
}
