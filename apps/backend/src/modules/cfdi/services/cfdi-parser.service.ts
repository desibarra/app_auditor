import { Injectable } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';

/**
 * Interfaz para los datos parseados de un CFDI
 */
export interface CfdiData {
    // Cabecera
    uuid: string;
    serie?: string;
    folio?: string;
    fecha: string;
    tipoComprobante: string;

    // Emisor
    emisorRfc: string;
    emisorNombre: string;
    emisorRegimenFiscal?: string;

    // Receptor
    receptorRfc: string;
    receptorNombre: string;
    receptorUsoCfdi?: string;
    receptorDomicilioFiscal?: string;

    // Montos
    subtotal: number;
    descuento?: number;
    total: number;
    moneda: string;
    tipoCambio?: number;

    // Pago
    formaPago?: string;
    metodoPago?: string;
    condicionesPago?: string;

    // Ubicación
    lugarExpedicion?: string;

    // Impuestos
    impuestos: ImpuestoData[];

    // XML Original
    xmlOriginal: string;
}

export interface ImpuestoData {
    nivel: 'comprobante' | 'concepto';
    tipo: 'Traslado' | 'Retencion';
    impuesto: string; // '002' = IVA, '001' = ISR, '003' = IEPS
    impuestoNombre: string;
    tipoFactor: string; // 'Tasa' | 'Cuota' | 'Exento'
    tasaOCuota?: number;
    base: number;
    importe: number;
}

@Injectable()
export class CfdiParserService {
    private parser: XMLParser;

