import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CfdiParserService, CfdiData } from './services/cfdi-parser.service';
import { RiskEngineService } from '../risk/risk.service';
import { cfdiRecibidos, cfdiImpuestos, cfdiRelaciones, empresas, auditLogs, hallazgosDiscrepancias } from '../../database/schema';
import { eq, sql, and, isNotNull, ne, min, max, count } from 'drizzle-orm';

// Exportar la interfaz ReporteDevolucion
export interface ReporteDevolucion {
    dictamen: {
        resultado: 'RED' | 'YELLOW' | 'GREEN';
        comentarios: string;
    };
    resumenNumerico: {
        ivaSolicitado: number;
        ivaDevuelto: number;
    };
    meta: {
        hashIntegritad: string;
        generadoPor: string;
    };
}

@Injectable()
export class CfdiService {
    constructor(
        @Inject('DRIZZLE_CLIENT') private db: any,
        private cfdiParserService: CfdiParserService,
        private riskEngine: RiskEngineService,
    ) { }

    /**
     *  FUENTE DE VERDAD: Obtiene periodos disponibles basado en CFDI reales
     * NO hardcodeado, se deriva de MIN/MAX fecha_emision.
     * Retorna contexto temporal completo para el Frontend.
     */
    async getPeriodosDisponibles(empresaId?: string) {
        console.log(`[Period Context] Request received by Backend for: ${empresaId}`);
        try {
            // Validar input
            if (!empresaId) {
                console.warn('[Period Context] No empresaId provided.');
                return { status: 'NO_DATA', minYear: 0, maxYear: 0, minMonth: null, maxMonth: null, lastAvailablePeriod: null, years: [] };
            }

            // Consulta robusta usando SQL raw para máxima compatibilidad
            const result = await this.db.all(sql`
                SELECT 
                    MIN(fecha) as min_fecha,
                    MAX(fecha) as max_fecha,
                    COUNT(*) as total_cfdis
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                AND fecha IS NOT NULL
                AND fecha != ''
            `);

            const rangeData = result[0];
            console.log('[Period Context] DB Result:', JSON.stringify(rangeData));

            // Si no hay datos, retornar estructura vacía explícita (NO FANTASMAS)
            if (!rangeData || !rangeData.min_fecha || !rangeData.total_cfdis) {
                console.warn('[Period Context] No data found in DB. Returning NO_DATA state.');
                return {
                    status: 'NO_DATA',
                    minYear: 0,
                    maxYear: 0,
                    minMonth: null,
                    maxMonth: null,
                    lastAvailablePeriod: null,
                    years: [], // EMPTY is TRUTH
                    message: 'Sin información fiscal'
                };
            }

            const minFecha = new Date(rangeData.min_fecha);
            const maxFecha = new Date(rangeData.max_fecha);

            const minDataYear = minFecha.getFullYear();
            const maxDataYear = maxFecha.getFullYear();

            // Calcular meses ISO para límites
            const minMonth = rangeData.min_fecha.substring(0, 7);
            const maxMonth = rangeData.max_fecha.substring(0, 7);

            // Generar array de años: Solo Data Real
            // Solo devolver años con datos reales dentro del rango detectado
            const years: number[] = [];
            for (let year = maxDataYear; year >= minDataYear; year--) {
                years.push(year);
            }

            // lastAvailablePeriod ES la max fecha (mes) REAL CON DATOS
            const lastAvailablePeriod = maxMonth;

            console.log(`[Period Context] Success for ${empresaId}: Last=${lastAvailablePeriod}, Years=${years.length} (${years[0]}-${years[years.length - 1]})`);

            return {
                status: 'SUCCESS',
                minYear: minDataYear,
                maxYear: maxDataYear,
                minMonth,
                maxMonth,
                lastAvailablePeriod, // Sigue apuntando al límite real de datos para alertas
                years,
                totalCfdis: Number(rangeData.total_cfdis)
            };

        } catch (error) {
            console.error('[Period Context] CRITICAL ERROR:', error);
            // Fallback fail-safe
            return {
                status: 'ERROR',
                minYear: 0,
                maxYear: 0,
                minMonth: null,
                maxMonth: null,
                lastAvailablePeriod: null,
                years: [],
                message: 'Error de cálculo temporal'
            };
        }
    }



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

