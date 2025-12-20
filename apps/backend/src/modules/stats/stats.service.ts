import { Injectable, Inject } from '@nestjs/common';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { cfdiRecibidos } from '../../database/schema/cfdi_recibidos.schema';
import { documentosSoporte } from '../../database/schema/documentos_soporte';
import { empresas } from '../../database/schema/empresas.schema';
import { CacheService } from '../../common/cache.service';

@Injectable()
export class StatsService {
    constructor(
        @Inject('DRIZZLE_CLIENT') private readonly db: any,
        private readonly cacheService: CacheService,
    ) { }

    /**
     * Obtiene el resumen de estadísticas para una empresa
     * LÓGICA CONTABLE CORRECTA:
     * - Ingreso: RFC_Emisor == RFC_Empresa AND tipo == 'I'
     * - Egreso: RFC_Receptor == RFC_Empresa AND tipo == 'I' (compras/gastos)
     * - Notas de Crédito: tipo == 'E' (restan según quién las emita/reciba)
     */
    async getResumen(empresaId: string) {
        // Obtener RFC de la empresa
        const [empresa] = await this.db
            .select({ rfc: empresas.rfc })
            .from(empresas)
            .where(eq(empresas.id, empresaId));

        if (!empresa) {
            throw new Error('Empresa no encontrada');
        }

        const rfcEmpresa = empresa.rfc;

        // Obtener fechas del mes actual
        const now = new Date();
        const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1);
        const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Formatear fechas para SQLite (YYYY-MM-DD)
        const fechaInicio = primerDiaMes.toISOString().split('T')[0];
        const fechaFin = ultimoDiaMes.toISOString().split('T')[0];

        // 1. Obtener todos los CFDIs del mes
        const cfdisMes = await this.db
            .select()
            .from(cfdiRecibidos)
            .where(
                and(
                    eq(cfdiRecibidos.empresaId, empresaId),
                    gte(cfdiRecibidos.fecha, fechaInicio),
                    lte(cfdiRecibidos.fecha, fechaFin),
                ),
            );

        // Clasificar contablemente cada CFDI
        let totalIngresos = 0;
        let countIngresos = 0;
        let totalEgresos = 0;
        let countEgresos = 0;

        cfdisMes.forEach((cfdi) => {
            const monto = Number(cfdi.total);
            const tipo = cfdi.tipoComprobante;
            const emisor = cfdi.emisorRfc;
            const receptor = cfdi.receptorRfc;

            // LÓGICA CONTABLE CORRECTA
            if (tipo === 'I') {
                // CFDI de Ingreso
                if (emisor === rfcEmpresa) {
                    // Nosotros emitimos → INGRESO (venta)
                    totalIngresos += monto;
                    countIngresos++;
                } else if (receptor === rfcEmpresa) {
                    // Nosotros recibimos → EGRESO (compra/gasto)
                    totalEgresos += monto;
                    countEgresos++;
                }
            } else if (tipo === 'E') {
                // CFDI de Egreso (Nota de Crédito)
                if (emisor === rfcEmpresa) {
                    // Nosotros emitimos NC → RESTA a ingresos
                    totalIngresos -= monto;
                    countIngresos++;
                } else if (receptor === rfcEmpresa) {
                    // Nosotros recibimos NC → RESTA a egresos
                    totalEgresos -= monto;
                    countEgresos++;
                }
            }
        });

        // 2. Obtener contador de evidencias por CFDI para calcular alertas
        const todosLosCfdis = await this.db
            .select({
                uuid: cfdiRecibidos.uuid,
            })
            .from(cfdiRecibidos)
            .where(eq(cfdiRecibidos.empresaId, empresaId));

        // Contar evidencias por cada CFDI
        let alertasAlta = 0; // 0 evidencias = rojo
        let alertasMedia = 0; // 1-2 evidencias = amarillo

        for (const cfdi of todosLosCfdis) {
            // Consultar las categorías de las evidencias existentes
            const evidencias = await this.db
                .select({
                    categoria: documentosSoporte.categoriaEvidencia
                })
                .from(documentosSoporte)
                .where(
                    and(
                        eq(documentosSoporte.cfdiUuid, cfdi.uuid),
                        eq(documentosSoporte.estado, 'completado'),
                    ),
                );

            const numEvidencias = evidencias.length;

            // Regla de Negocio: Si tiene Contrato, es materialidad FUERTE (Completo)
            const tieneContrato = evidencias.some(e =>
                e.categoria && e.categoria.toLowerCase().includes('contrato')
            );

            // Criterio de "Completo": >= 3 evidencias O tiene contrato
            const esCompleto = numEvidencias >= 3 || tieneContrato;

            if (numEvidencias === 0) {
                alertasAlta++;
            } else if (!esCompleto) {
                // Solo es alerta media (parcial) si tiene cosas PERO no es suficiente
                alertasMedia++;
            }
        }

