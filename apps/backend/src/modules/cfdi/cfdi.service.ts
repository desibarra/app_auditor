import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { CfdiParserService, CfdiData } from './services/cfdi-parser.service';
import { cfdiRecibidos, cfdiImpuestos, empresas } from '../../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class CfdiService {
    constructor(
        @Inject('DRIZZLE_CLIENT') private db: any,
        private cfdiParserService: CfdiParserService,
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

            // 4. Detectar empresa automáticamente
            const empresaIdDetectada = await this.detectarEmpresa(cfdiData);
            const empresaId = empresaIdManual || empresaIdDetectada;

            if (!empresaId) {
                throw new BadRequestException(
                    `No se pudo detectar la empresa. RFC Receptor: ${cfdiData.receptorRfc}, RFC Emisor: ${cfdiData.emisorRfc}. ` +
                    `Por favor, registra la empresa primero.`
                );
            }

            // 5. Verificar si ya existe (ON CONFLICT DO NOTHING manual)
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
}
