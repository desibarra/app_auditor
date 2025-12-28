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

    // Multi-Ejercicio
    versionCfdi?: string; // "3.3" o "4.0"
    ejercicioFiscal?: number; // 2020, 2021, etc.

    // Emisor
    emisorRfc: string;
    emisorNombre: string;
    emisorRegimenFiscal?: string;

    // Receptor
    receptorRfc: string;
    receptorNombre: string;
    receptorUsoCfdi?: string;
    receptorDomicilioFiscal?: string;
    receptorRegimenFiscal?: string; // New for 4.0 validation

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
    exportacion?: string; // New for 0% VAT validation

    // Impuestos
    impuestos: ImpuestoData[];

    // Complementos (Data estructurada para validación profunda)
    complementoCartaPorte?: CartaPorteData;
    complementoNomina?: NominaData;
    complementoPago?: PagoData[];

    // XML Original
    xmlOriginal: string;
}

export interface CartaPorteData {
    version: string;
    idCCP?: string;
    transporteInternacional?: string;
    totalDistanciaRecorrida?: number;
    ubicaciones: { tipoUbicacion: string; rfc?: string; distanciaRecorrida?: number }[];
    mercancias: {
        pesoBruto: number;
        descripcion: string;
        fraccionArancelaria?: string;
        unidad?: string;
        autotransporte?: { permSCT?: string; configVehicular?: string; placa?: string; anioModelo?: string };
    }[];
    figuraTransporte: { tipoFigura: string; rfc?: string }[];
}

export interface NominaData {
    version: string;
    tipoNomina: string;
    fechaPago: string;
    fechaInicialPago: string;
    fechaFinalPago: string;
    numDiasPagados: number;
    totalPercepciones?: number;
    totalDeducciones?: number;
}

export interface PagoData {
    fechaPago: string;
    formaDePagoP: string;
    monedaP: string;
    monto: number;
    doctoRelacionado: DoctoRelacionadoData[];
}

export interface DoctoRelacionadoData {
    idDocumento: string; // UUID
    serie?: string;
    folio?: string;
    monedaDR: string;
    equivalenciaDR?: number;
    numParcialidad?: number;
    impSaldoAnt?: number;
    impPagado?: number;
    impSaldoInsoluto?: number;
    objetoImpDR?: string;
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

            // Extraer Complementos Específicos
            const complementoCartaPorte = this.extractCartaPorte(comprobante);
            const complementoNomina = this.extractNomina(comprobante);
            const complementoPago = this.extractPagos(comprobante);

            // Extraer versión y ejercicio fiscal
            const versionCfdi = comprobante['@_Version'] || '4.0';
            const fechaCfdi = new Date(comprobante['@_Fecha']);
            const ejercicioFiscal = fechaCfdi.getFullYear();