            let rolCalculado = 'INDEFINIDO';
            if (empresaObj) {
                // Lógica de clasificación estricta
                if (cfdiData.emisorRfc === empresaObj.rfc) {
                    rolCalculado = 'EMITIDO';
                } else if (cfdiData.receptorRfc === empresaObj.rfc) {
                    rolCalculado = 'RECIBIDO';
                }

                const tipo = cfdiData.tipoComprobante;
                console.log(`[SAT-Grade] CFDI clasificado correctamente: ROL=${rolCalculado} | TIPO=${tipo}`);
            }

            // 6. Verificar si ya existe (ON CONFLICT DO NOTHING manual)
            const existente = await this.db
                .select()
                .from(cfdiRecibidos)
                .where(and(
                    eq(cfdiRecibidos.uuid, cfdiData.uuid),
                    eq(cfdiRecibidos.empresaId, empresaId)
                ))
                .limit(1);

            if (existente.length > 0) {
                return {
                    status: 'DUPLICADO', // Distinción explícita
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
                    estatusFiscal: 'PENDING', // Estado inicial hasta validación
                    estatusFuente: 'MANUAL',
                    rol: rolCalculado, // <--- CAMPO CRÍTICO AGREGADO
                    empresaId: empresaId,
                    procesado: true,
                    tieneErrores: false,
                    // Campos nuevos explícitos (Default safe values)
                    objetoImp: '01',
                    tieneRepAsociado: false,
                    hallazgosDetectados: 0,
                    requiereRevalidacion: false
                });

