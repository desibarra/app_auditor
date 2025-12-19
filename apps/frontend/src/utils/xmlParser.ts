/**
 * Utilidad para parsear XMLs de CFDI en el frontend
 * Extrae información básica sin necesidad de enviar al servidor
 */

export interface CfdiPreview {
    archivo: string;
    uuid?: string;
    emisorRfc?: string;
    emisorNombre?: string;
    receptorRfc?: string;
    receptorNombre?: string;
    fecha?: string;
    tipoComprobante?: string;
    total?: number;
    moneda?: string;
    conceptos?: ConceptoPreview[];
    impuestos?: ImpuestoPreview[];
    error?: string;
}

export interface ConceptoPreview {
    descripcion: string;
    cantidad: number;
    valorUnitario: number;
    importe: number;
}

export interface ImpuestoPreview {
    tipo: string; // 'Traslado' | 'Retencion'
    impuesto: string; // 'IVA', 'ISR', etc.
    importe: number;
}

/**
 * Parsea un archivo XML de CFDI y extrae información básica
 */
export async function parsearXmlPreview(file: File): Promise<CfdiPreview> {
    try {
        const text = await file.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');

        // Verificar si hay errores de parseo
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
            return {
                archivo: file.name,
                error: 'XML mal formado',
            };
        }

        // Buscar el nodo Comprobante (con o sin namespace)
        let comprobante = xmlDoc.querySelector('Comprobante');
        if (!comprobante) {
            comprobante = xmlDoc.querySelector('[\\:Comprobante], cfdi\\:Comprobante');
        }

        if (!comprobante) {
            return {
                archivo: file.name,
                error: 'No se encontró el nodo Comprobante',
            };
        }

        // Extraer UUID del TimbreFiscalDigital
        let uuid: string | undefined;
        const timbre = xmlDoc.querySelector('TimbreFiscalDigital, [\\:TimbreFiscalDigital], tfd\\:TimbreFiscalDigital');
        if (timbre) {
            uuid = timbre.getAttribute('UUID') || undefined;
        }

        // Extraer datos del emisor
        const emisor = comprobante.querySelector('Emisor, [\\:Emisor], cfdi\\:Emisor');
        const emisorRfc = emisor?.getAttribute('Rfc') || undefined;
        const emisorNombre = emisor?.getAttribute('Nombre') || undefined;

        // Extraer datos del receptor
        const receptor = comprobante.querySelector('Receptor, [\\:Receptor], cfdi\\:Receptor');
        const receptorRfc = receptor?.getAttribute('Rfc') || undefined;
        const receptorNombre = receptor?.getAttribute('Nombre') || undefined;

        // Extraer datos del comprobante
        const fecha = comprobante.getAttribute('Fecha') || undefined;
        const tipoComprobante = comprobante.getAttribute('TipoDeComprobante') || undefined;
        const totalStr = comprobante.getAttribute('Total');
        const total = totalStr ? parseFloat(totalStr) : undefined;
        const moneda = comprobante.getAttribute('Moneda') || 'MXN';

        // Extraer conceptos (máximo 5 para preview)
        const conceptos: ConceptoPreview[] = [];
        const conceptosNodes = comprobante.querySelectorAll('Concepto, [\\:Concepto], cfdi\\:Concepto');
        const maxConceptos = Math.min(conceptosNodes.length, 5);

        for (let i = 0; i < maxConceptos; i++) {
            const concepto = conceptosNodes[i];
            const descripcion = concepto.getAttribute('Descripcion') || 'Sin descripción';
            const cantidadStr = concepto.getAttribute('Cantidad');
            const valorUnitarioStr = concepto.getAttribute('ValorUnitario');
            const importeStr = concepto.getAttribute('Importe');

            conceptos.push({
                descripcion,
                cantidad: cantidadStr ? parseFloat(cantidadStr) : 0,
                valorUnitario: valorUnitarioStr ? parseFloat(valorUnitarioStr) : 0,
                importe: importeStr ? parseFloat(importeStr) : 0,
            });
        }

        // Extraer impuestos
        const impuestos: ImpuestoPreview[] = [];
        const impuestosNode = comprobante.querySelector('Impuestos, [\\:Impuestos], cfdi\\:Impuestos');

        if (impuestosNode) {
            // Traslados
            const traslados = impuestosNode.querySelectorAll('Traslado, [\\:Traslado]');
            traslados.forEach(traslado => {
                const impuestoCode = traslado.getAttribute('Impuesto');
                const importeStr = traslado.getAttribute('Importe');

                impuestos.push({
                    tipo: 'Traslado',
                    impuesto: impuestoCode === '002' ? 'IVA' : impuestoCode === '003' ? 'IEPS' : impuestoCode || 'Otro',
                    importe: importeStr ? parseFloat(importeStr) : 0,
                });
            });

            // Retenciones
            const retenciones = impuestosNode.querySelectorAll('Retencion, [\\:Retencion]');
            retenciones.forEach(retencion => {
                const impuestoCode = retencion.getAttribute('Impuesto');
                const importeStr = retencion.getAttribute('Importe');

                impuestos.push({
                    tipo: 'Retención',
                    impuesto: impuestoCode === '001' ? 'ISR' : impuestoCode === '002' ? 'IVA' : impuestoCode || 'Otro',
                    importe: importeStr ? parseFloat(importeStr) : 0,
                });
            });
        }

        return {
            archivo: file.name,
            uuid,
            emisorRfc,
            emisorNombre,
            receptorRfc,
            receptorNombre,
            fecha,
            tipoComprobante,
            total,
            moneda,
            conceptos,
            impuestos,
        };
    } catch (error) {
        console.error(`Error al parsear ${file.name}:`, error);
        return {
            archivo: file.name,
            error: 'Error al leer el archivo',
        };
    }
}

/**
 * Parsea múltiples archivos XML en paralelo
 */
export async function parsearXmlsPreview(files: File[]): Promise<CfdiPreview[]> {
    const promises = files.map(file => parsearXmlPreview(file));
    return await Promise.all(promises);
}