    constructor() {
        // Configurar parser para CFDI
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
            textNodeName: '#text',
            parseAttributeValue: true,
            trimValues: true,
        });
    }

    /**
     * Parsea un XML de CFDI 4.0 y extrae los datos relevantes
     */
    async parseXML(xmlContent: string): Promise<CfdiData> {
        try {
            const parsed = this.parser.parse(xmlContent);

            // El nodo raíz puede ser cfdi:Comprobante o Comprobante
            const comprobante = parsed['cfdi:Comprobante'] || parsed['Comprobante'];

            if (!comprobante) {
                throw new Error('No se encontró el nodo Comprobante en el XML');
            }

            // Extraer UUID del complemento de timbrado
            const uuid = this.extractUUID(comprobante);

            // Extraer datos del emisor
            const emisor = comprobante['cfdi:Emisor'] || comprobante['Emisor'];

            // Extraer datos del receptor
            const receptor = comprobante['cfdi:Receptor'] || comprobante['Receptor'];

            // Extraer impuestos
            const impuestos = this.extractImpuestos(comprobante);

            const cfdiData: CfdiData = {
                // UUID
                uuid,

                // Cabecera
                serie: comprobante['@_Serie'],
                folio: comprobante['@_Folio'],
                fecha: comprobante['@_Fecha'],
                tipoComprobante: comprobante['@_TipoDeComprobante'],

                // Emisor
                emisorRfc: emisor['@_Rfc'],
                emisorNombre: emisor['@_Nombre'],
                emisorRegimenFiscal: emisor['@_RegimenFiscal'],

                // Receptor
                receptorRfc: receptor['@_Rfc'],
                receptorNombre: receptor['@_Nombre'],
                receptorUsoCfdi: receptor['@_UsoCFDI'],
                receptorDomicilioFiscal: receptor['@_DomicilioFiscalReceptor'],

                // Montos
                subtotal: parseFloat(comprobante['@_SubTotal']),
                descuento: comprobante['@_Descuento'] ? parseFloat(comprobante['@_Descuento']) : undefined,
                total: parseFloat(comprobante['@_Total']),
                moneda: comprobante['@_Moneda'] || 'MXN',
                tipoCambio: comprobante['@_TipoCambio'] ? parseFloat(comprobante['@_TipoCambio']) : undefined,

                // Pago
                formaPago: comprobante['@_FormaPago'],
                metodoPago: comprobante['@_MetodoPago'],
                condicionesPago: comprobante['@_CondicionesDePago'],

                // Ubicación
                lugarExpedicion: comprobante['@_LugarExpedicion'],

                // Impuestos
                impuestos,

                // XML Original
                xmlOriginal: xmlContent,
            };

            return cfdiData;
        } catch (error) {
            throw new Error(`Error al parsear XML: ${error.message}`);
        }
    }

    /**
     * Extrae el UUID del complemento de timbrado fiscal
     */
    private extractUUID(comprobante: any): string {
        try {
            const complemento = comprobante['cfdi:Complemento'] || comprobante['Complemento'];

            if (!complemento) {
                throw new Error('No se encontró el complemento');
            }

            const timbre = complemento['tfd:TimbreFiscalDigital'] ||
                complemento['TimbreFiscalDigital'];

            if (!timbre) {
                throw new Error('No se encontró el TimbreFiscalDigital');
            }

            const uuid = timbre['@_UUID'];

            if (!uuid) {
                throw new Error('No se encontró el UUID en el timbre');
            }

            return uuid;
        } catch (error) {
            throw new Error(`Error al extraer UUID: ${error.message}`);
        }
    }

    /**
     * Extrae los impuestos del CFDI (solo a nivel comprobante por ahora)
     */
    private extractImpuestos(comprobante: any): ImpuestoData[] {
        const impuestos: ImpuestoData[] = [];

        try {
            const impuestosNode = comprobante['cfdi:Impuestos'] || comprobante['Impuestos'];

            if (!impuestosNode) {
                return impuestos;
            }

            // Traslados (IVA, IEPS)
            const traslados = impuestosNode['cfdi:Traslados'] || impuestosNode['Traslados'];
            if (traslados) {
                const trasladosArray = Array.isArray(traslados['cfdi:Traslado'] || traslados['Traslado'])
                    ? (traslados['cfdi:Traslado'] || traslados['Traslado'])
                    : [(traslados['cfdi:Traslado'] || traslados['Traslado'])];

                trasladosArray.forEach((traslado: any) => {
                    if (traslado) {
                        impuestos.push({
                            nivel: 'comprobante',
                            tipo: 'Traslado',
                            impuesto: traslado['@_Impuesto'],
                            impuestoNombre: this.getImpuestoNombre(traslado['@_Impuesto']),
                            tipoFactor: traslado['@_TipoFactor'],
                            tasaOCuota: traslado['@_TasaOCuota'] ? parseFloat(traslado['@_TasaOCuota']) : undefined,
                            base: parseFloat(traslado['@_Base'] || '0'),
                            importe: parseFloat(traslado['@_Importe'] || '0'),
                        });
                    }
                });
            }

            // Retenciones (ISR, IVA)
            const retenciones = impuestosNode['cfdi:Retenciones'] || impuestosNode['Retenciones'];
            if (retenciones) {
                const retencionesArray = Array.isArray(retenciones['cfdi:Retencion'] || retenciones['Retencion'])
                    ? (retenciones['cfdi:Retencion'] || retenciones['Retencion'])
                    : [(retenciones['cfdi:Retencion'] || retenciones['Retencion'])];

                retencionesArray.forEach((retencion: any) => {
                    if (retencion) {
                        impuestos.push({
                            nivel: 'comprobante',
                            tipo: 'Retencion',
                            impuesto: retencion['@_Impuesto'],
                            impuestoNombre: this.getImpuestoNombre(retencion['@_Impuesto']),
                            tipoFactor: 'Tasa',
                            base: 0, // Las retenciones no siempre tienen base
                            importe: parseFloat(retencion['@_Importe'] || '0'),
                        });
                    }
                });
            }

            return impuestos;
        } catch (error) {
            console.error('Error al extraer impuestos:', error);
            return impuestos;
        }
    }

    /**
     * Convierte el código de impuesto SAT a nombre legible
     */
    private getImpuestoNombre(codigo: string): string {
        const nombres: Record<string, string> = {
            '001': 'ISR',
            '002': 'IVA',
            '003': 'IEPS',
        };
        return nombres[codigo] || codigo;
    }
}