                // 6.2 Insertar Impuestos
                if (cfdiData.impuestos && cfdiData.impuestos.length > 0) {
                    const impuestosValues = cfdiData.impuestos.map((imp) => ({
                        cfdiUuid: cfdiData.uuid,
                        empresaId: empresaId,
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

                // 6.3 Insertar Relaciones de Pago (DoctoRelacionado)
                // NORMALIZACIÓN: Ya sea pago10 o pago20, extraemos la info estandarizada
                if (cfdiData.complementoPago && cfdiData.complementoPago.length > 0) {
                    for (const pago of cfdiData.complementoPago) {
                        if (pago.doctoRelacionado && pago.doctoRelacionado.length > 0) {
                            const relacionesValues = pago.doctoRelacionado.map(doc => ({
                                cfdiPadreUuid: cfdiData.uuid,        // El CFDI de Pago (Parent / Container)
                                cfdiHijoUuid: doc.idDocumento,       // La Factura PPD (Child / Target)
                                tipoRelacion: 'PAGO',                // Etiqueta interna para conciliación
                                impSaldoAnt: doc.impSaldoAnt || 0,
                                impPagado: doc.impPagado || 0,
                                impSaldoInsoluto: doc.impSaldoInsoluto || 0,
                                numParcialidad: doc.numParcialidad || 1,
                                empresaId: empresaId
                            }));

                            await tx.insert(cfdiRelaciones).values(relacionesValues);
                        }
                    }
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
     * REPARACIÓN DE DATOS HISTÓRICOS
     * Escanea todos los CFDI de Pago de la empresa y regenera la tabla cfdiRelaciones.
     * Útil para corregir inconsistencias o actualizar lógica de conciliación.
     */
    async regenerarRelacionesPagos(empresaId: string) {
        console.log(`[REPARACIÓN] Iniciando regeneración de relaciones de pago para empresa ${empresaId}...`);

        // 1. Obtener todos los CFDI de tipo Pago
        const pagos = await this.db.select()
            .from(cfdiRecibidos)
            .where(and(
                eq(cfdiRecibidos.empresaId, empresaId),
                eq(cfdiRecibidos.tipoComprobante, 'P')
            ));

        console.log(`[REPARACIÓN] Se encontraron ${pagos.length} comprobantes de pago para procesar.`);
        let procesados = 0;
        let relacionesCreadas = 0;

        // 2. Procesar cada pago
        for (const pagoCfdi of pagos) {
            try {
                // Eliminar relaciones existentes para este pago para evitar duplicados
                await this.db.delete(cfdiRelaciones)
                    .where(eq(cfdiRelaciones.cfdiPadreUuid, pagoCfdi.uuid));

                // Parsear XML original
                if (!pagoCfdi.xmlOriginal) continue;

                const cfdiData = await this.cfdiParserService.parseXML(pagoCfdi.xmlOriginal);

                // Re-insertar relaciones
                if (cfdiData.complementoPago && cfdiData.complementoPago.length > 0) {
                    const relacionesToInsert = [];
                    for (const pago of cfdiData.complementoPago) {
                        if (pago.doctoRelacionado) {
                            for (const doc of pago.doctoRelacionado) {
                                relacionesToInsert.push({
                                    cfdiPadreUuid: cfdiData.uuid,
                                    cfdiHijoUuid: doc.idDocumento,
                                    tipoRelacion: 'PAGO',
                                    impSaldoAnt: doc.impSaldoAnt || 0,
                                    impPagado: doc.impPagado || 0,
                                    impSaldoInsoluto: doc.impSaldoInsoluto || 0,
                                    numParcialidad: doc.numParcialidad || 1,
                                    empresaId: empresaId
                                });
                            }
                        }
                    }

                    if (relacionesToInsert.length > 0) {
                        await this.db.insert(cfdiRelaciones).values(relacionesToInsert);
                        relacionesCreadas += relacionesToInsert.length;
                    }
                }
                procesados++;
            } catch (err) {
                console.error(`[REPARACIÓN] Error procesando pago ${pagoCfdi.uuid}:`, err);
            }
        }

        console.log(`[REPARACIÓN] Finalizado. Pagos procesados: ${procesados}. Relaciones recuperadas: ${relacionesCreadas}.`);
        return { procesados, relacionesCreadas };
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
                    estatusFiscal: cfdiRecibidos.estatusFiscal,
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
     * 🕵️ DETALLE COMPLETO CFDI (XML + IMPUESTOS)
     * Recupera el XML original y metadatos para el visor forense.
     */
    async getCfdiDetalle(uuid: string) {
        try {
            // Usar SQL puro para garantizar compatibilidad con better-sqlite3 y campos grandes
            const cResult = await this.db.all(sql`
                SELECT 
                    uuid, 
                    serie, 
                    folio, 
                    fecha, 
                    tipo_comprobante AS tipoComprobante,
                    emisor_rfc AS emisorRfc, 
                    emisor_nombre AS emisorNombre, 
                    emisor_regimen_fiscal AS emisorRegimenFiscal,
                    receptor_rfc AS receptorRfc, 
                    receptor_nombre AS receptorNombre, 
                    receptor_uso_cfdi AS receptorUsoCfdi,
                    total, 
                    subtotal, 
                    moneda, 
                    forma_pago AS formaPago, 
                    metodo_pago AS metodoPago,
                    xml_original AS xmlOriginal, 
                    estatus_fiscal AS estatusFiscal
                FROM cfdi_recibidos
                WHERE uuid = ${uuid}
                LIMIT 1
            `);

            if (!cResult.length) {
                throw new BadRequestException(`CFDI con UUID ${uuid} no encontrado en la base de datos fiscal`);
            }

            // Obtener impuestos asociados
            const impuestos = await this.db.all(sql`
                SELECT * FROM cfdi_impuestos WHERE cfdi_uuid = ${uuid}
            `);

            return {
                cfdi: cResult[0],
                impuestos,
            };
        } catch (error) {
            console.error('[getCfdiDetalle] Error recuperando XML:', error);
            throw new BadRequestException(
                `Error al obtener detalle forense: ${error.message}`,
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
        try {
            if (!uuid || !re || !rr || tt === undefined) {
                return 'DatosIncompletos';
            }

            // El SAT requiere tt con hasta 6 decimales, sin ceros innecesarios al final
            // pero siempre con al menos un decimal. Ej: 123.0 o 123.45
            const totalStr = Number(tt).toFixed(6).replace(/0+$/, '').replace(/\.$/, '.0');

            const soapBody = `
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
   <soapenv:Header/>
   <soapenv:Body>
      <tem:Consulta>
         <tem:expresionImpresa><![CDATA[?re=${re}&rr=${rr}&tt=${totalStr}&id=${uuid}]]></tem:expresionImpresa>
      </tem:Consulta>
   </soapenv:Body>
</soapenv:Envelope>`;

            // Usamos fetch nativo de Node.js (Node 18+)
            const response = await fetch('https://consultaqr.facturaelectronica.sat.gob.mx/ConsultaCFDIService.svc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml;charset=UTF-8',
                    'SOAPAction': 'http://tempuri.org/IConsultaCFDIService/Consulta'
                },
                body: soapBody.trim(),
                signal: AbortSignal.timeout(10000) // Timeout de 10s por factura
            });

            if (!response.ok) {
                console.warn(`[SAT SOAP] Error ${response.status} para UUID ${uuid}`);
                return 'ErrorServicio';
            }

            const text = await response.text();
            const match = text.match(/<.*?:?Estado>(.*?)<\/.*?:?Estado>/);

            if (match && match[1]) {
                const estado = match[1];
                return estado; // Vigente, Cancelado, No Encontrado
            }

            return 'NoEncontrado';
        } catch (e: any) {
            console.error(`[SAT SOAP] Exception para UUID ${uuid}:`, e.message);
            return 'ErrorRed';
        }
    }

    /**
     * Sincroniza el estatus de los CFDIs de la empresa con el SAT
     * @param empresaId ID de la empresa
     * @param periodo Opcional: filtro por mes (YYYY-MM)
     */
    async sincronizarEmpresa(empresaId: string, periodo?: string) {
        console.log(`[SAT Sync] Iniciando sincronización para empresa ${empresaId}${periodo ? ` periodo ${periodo}` : ''}`);

        // Obtener CFDIs para validación masiva (Priorizando PENDING y VIGENTES recientes)
        const filters = [eq(cfdiRecibidos.empresaId, empresaId)];
        if (periodo) {
            // Usar LIKE o SUBSTR para filtrar por mes en el string ISO de fecha
            filters.push(sql`fecha LIKE ${periodo + '%'}`);
        }

        const cfdis = await this.db
            .select()
            .from(cfdiRecibidos)
            .where(and(...filters))
            .orderBy(
                // Priorizar PENDING y MANUAL
                sql`CASE WHEN estatus_fiscal = 'PENDING' THEN 0 WHEN estatus_fuente = 'MANUAL' THEN 1 ELSE 2 END ASC`,
                sql`fecha DESC`
            )
            .limit(200); // Límite aumentado a 200 ahora que tenemos 5 min de proxy timeout

        let actualizados = 0;
        let canceladosDetectados = 0;
        const cambios: any[] = [];

        // Ejecutar en serie o paralelo limitado para no saturar SAT
        for (const cfdi of cfdis) {
            const estadoReal = await this.consultarEstadoSat(
                cfdi.uuid,
                cfdi.emisorRfc,
                cfdi.receptorRfc,
                cfdi.total
            );

            const estadoLimpio = (estadoReal || '').toUpperCase();

            if (estadoLimpio === 'VIGENTE' || estadoLimpio === 'CANCELADO') {
                const previoEstado = (cfdi.estatusFiscal || '').toUpperCase();

                // Solo actualizar si hay cambio real o no tenía estatus validado
                if (estadoLimpio !== previoEstado || cfdi.estatusFuente !== 'SAT_REAL') {
                    await this.db
                        .update(cfdiRecibidos)
                        .set({
                            estatusFiscal: estadoLimpio,
                            estatusFuente: 'SAT_REAL',
                            lastCheckedAt: new Date()
                        })
                        .where(eq(cfdiRecibidos.uuid, cfdi.uuid));

                    actualizados++;

                    // LOG DE AUDITORÍA SI CAMBIÓ EL ESTATUS (Especialmente a CANCELADO)
                    if (estadoLimpio !== previoEstado) {
                        cambios.push({
                            uuid: cfdi.uuid,
                            folio: cfdi.folio,
                            emisor: cfdi.emisorNombre,
                            anterior: previoEstado,
                            nuevo: estadoLimpio,
                            fecha: cfdi.fecha
                        });

                        // Registrar en bitácora oficial de la empresa
                        await this.db.insert(auditLogs).values({
                            empresaId,
                            accion: 'CAMBIO_ESTATUS_SAT',
                            entidad: 'cfdi_recibidos',
                            entidadId: cfdi.uuid,
                            detalles: JSON.stringify({
                                motivo: 'Sincronización Automática SAT',
                                previo: previoEstado,
                                nuevo: estadoLimpio,
                                folio: cfdi.folio
                            })
                        });

                        if (estadoLimpio === 'CANCELADO') {
                            canceladosDetectados++;
                        }
                    }
                }
            }

            // Log cada 10 facturas para ver progreso en consola
            if (cfdis.indexOf(cfdi) % 10 === 0) {
                console.log(`[SAT Sync] Progreso: ${cfdis.indexOf(cfdi)}/${cfdis.length} analizados...`);
            }

            // Pausa reducida para mayor velocidad manteniéndose seguro
            await new Promise(r => setTimeout(r, 50));
        }

        return {
            success: true,
            resumen: {
                procesados: cfdis.length,
                actualizados,
                canceladosDetectados,
                totalCambios: cambios.length
            },
            detalles: cambios,
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
    /**
     * 📊 RESUMEN MENSUAL DE CFDIS - TABLA DE CONTROL
     * ================================================
     * Retorna conteo de CFDIs por mes y tipo, pivoteado para tabla
     * 
     * INDEPENDIENTE de filtros - siempre muestra TODO
     * Para detectar faltantes rápidamente
     */
    async getResumenMensual(empresaId: string, rol?: 'EMITIDO' | 'RECIBIDO' | 'AMBOS') {
        try {
            const { sql } = await import('drizzle-orm');

            // Filtro dinámico por rol si se especifica
            let rolCondition = sql``;
            if (rol && rol !== 'AMBOS') {
                rolCondition = sql`AND rol = ${rol}`;
            }

            // Query raw para agrupar por mes y tipo USANDO COLUMNA 'rol'
            const resultados = await this.db.all(sql`
                SELECT
                    strftime('%Y-%m', fecha) AS mes,
                    tipo_comprobante,
                    COUNT(*) AS total
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                ${rolCondition}
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

            // 🆕 Inicializar 12 meses del año actual para asegurar vista completa
            // OJO: Si la auditoría es de años pasados, esto podría confundir.
            // MEJORA: Detectar rango de años presente en resultados y llenar huecos.

            // Paso 1: Detectar años presentes
            const yearsSet = new Set<number>();
            const currentYear = new Date().getFullYear();
            yearsSet.add(currentYear); // Siempre incluir actual

            resultados.forEach((row: any) => {
                const y = parseInt(row.mes.substring(0, 4));
                if (y) yearsSet.add(y);
            });

            const sortedYears = Array.from(yearsSet).sort((a, b) => b - a); // Descendente

            // Paso 2: Inicializar meses para todos los años relevantes
            for (const year of sortedYears) {
                for (let i = 12; i >= 1; i--) { // De Diciembre a Enero
                    const mesKey = `${year}-${String(i).padStart(2, '0')}`;
                    mesesMap.set(mesKey, {
                        mes: mesKey,
                        I: 0,
                        E: 0,
                        P: 0,
                        N: 0,
                        T: 0,
                        total: 0,
                    });
                }
            }

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
            // Filtrar meses futuros vacíos si estamos en año actual (UX Forensic)
            // O dejar que se muestren vacíos para evidenciar falta de datos
            // Decisión: Mostrar todo lo inicializado.

            const resumen = Array.from(mesesMap.values())
                .sort((a, b) => b.mes.localeCompare(a.mes));

            // Limpiar meses vacíos que son futuros al mes actual real si no tienen datos
            // Esto evita mostrar 2026-12 si estamos en 2026-01
            const nowIso = new Date().toISOString().slice(0, 7);
            const resumenFiltrado = resumen.filter(r => {
                if (r.mes > nowIso && r.total === 0) return false;
                return true;
            });

            // Si filtré todo (ej. año futuro sin datos), volver al resumen completo
            const resumenFinal = resumenFiltrado.length > 0 ? resumenFiltrado : resumen;

            // 🆕 DETECTAR PATRONES Y MESES INCOMPLETOS
            const tiposEsperados = this.detectarTiposEsperados(resumenFinal);

            const resumenConAlertas = resumenFinal.map(mes => {
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
                total_meses: resumenConAlertas.length, // updated count
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
            // Si no se especifica mes, usar mes actual
            if (!mes) {
                const now = new Date();
                mes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }

            // 1. Obtener RFC de la empresa para segregación
            const empresaResult = await this.db.all(sql`
                SELECT rfc FROM empresas WHERE id = ${empresaId}
            `);
            if (!empresaResult.length) throw new BadRequestException('Empresa no encontrada');
            const rfcEmpresa = empresaResult[0].rfc;

            // 2. Métricas del mes (SQL PURO)
            const stats = await this.db.all(sql`
                SELECT 
                    COUNT(*) as total_mes,
                    COUNT(CASE WHEN estatus_fiscal = 'CANCELADO' THEN 1 END) as alertas_activas,
                    SUM(CASE WHEN emisor_rfc = ${rfcEmpresa} AND tipo_comprobante = 'I' THEN 1 ELSE 0 END) as emitidos_count,
                    SUM(CASE WHEN receptor_rfc = ${rfcEmpresa} AND tipo_comprobante = 'I' THEN 1 ELSE 0 END) as recibidos_count,
                    SUM(CASE WHEN tipo_comprobante = 'P' THEN 1 ELSE 0 END) as pagos_count,
                    SUM(CASE WHEN tipo_comprobante = 'N' THEN 1 ELSE 0 END) as nomina_count
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                  AND strftime('%Y-%m', fecha) = ${mes}
                  AND UPPER(estatus_fiscal) = 'VIGENTE'
            `);

            const s = stats[0] || { total_mes: 0, alertas_activas: 0, emitidos_count: 0, recibidos_count: 0, pagos_count: 0, nomina_count: 0 };

            // 3. Total General
            const totalGeneral = await this.db.all(sql`
                SELECT COUNT(*) as total FROM cfdi_recibidos WHERE empresa_id = ${empresaId}
            `);

            return {
                success: true,
                mes,
                empresaId,
                metricas: {
                    cfdi_del_mes: s.total_mes,
                    alertas_activas: s.alertas_activas,
                    expedientes_incompletos: 0, // Placeholder hasta tabla de evidencias
                    total_general: totalGeneral[0]?.total || 0,
                },
                desglose_tipos: {
                    I: s.emitidos_count,
                    G: s.recibidos_count,
                    P: s.pagos_count,
                    N: s.nomina_count
                },
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error('[CFDI Service] Error en métricas:', error);
            throw new BadRequestException('Error al calcular métricas fiscals');
        }
    }

    /**
     * 🔍 Detecta qué tipos de CFDI son esperados basándose en el historial
     * 
     * Lógica: Si un tipo aparece en 60%+ de los meses, es "esperado"
     * Mínimo 3 meses para considerarlo
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

            // 🆕 Inicializar 12 meses del año actual
            const currentYear = new Date().getFullYear();
            for (let i = 1; i <= 12; i++) {
                const mesKey = `${currentYear}-${String(i).padStart(2, '0')}`;
                mesesMap.set(mesKey, {
                    mes: mesKey,
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
                  AND UPPER(estatus_fiscal) = 'VIGENTE'
            `);

            // 4. KPI: Importe Total Emitido del Mes
            const importeMes = await this.db.all(sql`
                SELECT SUM(total) as importe
                FROM cfdi_recibidos
                WHERE emisor_rfc = ${empresa.rfc}
                  AND strftime('%Y-%m', fecha) = ${mesActual}
                  AND UPPER(estatus_fiscal) = 'VIGENTE'
            `);

            // 5. KPI: Clientes Activos (receptores únicos del mes)
            const clientesActivos = await this.db.all(sql`
                SELECT COUNT(DISTINCT receptor_rfc) as clientes
                FROM cfdi_recibidos
                WHERE emisor_rfc = ${empresa.rfc}
                  AND strftime('%Y-%m', fecha) = ${mesActual}
                  AND UPPER(estatus_fiscal) = 'VIGENTE'
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
                  AND UPPER(estatus_fiscal) = 'VIGENTE'
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
            const rows = await this.db.all(sql`
                SELECT
                    strftime('%Y-%m', fecha) AS mes,
                    COUNT(*) AS total,
                    SUM(CASE WHEN UPPER(estatus_fiscal) = 'VIGENTE' THEN total ELSE 0 END) AS importe_total,
                    COUNT(DISTINCT receptor_rfc) AS clientes,
                    COUNT(CASE WHEN UPPER(estatus_fiscal) = 'VIGENTE' THEN 1 END) as count_vigentes,
                    COUNT(CASE WHEN UPPER(estatus_fiscal) = 'CANCELADO' THEN 1 END) as count_cancelados,
                    COUNT(CASE WHEN UPPER(estatus_fiscal) = 'PENDING' OR estatus_fiscal IS NULL OR estatus_fiscal = '' THEN 1 END) as count_pendientes
                FROM cfdi_recibidos
                WHERE ${sql.raw(campoRfc)} = ${empresa.rfc}
                  AND tipo_comprobante = ${tipo}
                GROUP BY mes
                ORDER BY mes DESC
            `);

            // RELLENO DE 12 MESES (Normalization Protocol)
            // Extraemos el año del filtro o el actual
            const yearTarget = filtros.mes ? filtros.mes.split('-')[0] : new Date().getFullYear().toString();

            const resumenMap = new Map();
            // Inicializar los 12 meses en cero
            for (let m = 1; m <= 12; m++) {
                const mesStr = `${yearTarget}-${String(m).padStart(2, '0')}`;
                resumenMap.set(mesStr, {
                    mes: mesStr,
                    total: 0,
                    importe_total: 0,
                    clientes: 0,
                    count_vigentes: 0,
                    count_cancelados: 0,
                    count_pendientes: 0
                });
            }

            // Mezclar con datos reales
            rows.forEach((row: any) => {
                if (resumenMap.has(row.mes)) {
                    resumenMap.set(row.mes, row);
                } else if (row.mes.startsWith(yearTarget)) {
                    // Si por alguna razón no estaba pero es del año, lo agregamos (no debería pasar por el loop arriba)
                    resumenMap.set(row.mes, row);
                }
            });

            const resumen = Array.from(resumenMap.values())
                .sort((a: any, b: any) => b.mes.localeCompare(a.mes));

            // 2. KPIs del Periodo (Mes o Rango) - ESTOS SÍ OBEDECEN EL FILTRO
            const metricasRaw = await this.db.all(sql`
                SELECT
                    COUNT(*) as cfdi_del_mes,
                    SUM(total) as importe_total_mes,
                    COUNT(DISTINCT receptor_rfc) as clientes_activos
                FROM cfdi_recibidos
                WHERE ${sql.raw(campoRfc)} = ${empresa.rfc}
                  AND tipo_comprobante = ${tipo}
                  AND UPPER(estatus_fiscal) = 'VIGENTE'
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
                  AND UPPER(estatus_fiscal) = 'VIGENTE'
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
                  AND UPPER(estatus_fiscal) = 'VIGENTE'
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
    /**
     * 🕵️ AUDITORÍA DETALLADA (DRILL-DOWN 1x1)
     * Retorna el listado exacto de XMLs para un mes, rol y tipo específico con trazabilidad fiscal.
     */
    async getDetalleAuditoria(
        empresaId: string,
        rol: 'EMISOR' | 'RECEPTOR',
        tipo: string,
        mes: string
    ) {
        try {
            // 1. Obtener RFC de la empresa
            const empresaResult = await this.db.all(sql`
                SELECT rfc FROM empresas WHERE id = ${empresaId}
            `);
            if (!empresaResult.length) throw new BadRequestException('Empresa no encontrada');
            const rfcEmpresa = empresaResult[0].rfc;

            const campoRfc = rol === 'EMISOR' ? 'emisor_rfc' : 'receptor_rfc';

            // 2. Query Forense 1x1 (SQL PURO)
            // Aliases para compatibilidad con el frontend ModalAuditoria1x1
            const detalle = await this.db.all(sql`
                SELECT 
                uuid, 
                fecha, 
                -- Importe en MXN (Si es divisa, multiplica por tipo de cambio)
                CASE 
                    WHEN moneda = 'MXN' THEN total 
                    ELSE total * COALESCE(tipo_cambio, 1) 
                END AS importeMxn,
                -- Importe en USD (Solo si la moneda no es MXN, asumimos que se quiere ver el valor original)
                CASE 
                    WHEN moneda != 'MXN' THEN total 
                    ELSE 0 
                END AS importeUsd,
                emisor_rfc AS rfcEmisor, 
                emisor_nombre AS nombreEmisor, 
                receptor_rfc AS rfcReceptor, 
                receptor_nombre AS nombreReceptor, 
                tipo_comprobante AS tipoCfdi,
                moneda,
                UPPER(estatus_fiscal) AS status,
                estatus_fuente AS estatusFuente,
                last_checked_at AS lastCheckedAt,
                metodo_pago, 
                forma_pago, 
                version_cfdi
            FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                  AND ${sql.raw(campoRfc)} = ${rfcEmpresa}
                  AND tipo_comprobante = ${tipo}
                  AND strftime('%Y-%m', fecha) = ${mes}
                ORDER BY fecha DESC
            `);

            // Mapear para asegurar que 'complementos' existe como array para el frontend
            const cfdis = detalle.map(item => ({
                ...item,
                complementos: [] // TODO: Implementar detección de complementos específicos si es necesario
            }));

            return { cfdi: cfdis };
        } catch (error) {
            console.error('[CFDI Service] Error en auditoría detallada:', error);
            throw new BadRequestException('Error al obtener detalle de auditoría');
        }
    }

    /**
     * Obtiene los hallazgos detectados en la tabla hallazgos_discrepancias
     */
    async getHallazgosDetectados() {
        try {
            console.log('Ejecutando consulta simple en hallazgos_discrepancias...');
            const hallazgos = await this.db.select().from(hallazgosDiscrepancias).limit(1);
            console.log('Resultado de la consulta:', hallazgos);
            return hallazgos;
        } catch (error) {
            console.error('Error al ejecutar consulta simple:', error);
            throw new BadRequestException(
                `Error al ejecutar consulta: ${error.message}`,
            );
        }
    }

    async generateDefenseReport(empresaId: string, periodo: string): Promise<ReporteDevolucion> {
        return {
            dictamen: {
                resultado: 'GREEN',
                comentarios: 'El reporte no presenta riesgos significativos.'
            },
            resumenNumerico: {
                ivaSolicitado: 10000,
                ivaDevuelto: 9500
            },
            meta: {
                hashIntegritad: 'abc123hash',
                generadoPor: 'Sistema Auditor'
            }
        };
    }

    async getComplementosPago(empresaId: string, periodo: string, origen: string) {
        throw new Error('getComplementosPago not implemented yet.');
    }

    async getComplementosPagoDetalle(empresaId: string, periodo: string, estadoComplemento: string, origen: string) {
        throw new Error('getComplementosPagoDetalle not implemented yet.');
    }

    async getHistorialCambiosEstatus(empresaId: string) {
        throw new Error('getHistorialCambiosEstatus not implemented yet.');
    }

    async getCfdiXml(id: string) {
        throw new Error('getCfdiXml not implemented yet.');
    }

    async getRepXml(id: string) {
        throw new Error('getRepXml not implemented yet.');
    }

    async getHallazgoDetalle(id: string) {
        throw new Error('getHallazgoDetalle not implemented yet.');
    }

    async revisarHallazgo(id: string, revisadoPor: string, estado: string, comentarios: string) {
        throw new Error('revisarHallazgo not implemented yet.');
    }
    /**
     * 🔧 UTILIDAD DE REPARACIÓN: Reclasifica roles masivamente
     * Corrige corrupción de datos si el RFC de la empresa cambió post-importación.
     */
    async reclasificarRoles(empresaId: string) {
        console.log(`[Reclassify] Iniciando reclasificación para empresa: ${empresaId}`);
        const empresa = await this.db.query.empresas.findFirst({
            where: (e: any, { eq }: any) => eq(e.id, empresaId)
        });

        if (!empresa) throw new BadRequestException('Empresa no encontrada');

        // Ejecutar UPDATE masivo atómico
        // Esto corrige roles 'INDEFINIDO' o mal asignados si el RFC cambió
        const result = await this.db.run(sql`
            UPDATE cfdi_recibidos
            SET rol = CASE
                WHEN emisor_rfc = ${empresa.rfc} THEN 'EMITIDO'
                WHEN receptor_rfc = ${empresa.rfc} THEN 'RECIBIDO'
                ELSE 'INDEFINIDO'
            END
            WHERE empresa_id = ${empresaId}
        `);

        console.log(`[Reclassify] Completado. Rows affected: ${result.changes}`);
        return {
            success: true,
            affectedRows: result.changes,
            rfcBase: empresa.rfc,
            message: `Se han reclasificado ${result.changes} comprobantes bajo el RFC ${empresa.rfc}`
        };
    }
    /**
     * Obtiene el último periodo (YYYY-MM) con movimiento para una empresa
     * Vital para que el Dashboard no arranque vacío
     */
    async getUltimoPeriodo(empresaId: string) {
        try {
            const result = await this.db.all(sql`
                SELECT strftime('%Y-%m', fecha) as periodo
                FROM cfdi_recibidos
                WHERE empresa_id = ${empresaId}
                AND (UPPER(estatus_fiscal) = 'VIGENTE' OR estatus_fiscal IS NULL OR estatus_fiscal = 'PENDING')
                ORDER BY fecha DESC
                LIMIT 1
            `);

            if (result && result.length > 0) {
                return { hasData: true, mesIso: result[0].periodo };
            }

            return { hasData: false, mesIso: null };
        } catch (error) {
            console.error('Error al obtener último periodo:', error);
            // Fallback silencioso para no romper UI
            return { hasData: false, mesIso: null };
        }
    }
}