            const cfdiData: CfdiData = {
                // UUID
                uuid,

                // Cabecera
                serie: comprobante['@_Serie'],
                folio: comprobante['@_Folio'],
                fecha: comprobante['@_Fecha'],
                tipoComprobante: comprobante['@_TipoDeComprobante'],
                versionCfdi,
                ejercicioFiscal,

                // Emisor
                emisorRfc: emisor['@_Rfc'],
                emisorNombre: emisor['@_Nombre'],
                emisorRegimenFiscal: emisor['@_RegimenFiscal'],

                // Receptor
                receptorRfc: receptor['@_Rfc'],
                receptorNombre: receptor['@_Nombre'],
                receptorUsoCfdi: receptor['@_UsoCFDI'],
                receptorDomicilioFiscal: receptor['@_DomicilioFiscalReceptor'],
                receptorRegimenFiscal: receptor['@_RegimenFiscalReceptor'],

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

                // Ubicación (y Exportación)
                lugarExpedicion: comprobante['@_LugarExpedicion'],
                exportacion: comprobante['@_Exportacion'],

                // Impuestos
                impuestos,

                // Complementos
                complementoCartaPorte,
                complementoNomina,
                complementoPago,

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

    /**
     * Extrae datos del complemento Carta Porte 3.1 (o versiones anteriores)
     */
    private extractCartaPorte(comprobante: any): CartaPorteData | undefined {
        try {
            const complemento = comprobante['cfdi:Complemento'] || comprobante['Complemento'];
            if (!complemento) return undefined;

            // Buscar nodo CartaPorte en distintos namespaces posibles
            const cartaPorte = complemento['cartaporte31:CartaPorte'] ||
                complemento['cartaporte30:CartaPorte'] ||
                complemento['cartaporte20:CartaPorte'] ||
                complemento['CartaPorte'];

            if (!cartaPorte) return undefined;

            // Extraer Ubicaciones
            const ubicacionesRaw = cartaPorte['cartaporte31:Ubicaciones'] || cartaPorte['cartaporte30:Ubicaciones'] || cartaPorte['Ubicaciones'];
            const ubicacionList = ubicacionesRaw
                ? (Array.isArray(ubicacionesRaw['cartaporte31:Ubicacion'] || ubicacionesRaw['cartaporte30:Ubicacion'] || ubicacionesRaw['Ubicacion'])
                    ? (ubicacionesRaw['cartaporte31:Ubicacion'] || ubicacionesRaw['cartaporte30:Ubicacion'] || ubicacionesRaw['Ubicacion'])
                    : [ubicacionesRaw['cartaporte31:Ubicacion'] || ubicacionesRaw['cartaporte30:Ubicacion'] || ubicacionesRaw['Ubicacion']])
                : [];

            const ubicaciones = ubicacionList.map((u: any) => ({
                tipoUbicacion: u['@_TipoUbicacion'],
                rfc: u['@_RFCRemitenteDestinatario'],
                distanciaRecorrida: u['@_DistanciaRecorrida'] ? parseFloat(u['@_DistanciaRecorrida']) : undefined
            }));

            // Extraer Mercancias y Autotransporte
            const mercanciasRaw = cartaPorte['cartaporte31:Mercancias'] || cartaPorte['cartaporte30:Mercancias'] || cartaPorte['Mercancias'];
            let autoTransporteData: any = undefined;

            if (mercanciasRaw) {
                const at = mercanciasRaw['cartaporte31:Autotransporte'] || mercanciasRaw['cartaporte30:Autotransporte'] || mercanciasRaw['Autotransporte'];
                if (at) {
                    autoTransporteData = {
                        permSCT: at['@_PermSCT'],
                        configVehicular: at['@_ConfigVehicular'] || at['cartaporte31:IdentificacionVehicular']?.['@_ConfigVehicular'],
                        placa: at['@_PlacaVM'] || at['cartaporte31:IdentificacionVehicular']?.['@_PlacaVM'],
                        anioModelo: at['@_AnioModeloVM'] || at['cartaporte31:IdentificacionVehicular']?.['@_AnioModeloVM']
                    };
                }
            }

            const mercanciaList = mercanciasRaw
                ? (Array.isArray(mercanciasRaw['cartaporte31:Mercancia'] || mercanciasRaw['cartaporte30:Mercancia'] || mercanciasRaw['Mercancia'])
                    ? (mercanciasRaw['cartaporte31:Mercancia'] || mercanciasRaw['cartaporte30:Mercancia'] || mercanciasRaw['Mercancia'])
                    : [mercanciasRaw['cartaporte31:Mercancia'] || mercanciasRaw['cartaporte30:Mercancia'] || mercanciasRaw['Mercancia']])
                : [];

            const mercancias = mercanciaList.map((m: any) => ({
                pesoBruto: parseFloat(m['@_PesoBruto'] || '0'),
                descripcion: m['@_Descripcion'],
                fraccionArancelaria: m['@_FraccionArancelaria'],
                unidad: m['@_Unidad'],
                autotransporte: autoTransporteData // Attach vehicle info to merchandise context for validation
            }));

            // Extraer Figura Transporte (Choferes)
            const figurasRaw = cartaPorte['cartaporte31:FiguraTransporte'] || cartaPorte['cartaporte30:FiguraTransporte'] || cartaPorte['FiguraTransporte'];
            const figurasList = figurasRaw
                ? (Array.isArray(figurasRaw['cartaporte31:TiposFigura'] || figurasRaw['cartaporte30:TiposFigura'] || figurasRaw['TiposFigura'])
                    ? (figurasRaw['cartaporte31:TiposFigura'] || figurasRaw['cartaporte30:TiposFigura'] || figurasRaw['TiposFigura'])
                    : [figurasRaw['cartaporte31:TiposFigura'] || figurasRaw['cartaporte30:TiposFigura'] || figurasRaw['TiposFigura']])
                : (Array.isArray(figurasRaw) ? figurasRaw : (figurasRaw ? [figurasRaw] : [])); // Fallback a estructura simple

            const figuras = figurasList.map((f: any) => ({
                tipoFigura: f['@_TipoFigura'],
                rfc: f['@_RFCFigura']
            }));

            return {
                version: cartaPorte['@_Version'],
                idCCP: cartaPorte['@_IdCCP'],
                transporteInternacional: cartaPorte['@_TranspInternac'],
                totalDistanciaRecorrida: parseFloat(cartaPorte['@_TotalDistRec'] || '0'),
                ubicaciones,
                mercancias,
                figuraTransporte: figuras
            };
        } catch (e) {
            console.warn('Error extrayendo Carta Porte:', e);
            return undefined;
        }
    }

    /**
     * Extrae datos del complemento Nómina 1.2
     */
    private extractNomina(comprobante: any): NominaData | undefined {
        try {
            const complemento = comprobante['cfdi:Complemento'] || comprobante['Complemento'];
            if (!complemento) return undefined;

            const nomina = complemento['nomina12:Nomina'] || complemento['Nomina'];
            if (!nomina) return undefined;

            return {
                version: nomina['@_Version'],
                tipoNomina: nomina['@_TipoNomina'],
                fechaPago: nomina['@_FechaPago'],
                fechaInicialPago: nomina['@_FechaInicialPago'],
                fechaFinalPago: nomina['@_FechaFinalPago'],
                numDiasPagados: parseFloat(nomina['@_NumDiasPagados'] || '0'),
                totalPercepciones: parseFloat(nomina['@_TotalPercepciones'] || '0'),
                totalDeducciones: parseFloat(nomina['@_TotalDeducciones'] || '0')
            };
        } catch (e) {
            console.warn('Error extrayendo Nómina:', e);
            return undefined;
        }
    }

    /**
     * Extrae datos del complemento de Pagos (Version 1.0 y 2.0)
     */
    private extractPagos(comprobante: any): PagoData[] | undefined {
        try {
            const complemento = comprobante['cfdi:Complemento'] || comprobante['Complemento'];
            if (!complemento) return undefined;

            const pagosNode = complemento['pago20:Pagos'] || complemento['pago10:Pagos'] || complemento['Pagos'];
            if (!pagosNode) return undefined;

            let pagosList = pagosNode['pago20:Pago'] || pagosNode['pago10:Pago'] || pagosNode['Pago'];
            if (!pagosList) return undefined;

            if (!Array.isArray(pagosList)) {
                pagosList = [pagosList];
            }

            return pagosList.map((pago: any) => {
                const doctoRelacionadoNode = pago['pago20:DoctoRelacionado'] || pago['pago10:DoctoRelacionado'] || pago['DoctoRelacionado'];
                let doctosRelacionados: DoctoRelacionadoData[] = [];

                if (doctoRelacionadoNode) {
                    const drList = Array.isArray(doctoRelacionadoNode) ? doctoRelacionadoNode : [doctoRelacionadoNode];
                    doctosRelacionados = drList.map((dr: any) => ({
                        idDocumento: dr['@_IdDocumento'],
                        serie: dr['@_Serie'],
                        folio: dr['@_Folio'],
                        monedaDR: dr['@_MonedaDR'],
                        equivalenciaDR: parseFloat(dr['@_EquivalenciaDR'] || '1'),
                        numParcialidad: parseInt(dr['@_NumParcialidad']),
                        impSaldoAnt: parseFloat(dr['@_ImpSaldoAnt'] || '0'),
                        impPagado: parseFloat(dr['@_ImpPagado'] || '0'),
                        impSaldoInsoluto: parseFloat(dr['@_ImpSaldoInsoluto'] || '0'),
                        objetoImpDR: dr['@_ObjetoImpDR']
                    }));
                }

                return {
                    fechaPago: pago['@_FechaPago'],
                    formaDePagoP: pago['@_FormaDePagoP'],
                    monedaP: pago['@_MonedaP'],
                    monto: parseFloat(pago['@_Monto'] || '0'),
                    doctoRelacionado: doctosRelacionados
                };
            });
        } catch (e) {
            console.warn('Error extrayendo Pagos:', e);
            return undefined;
        }
    }
}
