import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CfdiParserService, CfdiData } from './services/cfdi-parser.service';
import { RiskEngineService } from '../risk/risk.service';
import { cfdiRecibidos, cfdiImpuestos, empresas } from '../../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class CfdiService {
    constructor(
        @Inject('DRIZZLE_CLIENT') private db: any,
        private cfdiParserService: CfdiParserService,
        private riskEngine: RiskEngineService,
    ) { }

    /**
     * Detecta automáticamente la empresa basándose en el RFC
     * Regla: Si el RFC del receptor coincide con una empresa registrada, es esa empresa
     */
    private async detectarEmpresa(cfdiData: CfdiData): Promise<string | null> {
        try {
            // Buscar empresa por RFC del receptor
            const empresaReceptor = await this.db
                .select()
                .from(empresas)
                .where(eq(empresas.rfc, cfdiData.receptorRfc))
                .limit(1);

            if (empresaReceptor.length > 0) {
                return empresaReceptor[0].id;
            }

            // Si no se encuentra como receptor, buscar como emisor
            const empresaEmisor = await this.db
                .select()
                .from(empresas)
                .where(eq(empresas.rfc, cfdiData.emisorRfc))
                .limit(1);

            if (empresaEmisor.length > 0) {
                return empresaEmisor[0].id;
            }

            return null;
        } catch (error) {
            console.error('Error al detectar empresa:', error);
            return null;
        }
    }

    /**
     * Importa un archivo XML de CFDI
     * Detecta automáticamente la empresa basándose en el RFC
     */
    async importarXml(file: Express.Multer.File, empresaIdManual?: string) {
        try {
            // 1. Validar que sea un archivo XML
            if (!file.originalname.toLowerCase().endsWith('.xml')) {
                throw new BadRequestException('El archivo debe ser un XML');
            }

            // 2. Convertir buffer a string
            const xmlContent = file.buffer.toString('utf-8');

            // 3. Parsear XML
            const cfdiData: CfdiData = await this.cfdiParserService.parseXML(xmlContent);

            // 4. Detectar empresa automáticamente basándose en el RFC del receptor
            // IMPORTANTE: La detección automática tiene PRIORIDAD sobre el parámetro manual
            // Esto previene errores de asignación cuando el usuario carga XMLs desde otra empresa
            const empresaIdDetectada = await this.detectarEmpresa(cfdiData);
            const empresaId = empresaIdDetectada || empresaIdManual;

            if (!empresaId) {
                throw new BadRequestException(
                    `No se pudo detectar la empresa. RFC Receptor: ${cfdiData.receptorRfc}, RFC Emisor: ${cfdiData.emisorRfc}. ` +
                    `Por favor, registra la empresa primero.`
                );
            }

            // Log para debugging (se puede remover en producción)
            if (empresaIdDetectada && empresaIdManual && empresaIdDetectada !== empresaIdManual) {
                console.warn(
                    `[CFDI Import] Detección automática prevalece. ` +
                    `Manual: ${empresaIdManual}, Detectada: ${empresaIdDetectada} ` +
                    `(RFC Receptor: ${cfdiData.receptorRfc})`
                );
            }

            // 5. CLASIFICACIÓN SAT-GRADE (Log de Auditoría)
            const empresaObj = await this.db.query.empresas.findFirst({
                where: (e, { eq }) => eq(e.id, empresaId)
            });

            if (empresaObj) {
                const rol = cfdiData.emisorRfc === empresaObj.rfc ? 'EMITIDO' : 'RECIBIDO';
                const tipo = cfdiData.tipoComprobante;
                let dominio = 'DESCONOCIDO';

                if (tipo === 'I') dominio = 'INGRESOS';
                else if (tipo === 'E') dominio = 'EGRESOS';
                else if (tipo === 'N') dominio = 'NOMINA';
                else if (tipo === 'P') dominio = 'PAGOS';
                else if (tipo === 'T') dominio = 'TRASLADOS';

                console.log(`[SAT-Grade] CFDI clasificado correctamente: ROL=${rol} | TIPO=${tipo} | DOMINIO=${dominio}`);
            }

            // 6. Verificar si ya existe (ON CONFLICT DO NOTHING manual)
            const existente = await this.db
                .select()
                .from(cfdiRecibidos)
                .where(eq(cfdiRecibidos.uuid, cfdiData.uuid))
                .limit(1);

            if (existente.length > 0) {
                return {
                    success: true,
                    message: 'El CFDI ya existe en la base de datos',
                    uuid: cfdiData.uuid,
                    duplicado: true,
                    empresaId: existente[0].empresaId,
                };
            }

            // 6. Insertar en transacción
            await this.db.transaction(async (tx: any) => {
                // 6.1 Insertar CFDI
                await tx.insert(cfdiRecibidos).values({
                    uuid: cfdiData.uuid,
                    emisorRfc: cfdiData.emisorRfc,
                    emisorNombre: cfdiData.emisorNombre,
                    emisorRegimenFiscal: cfdiData.emisorRegimenFiscal,
                    receptorRfc: cfdiData.receptorRfc,
                    receptorNombre: cfdiData.receptorNombre,
                    receptorUsoCfdi: cfdiData.receptorUsoCfdi,
                    receptorDomicilioFiscal: cfdiData.receptorDomicilioFiscal,
                    serie: cfdiData.serie,
                    folio: cfdiData.folio,
                    fecha: cfdiData.fecha,
                    tipoComprobante: cfdiData.tipoComprobante,
                    subtotal: cfdiData.subtotal,
                    descuento: cfdiData.descuento || 0,
                    total: cfdiData.total,
                    moneda: cfdiData.moneda,
                    tipoCambio: cfdiData.tipoCambio || 1,
                    formaPago: cfdiData.formaPago,
                    metodoPago: cfdiData.metodoPago,
                    condicionesPago: cfdiData.condicionesPago,
                    lugarExpedicion: cfdiData.lugarExpedicion,
                    xmlOriginal: cfdiData.xmlOriginal,
                    estadoSat: 'Vigente', // Por defecto, se validará después
                    empresaId: empresaId,
                    procesado: true,
                    tieneErrores: false,
                });

                // 6.2 Insertar Impuestos
                if (cfdiData.impuestos && cfdiData.impuestos.length > 0) {
                    const impuestosValues = cfdiData.impuestos.map((imp) => ({
                        cfdiUuid: cfdiData.uuid,
                        nivel: imp.nivel,
                        tipo: imp.tipo,
                        impuesto: imp.impuesto,
                        impuestoNombre: imp.impuestoNombre,
                        tipoFactor: imp.tipoFactor,
                        tasaOCuota: imp.tasaOCuota,
                        base: imp.base,
                        importe: imp.importe,
                    }));

                    await tx.insert(cfdiImpuestos).values(impuestosValues);
                }
            });

            // 7. ANÁLISIS DE RIESGO (Sentinel Engine)
            // Se ejecuta fuera de la transacción para no bloquear la importación
            if (empresaId) {
                // Background async execution
                this.riskEngine.analyzeDeductibility(cfdiData, empresaId).catch(err =>
                    console.error(`[RiskEngine] Error analizando CFDI ${cfdiData.uuid}:`, err)
                );
            }

            return {
                success: true,
                message: 'CFDI importado exitosamente',
                uuid: cfdiData.uuid,
                emisor: cfdiData.emisorNombre,
                receptor: cfdiData.receptorNombre,
                total: cfdiData.total,
                impuestos: cfdiData.impuestos.length,
                duplicado: false,
                empresaId: empresaId,
                empresaDetectada: empresaIdDetectada !== null,
                // 🔄 Para refresh automático de métricas
                periodoFiscal: cfdiData.fecha.substring(0, 7), // YYYY-MM
                tipoComprobante: cfdiData.tipoComprobante,
            };
        } catch (error) {
            console.error('Error al importar CFDI:', error);
            throw new BadRequestException(
                `Error al importar CFDI: ${error.message}`,
            );
        }
    }

    /**
     * Obtiene los últimos CFDIs recibidos de una empresa específica
     */
    async getRecientes(empresaId: string, limit: number = 10) {
        try {
            const cfdis = await this.db
                .select({
                    uuid: cfdiRecibidos.uuid,
                    emisorRfc: cfdiRecibidos.emisorRfc,
                    emisorNombre: cfdiRecibidos.emisorNombre,
                    receptorRfc: cfdiRecibidos.receptorRfc,
                    receptorNombre: cfdiRecibidos.receptorNombre,
                    fecha: cfdiRecibidos.fecha,
                    tipoComprobante: cfdiRecibidos.tipoComprobante,
                    total: cfdiRecibidos.total,
                    moneda: cfdiRecibidos.moneda,
                    estadoSat: cfdiRecibidos.estadoSat,
                    fechaImportacion: cfdiRecibidos.fechaImportacion,
                })
                .from(cfdiRecibidos)
                .where(eq(cfdiRecibidos.empresaId, empresaId))
                .orderBy(cfdiRecibidos.fechaImportacion)
                .limit(limit);

            return cfdis;
        } catch (error) {
            console.error('Error al obtener CFDIs recientes:', error);
            throw new BadRequestException(
                `Error al obtener CFDIs: ${error.message}`,
            );
        }
    }

    /**
     * Obtiene la lista de empresas registradas
     */
    async getEmpresas() {
        try {
            const empresasList = await this.db
                .select({
                    id: empresas.id,
                    rfc: empresas.rfc,
                    razonSocial: empresas.razonSocial,
                    activa: empresas.activa,
                })
                .from(empresas)
                .where(eq(empresas.activa, true));

            return empresasList;
        } catch (error) {
            console.error('Error al obtener empresas:', error);
            throw new BadRequestException(
                `Error al obtener empresas: ${error.message}`,
            );
        }
    }

    /**
     * Obtiene todos los CFDIs de una empresa con paginación y filtros
     */
    async getAllCfdis(
        empresaId: string,
        page: number = 1,
        limit: number = 20,
        filters?: {
            fechaInicio?: string;
            fechaFin?: string;
            rfcEmisor?: string;
            tipoComprobante?: string;
        }
    ) {
        try {
            const offset = (page - 1) * limit;

            // Construir query base
            let query = this.db
                .select()
                .from(cfdiRecibidos)
                .where(eq(cfdiRecibidos.empresaId, empresaId));

            // Aplicar filtros si existen
            // Nota: Drizzle no tiene un método directo para AND múltiple dinámico
            // Por ahora retornamos todos y filtraremos en memoria si es necesario
            // En producción, usar query builder más avanzado

            const allCfdis = await query;

            // Filtrar en memoria (temporal - mejorar con query builder)
            let filteredCfdis = allCfdis;

            if (filters?.fechaInicio) {
                filteredCfdis = filteredCfdis.filter(
                    c => c.fecha >= filters.fechaInicio
                );
            }

            if (filters?.fechaFin) {
                filteredCfdis = filteredCfdis.filter(
                    c => c.fecha <= filters.fechaFin
                );
            }

            if (filters?.rfcEmisor) {
                filteredCfdis = filteredCfdis.filter(
                    c => c.emisorRfc.includes(filters.rfcEmisor.toUpperCase())
                );
            }

            if (filters?.tipoComprobante) {
                filteredCfdis = filteredCfdis.filter(
                    c => c.tipoComprobante === filters.tipoComprobante
                );
            }

            // Ordenar por fecha descendente
            filteredCfdis.sort((a, b) => {
                return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
            });

            // Paginar
            const total = filteredCfdis.length;
            const paginatedCfdis = filteredCfdis.slice(offset, offset + limit);

            return {
                data: paginatedCfdis,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            console.error('Error al obtener todos los CFDIs:', error);
            throw new BadRequestException(
                `Error al obtener CFDIs: ${error.message}`,
            );
        }
    }

    /**
     * Obtiene el detalle completo de un CFDI incluyendo sus impuestos
     */
    async getCfdiDetalle(uuid: string) {
        try {
            // Obtener CFDI
            const cfdi = await this.db
                .select()
                .from(cfdiRecibidos)
                .where(eq(cfdiRecibidos.uuid, uuid))
                .limit(1);

            if (cfdi.length === 0) {
                throw new BadRequestException(`CFDI con UUID ${uuid} no encontrado`);
            }

            // Obtener impuestos asociados
            const impuestos = await this.db
                .select()
                .from(cfdiImpuestos)
                .where(eq(cfdiImpuestos.cfdiUuid, uuid));

            return {
                cfdi: cfdi[0],
                impuestos,
            };
        } catch (error) {
            console.error('Error al obtener detalle del CFDI:', error);
            throw new BadRequestException(
                `Error al obtener detalle: ${error.message}`,
            );
        }
    }

    /**
     * Elimina un CFDI y sus impuestos asociados (CASCADE)
     */
    async deleteCfdi(uuid: string) {
        try {
            // Verificar que existe
            const cfdi = await this.db
                .select()
                .from(cfdiRecibidos)
                .where(eq(cfdiRecibidos.uuid, uuid))
                .limit(1);

            if (cfdi.length === 0) {
                throw new BadRequestException(`CFDI con UUID ${uuid} no encontrado`);
            }

            // Eliminar CFDI (los impuestos se eliminan automáticamente por CASCADE)
            await this.db
                .delete(cfdiRecibidos)
                .where(eq(cfdiRecibidos.uuid, uuid));

            return {
                success: true,
                message: `CFDI ${uuid} eliminado exitosamente`,
            };
        } catch (error) {
            console.error('Error al eliminar CFDI:', error);
            throw new BadRequestException(
                `Error al eliminar CFDI: ${error.message}`,
            );
        }
    }
    /**
     * Consulta el estado en tiempo real del CFDI en el SAT (SOAP)
     */
    async consultarEstadoSat(uuid: string, re: string, rr: string, tt: number): Promise<string> {
        // Formatear total a string como lo requiere el SAT (ej: 123.45)
        // A veces requiere total exacto con decimales.
        const totalStr = tt.toFixed(6).replace(/0+$/, '').replace(/\.$/, '.0'); // Ajuste básico, idealmente exacto del XML

        const soapBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
   <soapenv:Header/>
   <soapenv:Body>
      <tem:Consulta>
         <tem:expresionImpresa><![CDATA[?re=${re}&rr=${rr}&tt=${totalStr}&id=${uuid}]]></tem:expresionImpresa>
      </tem:Consulta>
   </soapenv:Body>
</soapenv:Envelope>`;

        try {
            // Usamos fetch nativo de Node.js
            const response = await fetch('https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': 'http://tempuri.org/IConsultaCFDIService/Consulta'
                },
                body: soapBody.trim()
            });

            if (!response.ok) {
                console.warn(`SAT SOAP Error ${response.status}: ${response.statusText}`);
                return 'Error';
            }

            const text = await response.text();

            // Regex para extraer Estado sin parseador XML pesado
            // Namespace suele ser 'a' o sin namespace
            const match = text.match(/<.*?:?Estado>(.*?)<\/.*?:?Estado>/);

            if (match && match[1]) {
                return match[1]; // Generalmente "Vigente" o "Cancelado"
            }
            return 'NoEncontrado';
        } catch (e) {
            console.error(`Error consultando SAT para UUID ${uuid}:`, e);
            return 'ErrorRed';
        }
    }

    /**
     * Sincroniza el estatus de todos los CFDIs 'Vigentes' de la empresa con el SAT
     */
    async sincronizarEmpresa(empresaId: string) {
        // Obtener CFDIs que asumimos vigentes para re-validar
        // Limitamos a los últimos 50 para no timeout, o por fecha.
        // MVP: Últimos 50 importados.
        const cfdis = await this.db
            .select()
            .from(cfdiRecibidos)
            .where(eq(cfdiRecibidos.empresaId, empresaId))
            .limit(50); // Límite de seguridad

        let actualizados = 0;
        let canceladosDetectados = 0;

        // Ejecutar en serie o paralelo limitado para no saturar SAT
        for (const cfdi of cfdis) {
            // Solo verificar si vale la pena (no verificar cancelados antiguos, aunque el usuario pide re-checar)
            // Validaremos TODOS los de la lista para asegurar.

            // Ajuste Total: El SAT es quisquilloso con el total. Usar total exacto del CFDI.
            const estadoReal = await this.consultarEstadoSat(
                cfdi.uuid,
                cfdi.emisorRfc,
                cfdi.receptorRfc,
                cfdi.total
            );

            if (estadoReal === 'Vigente' || estadoReal === 'Cancelado') {
                // Actualizar DB
                await this.db
                    .update(cfdiRecibidos)
                    .set({
                        estadoSat: estadoReal,
                        fechaValidacionSat: new Date()
                    })
                    .where(eq(cfdiRecibidos.uuid, cfdi.uuid));

                actualizados++;
                if (estadoReal === 'Cancelado' && cfdi.estadoSat !== 'Cancelado') {
                    canceladosDetectados++;
                }
            }


            // Pequeña pausa para no ser bloqueado
            await new Promise(r => setTimeout(r, 200));
        }

        return {
            procesados: cfdis.length,
            actualizados,
            canceladosDetectados,
            fecha: new Date()
        };
    }

    /**
     * 📊 RESUMEN MENSUAL DE CFDIS - TABLA DE CONTROL
     * ================================================
     * Retorna conteo de CFDIs por mes y tipo, pivoteado para tabla
     * 
     * INDEPENDIENTE de filtros - siempre muestra TODO
     * Para detectar faltantes rápidamente
     */
    async getResumenMensual(empresaId: string) {
        try {
            const { sql, desc } = await import('drizzle-orm');

            // Query raw para agrupar por mes y tipo
            const resultados = await this.db.all(sql`
                SELECT
                    strftime('%Y-%m', fecha) AS mes,
                    tipo_comprobante,
                    COUNT(*) AS total
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                GROUP BY mes, tipo_comprobante
                ORDER BY mes DESC
            `);

            // Pivotear resultados para estructura de tabla
            const mesesMap = new Map<string, {
                mes: string;
                I: number;
                E: number;
                P: number;
                N: number;
                T: number;
                total: number;
            }>();

            for (const row of resultados) {
                const mes = row.mes as string;
                const tipo = row.tipo_comprobante as string;
                const total = row.total as number;

                if (!mesesMap.has(mes)) {
                    mesesMap.set(mes, {
                        mes,
                        I: 0,
                        E: 0,
                        P: 0,
                        N: 0,
                        T: 0,
                        total: 0,
                    });
                }

                const mesData = mesesMap.get(mes)!;

                if (tipo === 'I') mesData.I = total;
                else if (tipo === 'E') mesData.E = total;
                else if (tipo === 'P') mesData.P = total;
                else if (tipo === 'N') mesData.N = total;
                else if (tipo === 'T') mesData.T = total;

                mesData.total += total;
            }

            // Convertir a array y ordenar
            const resumen = Array.from(mesesMap.values())
                .sort((a, b) => b.mes.localeCompare(a.mes));

            // 🆕 DETECTAR PATRONES Y MESES INCOMPLETOS
            const tiposEsperados = this.detectarTiposEsperados(resumen);

            const resumenConAlertas = resumen.map(mes => {
                const faltantes: string[] = [];
                let mesIncompleto = false;

                // Verificar tipos esperados basándose en historial
                if (tiposEsperados.I && mes.I === 0) faltantes.push('I');
                if (tiposEsperados.E && mes.E === 0) faltantes.push('E');
                if (tiposEsperados.P && mes.P === 0) faltantes.push('P');
                if (tiposEsperados.N && mes.N === 0) faltantes.push('N');
                if (tiposEsperados.T && mes.T === 0) faltantes.push('T');

                mesIncompleto = faltantes.length > 0;

                return {
                    ...mes,
                    mesIncompleto,
                    faltantes,
                    nivelAlerta: faltantes.length >= 2 ? 'high' : faltantes.length === 1 ? 'medium' : 'ok',
                };
            });

            // Contar meses incompletos
            const mesesIncompletos = resumenConAlertas.filter(m => m.mesIncompleto).length;

            return {
                success: true,
                resumen: resumenConAlertas,
                total_meses: resumen.length,
                meses_incompletos: mesesIncompletos,
                tipos_esperados: tiposEsperados,
            };
        } catch (error) {
            console.error('[CFDI Service] Error en resumen mensual:', error);
            throw new BadRequestException('Error al obtener resumen mensual');
        }
    }

    /**
     * 📈 MÉTRICAS REACTIVAS EN TIEMPO REAL
     * =====================================
     * Retorna KPIs para cards superiores del dashboard
     * 
     * RECALCULA SIEMPRE desde BD (no usa cache)
     * Se llama después de cada importación para actualizar UI
     */
    async getMetricas(empresaId: string, mes?: string) {
        try {
            const { sql } = await import('drizzle-orm');

            // Si no se especifica mes, usar mes actual
            if (!mes) {
                const now = new Date();
                mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }

            // 1. Total CFDIs del mes
            const totalMes = await this.db.all(sql`
                SELECT COUNT(*) as total
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                  AND strftime('%Y-%m', fecha) = ${mes}
            `);

            // 2. CFDIs por tipo en el mes
            const porTipo = await this.db.all(sql`
                SELECT 
                    tipo_comprobante,
                    COUNT(*) as total
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                  AND strftime('%Y-%m', fecha) = ${mes}
                GROUP BY tipo_comprobante
            `);

            // 3. Alertas activas (CFDIs cancelados no actualizados)
            const alertas = await this.db.all(sql`
                SELECT COUNT(*) as total
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                  AND estado_sat = 'Cancelado'
                  AND procesado = 0
            `);

            // 4. Expedientes incompletos (CFDIs sin evidencias - si existe tabla)
            // Por ahora returnar 0, se implementará cuando exista tabla evidencias
            const expedientesIncompletos = 0;

            // 5. Total general de CFDIs
            const totalGeneral = await this.db.all(sql`
                SELECT COUNT(*) as total
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
            `);

            // 6. Desglose por tipo
            const desgloseTipos: Record<string, number> = {
                I: 0,
                E: 0,
                P: 0,
                N: 0,
                T: 0,
            };

            for (const row of porTipo) {
                const tipo = row.tipo_comprobante as string;
                const total = row.total as number;
                if (tipo in desgloseTipos) {
                    desgloseTipos[tipo] = total;
                }
            }

            // 🆕 7. Meses incompletos (usando resumen mensual)
            const resumenData = await this.getResumenMensual(empresaId);
            const mesesIncompletos = resumenData.meses_incompletos || 0;

            return {
                success: true,
                mes,
                empresaId,
                metricas: {
                    cfdi_del_mes: totalMes[0]?.total || 0,
                    alertas_activas: alertas[0]?.total || 0,
                    expedientes_incompletos: expedientesIncompletos,
                    total_general: totalGeneral[0]?.total || 0,
                    meses_incompletos: mesesIncompletos, // 🆕 NUEVO KPI
                },
                desglose_tipos: desgloseTipos,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('[CFDI Service] Error en métricas:', error);
            throw new BadRequestException('Error al calcular métricas');
        }
    }

    /**
     * 🔍 Detecta qué tipos de CFDI son esperados basándose en el historial
     * 
     * Lógica: Si un tipo aparece en 60%+ de los meses, es "esperado"
     * M

ínimo 3 meses para considerarlo
     */
    private detectarTiposEsperados(resumen: Array<{
        I: number;
        E: number;
        P: number;
        N: number;
        T: number;
    }>): {
        I: boolean;
        E: boolean;
        P: boolean;
        N: boolean;
        T: boolean;
    } {
        if (resumen.length === 0) {
            // Sin historial: Asumir I y E como esperados por defecto
            return { I: true, E: true, P: false, N: false, T: false };
        }

        const totalMeses = resumen.length;
        const threshold = Math.max(3, Math.ceil(totalMeses * 0.6)); // Mínimo 3 meses o 60%

        const contadores = {
            I: resumen.filter(m => m.I > 0).length,
            E: resumen.filter(m => m.E > 0).length,
            P: resumen.filter(m => m.P > 0).length,
            N: resumen.filter(m => m.N > 0).length,
            T: resumen.filter(m => m.T > 0).length,
        };

        return {
            I: contadores.I >= threshold,
            E: contadores.E >= threshold,
            P: contadores.P >= threshold,
            N: contadores.N >= threshold,
            T: contadores.T >= threshold,
        };
    }

    /**
     * 📊 MÓDULO CFDI EMITIDOS
     * ======================
     * Endpoints dedicados para CFDIs donde empresa es EMISOR
     * Query base: emisor_rfc = empresa.rfc
     */

    /**
     * GET /api/cfdi/emitidos/resumen-mensual
     * Resumen mensual de CFDIs EMITIDOS por la empresa
     */
    async getResumenMensualEmitidos(empresaId: string) {
        try {
            const { sql } = await import('drizzle-orm');

            // 1. Obtener RFC de la empresa
            const empresa = await this.db.query.empresas.findFirst({
                where: (empresas, { eq }) => eq(empresas.id, empresaId),
            });

            if (!empresa) {
                throw new BadRequestException('Empresa no encontrada');
            }

            // 2. Query: CFDIs donde empresa es EMISOR
            const resultados = await this.db.all(sql`
                SELECT
                    strftime('%Y-%m', fecha) AS mes,
                    tipo_comprobante,
                    COUNT(*) AS total,
                    SUM(total) AS importe,
                    COUNT(DISTINCT receptor_rfc) AS clientes
                FROM cfdi_recibidos
                WHERE emisor_rfc = ${empresa.rfc}
                GROUP BY mes, tipo_comprobante
                ORDER BY mes DESC
            `);

            // 3. Pivotar datos
            const mesesMap = new Map<string, {
                mes: string;
                I: number;
                E: number;
                P: number;
                N: number;
                T: number;
                total: number;
                importe_total: number;
                clientes: number;
            }>();

            for (const row of resultados) {
                const mes = row.mes as string;
                const tipo = row.tipo_comprobante as string;
                const total = row.total as number;
                const importe = row.importe as number;
                const clientes = row.clientes as number;

                if (!mesesMap.has(mes)) {
                    mesesMap.set(mes, {
                        mes,
                        I: 0,
                        E: 0,
                        P: 0,
                        N: 0,
                        T: 0,
                        total: 0,
                        importe_total: 0,
                        clientes: 0,
                    });
                }

                const mesData = mesesMap.get(mes)!;

                if (tipo === 'I') mesData.I = total;
                else if (tipo === 'E') mesData.E = total;
                else if (tipo === 'P') mesData.P = total;
                else if (tipo === 'N') mesData.N = total;
                else if (tipo === 'T') mesData.T = total;

                mesData.total += total;
                mesData.importe_total += importe;
                mesData.clientes = Math.max(mesData.clientes, clientes);
            }

            const resumen = Array.from(mesesMap.values())
                .sort((a, b) => b.mes.localeCompare(a.mes));

            return {
                success: true,
                resumen,
                total_meses: resumen.length,
            };
        } catch (error) {
            console.error('[CFDI Service] Error en resumen mensual emitidos:', error);
            throw new BadRequestException('Error al obtener resumen de emitidos');
        }
    }

    /**
     * GET /api/cfdi/emitidos/metricas
     * KPIs de CFDIs EMITIDOS
     */
    async getMetricasEmitidos(empresaId: string, mes?: string) {
        try {
            const { sql } = await import('drizzle-orm');

            // 1. Obtener RFC de la empresa
            const empresa = await this.db.query.empresas.findFirst({
                where: (empresas, { eq }) => eq(empresas.id, empresaId),
            });

            if (!empresa) {
                throw new BadRequestException('Empresa no encontrada');
            }

            // 2. Determinar período (mes actual si no se especifica)
            const mesActual = mes || new Date().toISOString().substring(0, 7);
            const hoy = new Date().toISOString().substring(0, 10);

            // 3. KPI: CFDI Emitidos del Mes
            const cfdiDelMes = await this.db.all(sql`
                SELECT COUNT(*) as total
                FROM cfdi_recibidos
                WHERE emisor_rfc = ${empresa.rfc}
                  AND strftime('%Y-%m', fecha) = ${mesActual}
            `);

            // 4. KPI: Importe Total Emitido del Mes
            const importeMes = await this.db.all(sql`
                SELECT SUM(total) as importe
                FROM cfdi_recibidos
                WHERE emisor_rfc = ${empresa.rfc}
                  AND strftime('%Y-%m', fecha) = ${mesActual}
            `);

            // 5. KPI: Clientes Activos (receptores únicos del mes)
            const clientesActivos = await this.db.all(sql`
                SELECT COUNT(DISTINCT receptor_rfc) as clientes
                FROM cfdi_recibidos
                WHERE emisor_rfc = ${empresa.rfc}
                  AND strftime('%Y-%m', fecha) = ${mesActual}
            `);

            // 6. KPI: CFDIs Cargados Hoy
            const cargadosHoy = await this.db.all(sql`
                SELECT COUNT(*) as total
                FROM cfdi_recibidos
                WHERE emisor_rfc = ${empresa.rfc}
                  AND DATE(fecha_importacion / 1000, 'unixepoch') = ${hoy}
            `);

            // 7. KPI: Total General de Emitidos
            const totalGeneral = await this.db.all(sql`
                SELECT COUNT(*) as total
                FROM cfdi_recibidos
                WHERE emisor_rfc = ${empresa.rfc}
            `);

            return {
                success: true,
                metricas: {
                    cfdi_del_mes: cfdiDelMes[0]?.total || 0,
                    importe_total_mes: importeMes[0]?.importe || 0,
                    clientes_activos: clientesActivos[0]?.clientes || 0,
                    cargados_hoy: cargadosHoy[0]?.total || 0,
                    total_general: totalGeneral[0]?.total || 0,
                },
                periodo: mesActual,
                empresa_rfc: empresa.rfc,
            };
        } catch (error) {
            console.error('[CFDI Service] Error en métricas emitidos:', error);
            throw new BadRequestException('Error al obtener métricas de emitidos');
        }
    }

    /**
     * Helper privado para obtener métricas y resumen por ROL y TIPO
     * Garantiza segregación estricta de dominios (SAT-Grade) y soporta filtros dinámicos
     */
    private async getDatosSegregados(
        empresaId: string,
        rol: 'EMISOR' | 'RECEPTOR',
        tipo: string,
        filtros: { mes?: string, fechaInicio?: string, fechaFin?: string } = {}
    ) {
        try {
            const { sql } = await import('drizzle-orm');

            const empresa = await this.db.query.empresas.findFirst({
                where: (e, { eq }) => eq(e.id, empresaId),
            });

            if (!empresa) throw new BadRequestException('Empresa no encontrada');

            const campoRfc = rol === 'EMISOR' ? 'emisor_rfc' : 'receptor_rfc';
            const hoy = new Date().toISOString().substring(0, 10);

            // Lógica de Filtro de Fecha
            let condicionFecha = sql``;
            let periodoLabel = '';

            if (filtros.fechaInicio && filtros.fechaFin) {
                // Rango personalizado
                condicionFecha = sql`AND fecha >= ${filtros.fechaInicio} AND fecha <= ${filtros.fechaFin + 'T23:59:59'}`;
                periodoLabel = `Rango: ${filtros.fechaInicio} - ${filtros.fechaFin}`;
                console.log(`[KONTIFY·SENTINEL] Filtros aplicados → Query recalculada (${periodoLabel})`);
            } else {
                // Default: Mes específico o actual
                const mesTarget = filtros.mes || new Date().toISOString().substring(0, 7);
                condicionFecha = sql`AND strftime('%Y-%m', fecha) = ${mesTarget}`;
                periodoLabel = `Mes: ${mesTarget}`;
            }

            // 1. Resumen Mensual (Tabla) - SIEMPRE HISTÓRICO COMPLETO (Autoaditoría)
            // No filtramos por fecha aquí porque la tabla DEBE mostrar la tendencia completa para auditar
            const resumen = await this.db.all(sql`
                SELECT
                    strftime('%Y-%m', fecha) AS mes,
                    COUNT(*) AS total,
                    SUM(total) AS importe_total,
                    COUNT(DISTINCT receptor_rfc) AS clientes
                FROM cfdi_recibidos
                WHERE ${sql.raw(campoRfc)} = ${empresa.rfc}
                  AND tipo_comprobante = ${tipo}
                GROUP BY mes
                ORDER BY mes DESC
            `);

            // 2. KPIs del Periodo (Mes o Rango) - ESTOS SÍ OBEDECEN EL FILTRO
            const metricasRaw = await this.db.all(sql`
                SELECT
                    COUNT(*) as cfdi_del_mes,
                    SUM(total) as importe_total_mes,
                    COUNT(DISTINCT receptor_rfc) as clientes_activos
                FROM cfdi_recibidos
                WHERE ${sql.raw(campoRfc)} = ${empresa.rfc}
                  AND tipo_comprobante = ${tipo}
                  ${condicionFecha}
            `);

            // 2.1 Top Clientes (Para Gráfica de Concentración)
            const topClientes = await this.db.all(sql`
                SELECT 
                    receptor_rfc as rfc,
                    receptor_nombre as razon_social,
                    SUM(total) as total
                FROM cfdi_recibidos
                WHERE ${sql.raw(campoRfc)} = ${empresa.rfc}
                  AND tipo_comprobante = ${tipo}
                  ${condicionFecha}
                GROUP BY receptor_rfc
                ORDER BY total DESC
                LIMIT 5
            `);

            // 3. KPI: Cargados Hoy (Inmutable)
            const cargadosHoy = await this.db.all(sql`
                SELECT COUNT(*) as total
                FROM cfdi_recibidos
                WHERE ${sql.raw(campoRfc)} = ${empresa.rfc}
                  AND tipo_comprobante = ${tipo}
                  AND DATE(fecha_importacion / 1000, 'unixepoch') = ${hoy}
            `);

            // 4. KPI: Total General (Histórico del Dominio)
            const totalGeneral = await this.db.all(sql`
                SELECT COUNT(*) as total
                FROM cfdi_recibidos
                WHERE ${sql.raw(campoRfc)} = ${empresa.rfc}
                  AND tipo_comprobante = ${tipo}
            `);

            return {
                success: true,
                dominio: tipo === 'I' ? 'INGRESOS' : tipo === 'E' ? 'EGRESOS' : tipo === 'N' ? 'NOMINA' : 'PAGOS',
                rol: rol,
                tipo: tipo,
                resumen: resumen,
                metricas: {
                    cfdi_del_mes: metricasRaw[0]?.cfdi_del_mes || 0,
                    importe_total_mes: metricasRaw[0]?.importe_total_mes || 0,
                    clientes_activos: metricasRaw[0]?.clientes_activos || 0,
                    cargados_hoy: cargadosHoy[0]?.total || 0,
                    total_general: totalGeneral[0]?.total || 0,
                    top_clientes: topClientes
                },
                periodo: periodoLabel
            };
        } catch (error) {
            console.error(`[CfdiService] Error en getDatosSegregados (${rol}, ${tipo}):`, error);
            throw new BadRequestException('Error calculando datos segregados');
        }
    }

    // === ENDPOINTS EMITIDOS (Separados) ===

    async getEmitidosIngresos(empresaId: string, mes?: string, fi?: string, ff?: string) {
        return this.getDatosSegregados(empresaId, 'EMISOR', 'I', { mes, fechaInicio: fi, fechaFin: ff });
    }

    async getEmitidosNomina(empresaId: string, mes?: string, fi?: string, ff?: string) {
        return this.getDatosSegregados(empresaId, 'EMISOR', 'N', { mes, fechaInicio: fi, fechaFin: ff });
    }

    async getEmitidosPagos(empresaId: string, mes?: string, fi?: string, ff?: string) {
        return this.getDatosSegregados(empresaId, 'EMISOR', 'P', { mes, fechaInicio: fi, fechaFin: ff });
    }

    async getEmitidosEgresos(empresaId: string, mes?: string, fi?: string, ff?: string) {
        return this.getDatosSegregados(empresaId, 'EMISOR', 'E', { mes, fechaInicio: fi, fechaFin: ff });
    }

    // === ENDPOINTS RECIBIDOS (Separados) ===

    async getRecibidosGastos(empresaId: string, mes?: string, fi?: string, ff?: string) {
        // GASTOS = Recibidos Tipo I
        return this.getDatosSegregados(empresaId, 'RECEPTOR', 'I', { mes, fechaInicio: fi, fechaFin: ff });
    }

    async getRecibidosEgresos(empresaId: string, mes?: string, fi?: string, ff?: string) {
        // Mapeo E->EGRESOS (Estricto SAT - Notas de Crédito)
        return this.getDatosSegregados(empresaId, 'RECEPTOR', 'E', { mes, fechaInicio: fi, fechaFin: ff });
    }

    async getRecibidosPagos(empresaId: string, mes?: string, fi?: string, ff?: string) {
        return this.getDatosSegregados(empresaId, 'RECEPTOR', 'P', { mes, fechaInicio: fi, fechaFin: ff });
    }

    /**
     * 🕵️ AUDITORÍA DETALLADA (DRILL-DOWN 1x1)
     * Retorna el listado exacto de XMLs para un mes, rol y tipo específico.
     * IGNORA filtros globales, se enfoca en la celda clickeada.
     */
    async getDetalleAuditoria(
        empresaId: string,
        rol: 'EMISOR' | 'RECEPTOR',
        tipo: string,
        mes: string
    ) {
        const { sql } = await import('drizzle-orm');

        const empresa = await this.db.query.empresas.findFirst({
            where: (e, { eq }) => eq(e.id, empresaId),
        });

        if (!empresa) throw new BadRequestException('Empresa no encontrada');

        const campoRfc = rol === 'EMISOR' ? 'emisor_rfc' : 'receptor_rfc';

        // Query Forense 1x1 (Select * para evitar crash por columnas faltantes)
        const detalle = await this.db.all(sql`
            SELECT *
            FROM cfdi_recibidos
            WHERE ${sql.raw(campoRfc)} = ${empresa.rfc}
              AND tipo_comprobante = ${tipo}
              AND strftime('%Y-%m', fecha) = ${mes}
            ORDER BY fecha DESC
        `);

        return detalle;
    }
}