        // 3. Gasto Proveedores de Riesgo
        // Por ahora retornamos 0, se puede implementar con una tabla de EFOS
        const gastoProveedoresRiesgo = 0;

        // 4. Expedientes Incompletos (CFDIs sin evidencias)
        const expedientesIncompletos = alertasAlta;

        return {
            totalCfdiMes: {
                ingresos: totalIngresos,
                egresos: totalEgresos,
                countIngresos,
                countEgresos,
            },
            alertasActivas: {
                alta: alertasAlta,
                media: alertasMedia,
            },
            gastoProveedoresRiesgo,
            expedientesIncompletos,
            topAlertas: this.generarTopAlertas(alertasAlta, alertasMedia),
        };
    }

    /**
     * Genera las alertas prioritarias basadas en los contadores
     */
    private generarTopAlertas(alertasAlta: number, alertasMedia: number) {
        const alertas = [];

        if (alertasAlta > 0) {
            alertas.push({
                id: 1,
                mensaje: `${alertasAlta} CFDI${alertasAlta > 1 ? 's' : ''} sin evidencias de materialidad`,
                nivel: 'alta' as const,
                fecha: new Date().toISOString(),
            });
        }

        if (alertasMedia > 0) {
            alertas.push({
                id: 2,
                mensaje: `${alertasMedia} CFDI${alertasMedia > 1 ? 's' : ''} con materialización parcial`,
                nivel: 'media' as const,
                fecha: new Date().toISOString(),
            });
        }

        if (alertasAlta === 0 && alertasMedia === 0) {
            alertas.push({
                id: 3,
                mensaje: 'Todos los CFDIs tienen materialización completa',
                nivel: 'baja' as const,
                fecha: new Date().toISOString(),
            });
        }

        return alertas;
    }

    /**
   * Obtiene datos completos del dashboard incluyendo histórico de 6 meses
   */
    async getDashboard(empresaId: string) {
        // Intentar obtener del caché
        const cacheKey = `dashboard:${empresaId}`;
        const cached = this.cacheService.get(cacheKey);

        if (cached) {
            return cached;
        }

        // Si no está en caché, calcular
        const resumen = await this.getResumen(empresaId);
        const historico = await this.getHistorico6Meses(empresaId);

        const result = {
            ...resumen,
            historico,
        };

        // Guardar en caché por 5 minutos
        this.cacheService.set(cacheKey, result, 5 * 60 * 1000);

        return result;
    }

    /**
     * Obtiene el histórico de ingresos y egresos de los últimos 6 meses
     * LÓGICA CONTABLE CORRECTA aplicada
     */
    private async getHistorico6Meses(empresaId: string) {
        // Obtener RFC de la empresa
        const [empresa] = await this.db
            .select({ rfc: empresas.rfc })
            .from(empresas)
            .where(eq(empresas.id, empresaId));

        if (!empresa) {
            throw new Error('Empresa no encontrada');
        }

        const rfcEmpresa = empresa.rfc;
        const meses = [];
        const now = new Date();

        // Generar los últimos 6 meses
        for (let i = 5; i >= 0; i--) {
            const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const primerDia = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
            const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

            const fechaInicio = primerDia.toISOString().split('T')[0];
            const fechaFin = ultimoDia.toISOString().split('T')[0];

            // Consultar todos los CFDIs del mes
            const cfdisMes = await this.db
                .select()
                .from(cfdiRecibidos)
                .where(
                    and(
                        eq(cfdiRecibidos.empresaId, empresaId),
                        gte(cfdiRecibidos.fecha, fechaInicio),
                        lte(cfdiRecibidos.fecha, fechaFin),
                    ),
                );

            // Clasificar contablemente
            let ingresos = 0;
            let egresos = 0;

            cfdisMes.forEach((cfdi) => {
                const monto = Number(cfdi.total);
                const tipo = cfdi.tipoComprobante;
                const emisor = cfdi.emisorRfc;
                const receptor = cfdi.receptorRfc;

                // LÓGICA CONTABLE CORRECTA
                if (tipo === 'I') {
                    if (emisor === rfcEmpresa) {
                        // Nosotros emitimos → INGRESO
                        ingresos += monto;
                    } else if (receptor === rfcEmpresa) {
                        // Nosotros recibimos → EGRESO
                        egresos += monto;
                    }
                } else if (tipo === 'E') {
                    // Notas de Crédito
                    if (emisor === rfcEmpresa) {
                        // Nosotros emitimos NC → RESTA a ingresos
                        ingresos -= monto;
                    } else if (receptor === rfcEmpresa) {
                        // Nosotros recibimos NC → RESTA a egresos
                        egresos -= monto;
                    }
                }
            });

            // Nombre del mes en español
            const nombreMes = fecha.toLocaleDateString('es-MX', { month: 'short' });

            meses.push({
                mes: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
                ingresos,
                egresos,
                fecha: fecha.toISOString(),
            });
        }

        return meses;
    }
}
