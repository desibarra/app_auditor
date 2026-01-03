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
     * Consolida métricas reales de Ingresos, Egresos y Alertas usando ROL PERSISTENTE.
     */
    async getDashboard(empresaId: string, periodo?: string, rolReq: 'emitidos' | 'recibidos' = 'recibidos') {
        try {
            const now = new Date();
            const mesActivo = periodo || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            // 1. Obtener Datos Empresa
            const empresaResult = await this.db.all(sql`
                SELECT rfc, razon_social, sector, regimen_fiscal FROM empresas WHERE id = ${empresaId}
            `);
            if (!empresaResult.length) throw new BadRequestException('Empresa no encontrada');
            const { rfc: rfcEmpresa, razon_social, sector, regimen_fiscal } = empresaResult[0];

            // 2. Resumen Consolidado USANDO COLUMNA 'rol'
            // Nota: rol = 'EMITIDO' son Ingresos, rol = 'RECIBIDO' son Gastos
            const kpis = await this.db.all(sql`
                SELECT 
                    COUNT(*) as total_general,
                    
                    /* Ingresos Netos: (EMITIDO+I) - (EMITIDO+E) Normalizado a MXN */
                    SUM(CASE 
                        WHEN rol = 'EMITIDO' AND tipo_comprobante = 'I' 
                        THEN (CASE WHEN moneda = 'MXN' THEN total ELSE total * COALESCE(tipo_cambio, 1) END) 
                        ELSE 0 
                    END) 
                    - SUM(CASE 
                        WHEN rol = 'EMITIDO' AND tipo_comprobante = 'E' 
                        THEN (CASE WHEN moneda = 'MXN' THEN total ELSE total * COALESCE(tipo_cambio, 1) END) 
                        ELSE 0 
                    END) 
                    as ingresos_totales,
                    
                    /* Egresos Netos: (RECIBIDO+I) - (RECIBIDO+E) Normalizado a MXN */
                    SUM(CASE 
                        WHEN rol = 'RECIBIDO' AND tipo_comprobante = 'I' 
                        THEN (CASE WHEN moneda = 'MXN' THEN total ELSE total * COALESCE(tipo_cambio, 1) END) 
                        ELSE 0 
                    END) 
                    - SUM(CASE 
                        WHEN rol = 'RECIBIDO' AND tipo_comprobante = 'E' 
                        THEN (CASE WHEN moneda = 'MXN' THEN total ELSE total * COALESCE(tipo_cambio, 1) END) 
                        ELSE 0 
                    END) 
                    as egresos_totales,

                    COUNT(CASE WHEN rol = 'EMITIDO' AND tipo_comprobante = 'I' THEN 1 END) as count_ingresos,
                    COUNT(CASE WHEN rol = 'RECIBIDO' AND tipo_comprobante = 'I' THEN 1 END) as count_egresos

                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                AND strftime('%Y-%m', fecha) = ${mesActivo}
                AND (UPPER(estatus_fiscal) = 'VIGENTE' OR estatus_fiscal IS NULL OR estatus_fiscal = 'PENDING')
            `);

            const counts = kpis[0] || { total_general: 0, ingresos_totales: 0, egresos_totales: 0, count_ingresos: 0, count_egresos: 0 };

            // 2.2 Cobrado Real (Flujo de Efectivo) - Validado con IMP_PAGADO de REP
            // ESTA ES LA ÚNICA VERDAD DEL DINERO
            const flujoEfectivo = await this.db.all(sql`
                SELECT
                    SUM(CASE WHEN p.rol = 'EMITIDO' THEN r.imp_pagado ELSE 0 END) as cobrado_real,
                    SUM(CASE WHEN p.rol = 'RECIBIDO' THEN r.imp_pagado ELSE 0 END) as pagado_real
                FROM cfdi_relaciones r
                JOIN cfdi_recibidos p ON p.uuid = r.cfdi_padre_uuid
                WHERE r.empresa_id = ${empresaId}
                AND strftime('%Y-%m', p.fecha) = ${mesActivo}
                AND (UPPER(p.estatus_fiscal) = 'VIGENTE' OR p.estatus_fiscal IS NULL OR p.estatus_fiscal = 'PENDING')
            `);
            const flujo = flujoEfectivo[0] || { cobrado_real: 0, pagado_real: 0 };

            // 2.3 Filtro por Rol activo para alertas y concentración
            // 'emitidos' en UI = 'EMITIDO' en DB
            const dbRol = rolReq === 'emitidos' ? 'EMITIDO' : 'RECIBIDO';

            // 3. Alertas rápidas (Usando ROL)
            const riesgos = await this.db.all(sql`
                SELECT 
                    COUNT(CASE WHEN metodo_pago = 'PPD' THEN 1 END) as ppd_detectados,
                    COUNT(CASE WHEN version_cfdi = '3.3' AND strftime('%Y', fecha) >= '2024' THEN 1 END) as cfdi_33_extemporaneo
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                AND rol = ${dbRol} 
                AND strftime('%Y-%m', fecha) = ${mesActivo}
                AND (UPPER(estatus_fiscal) = 'VIGENTE' OR estatus_fiscal IS NULL OR estatus_fiscal = 'PENDING')
            `);

            const r = riesgos[0] || { ppd_detectados: 0, cfdi_33_extemporaneo: 0 };
            const alertasDashboard = [];
            if (Number(r.ppd_detectados) > 0 && rolReq === 'recibidos') alertasDashboard.push({ nivel: 'medio', titulo: 'Facturas PPD' });
            if (Number(r.cfdi_33_extemporaneo) > 0) alertasDashboard.push({ nivel: 'medio', titulo: 'CFDI 3.3 Detectado' });

            // 4. Top Concentración
            const topConcentracion = await this.db.all(sql`
                SELECT 
                    ${rolReq === 'emitidos' ? sql.raw('receptor_rfc') : sql.raw('emisor_rfc')} as rfc,
                    ${rolReq === 'emitidos' ? sql.raw('receptor_nombre') : sql.raw('emisor_nombre')} as nombre,
                    SUM(CASE WHEN moneda = 'MXN' THEN total ELSE total * COALESCE(tipo_cambio, 1) END) as total
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                AND rol = ${dbRol}
                AND strftime('%Y-%m', fecha) = ${mesActivo}
                AND (UPPER(estatus_fiscal) = 'VIGENTE' OR estatus_fiscal IS NULL OR estatus_fiscal = 'PENDING')
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
                        total: Number(counts.total_general || 0),
                        ingresos: Number(counts.ingresos_totales || 0), // Facturado
                        egresos: Number(counts.egresos_totales || 0),   // Facturado
                        cobrada: Number(flujo.cobrado_real || 0),       // CASH
                        pagada: Number(flujo.pagado_real || 0),         // CASH
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
            const year = periodo.split('-')[0];

            const [dashboardData, alerteData, tendenciaData] = await Promise.all([
                this.getDashboard(empresaId, periodo, vista) as Promise<any>,
                this.getAlerts(empresaId, periodo, vista, subFlujo),
                this.getTendenciaAnual(empresaId, year)
            ]);

            return {
                periodo,
                flujo: flujoReq,
                empresaMeta: dashboardData.empresa,
                kpis: dashboardData.kpis.cfdiDelMes,
                perfilRiesgo: alerteData.hasAlerts ? (alerteData.alertas.some(a => a.tipo === 'ROJA') ? 'CRÍTICO' : 'MEDIO') : 'BAJO',
                vistaActiva: flujoReq,
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
            const dbRol = vista === 'emitidos' ? 'EMITIDO' : 'RECIBIDO';

            const riesgos = await this.db.all(sql`
                SELECT 
                    COUNT(CASE WHEN metodo_pago = 'PPD' THEN 1 END) as ppd_detectados,
                    COUNT(CASE WHEN version_cfdi = '3.3' AND strftime('%Y', fecha) >= '2024' THEN 1 END) as cfdi_33_extemporaneo
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                AND rol = ${dbRol}
                AND strftime('%Y-%m', fecha) = ${mes}
                AND (UPPER(estatus_fiscal) = 'VIGENTE' OR estatus_fiscal IS NULL OR estatus_fiscal = 'PENDING')
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
    async getTendenciaAnual(empresaId: string, year: string) {
        try {
            const targetYear = year || new Date().getFullYear().toString();

            const historico = await this.db.all(sql`
                SELECT 
                    strftime('%Y-%m', fecha) as mes_key,
                    SUM(CASE 
                        WHEN rol = 'EMITIDO' AND tipo_comprobante = 'I' 
                        THEN (CASE WHEN moneda = 'MXN' THEN total ELSE total * COALESCE(tipo_cambio, 1) END) 
                        ELSE 0 
                    END) as ingresos,
                    SUM(CASE 
                        WHEN rol = 'RECIBIDO' AND tipo_comprobante = 'I' 
                        THEN (CASE WHEN moneda = 'MXN' THEN total ELSE total * COALESCE(tipo_cambio, 1) END) 
                        ELSE 0 
                    END) as egresos
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                AND (UPPER(estatus_fiscal) = 'VIGENTE' OR estatus_fiscal IS NULL OR estatus_fiscal = 'PENDING')
                AND strftime('%Y', fecha) = ${targetYear}
                GROUP BY mes_key
                ORDER BY mes_key ASC
            `);

            const mesesDelAnio = Array.from({ length: 12 }, (_, i) => {
                const mes = String(i + 1).padStart(2, '0');
                return `${targetYear}-${mes}`;
            });

            const dataMap = new Map(historico.map((h: any) => [h.mes_key, h]));
            const fullHistory = mesesDelAnio.map(mesKey => {
                const h = dataMap.get(mesKey) as any;
                return {
                    mes: mesKey,
                    ingresos: Number(h?.ingresos || 0),
                    egresos: Number(h?.egresos || 0)
                };
            });

            return {
                status: historico.length >= 2 ? "OK" : "INSUFICIENTE",
                mesesDisponibles: historico.length,
                data: fullHistory
            };
        } catch (error) {
            throw new BadRequestException('Error en tendencia: ' + error.message);
        }
    }
}

