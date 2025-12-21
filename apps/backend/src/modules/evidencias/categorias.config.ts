/**
 * Configuración de categorías de evidencia por tipo de CFDI
 * 
 * Cada tipo de comprobante tiene sus propias categorías de evidencia
 * que son necesarias para la materialidad fiscal
 */

export interface CategoriaEvidencia {
    id: string;
    nombre: string;
    descripcion: string;
    requerido: boolean;
    icono?: string;
}

/**
 * Categorías de evidencia por tipo de comprobante
 */
export const CATEGORIAS_POR_TIPO: Record<string, CategoriaEvidencia[]> = {
    // Tipo I: Ingreso (Fletes / Servicios de Transporte)
    I: [
        {
            id: 'contrato',
            nombre: 'Contrato Transporte / Prestación Servicios',
            descripcion: 'Contrato marco o específico firmado con el cliente',
            requerido: true,
            icono: '📄',
        },
        {
            id: 'carta_porte',
            nombre: 'Carta Porte / Complemento CCP',
            descripcion: 'Evidencia del complemento Carta Porte o PDF generado',
            requerido: true,
            icono: '🚛',
        },
        {
            id: 'doda',
            nombre: 'DODA / Pedimento (Exportación)',
            descripcion: 'Documento aduanal para cruces o exportaciones',
            requerido: false, // Solo para exportación, pero vital sugerirlo
            icono: '🌐',
        },
        {
            id: 'entregable',
            nombre: 'Evidencia de Entrega (Acuse/Sello)',
            descripcion: 'Prueba de entrega recibida, sellada por cliente destino',
            requerido: true,
            icono: '✅',
        },
        {
            id: 'bitacora',
            nombre: 'Bitácora de Viaje / Ruta',
            descripcion: 'Hoja de ruta, control de kilometraje y tiempos',
            requerido: false,
            icono: '🗺️',
        },
        {
            id: 'pago',
            nombre: 'Comprobante de Pago / CEP',
            descripcion: 'Transferencia bancaria o complemento de pago',
            requerido: true,
            icono: '💰',
        },
        {
            id: 'correos',
            nombre: 'Minutas / Instrucciones de Carga',
            descripcion: 'Correos con instrucciones de embarque',
            requerido: false,
            icono: '📧',
        },
    ],

    // Tipo E: Egreso (Gastos Operativos Transporte)
    E: [
        {
            id: 'contrato',
            nombre: 'Contrato con Proveedor',
            descripcion: 'Contrato de servicios o insumos',
            requerido: false,
            icono: '🤝',
        },
        {
            id: 'contrato_arrendamiento',
            nombre: 'Arrendamiento Unidades / Remolques',
            descripcion: 'Contrato de renta de tractocamiones o cajas secas',
            requerido: false, // Condicional
            icono: '🚛',
        },
        {
            id: 'ticket_diesel',
            nombre: 'Ticket de Diesel / Volumétrico',
            descripcion: 'Comprobante de carga de combustible (litros, bomba)',
            requerido: true,
            icono: '⛽',
        },
        {
            id: 'peajes',
            nombre: 'Casetas / Peajes (IAVE)',
            descripcion: 'Reporte de cruces o tickets de caseta',
            requerido: false,
            icono: '🛣️',
        },
        {
            id: 'mantenimiento',
            nombre: 'Orden de Servicio / Mantenimiento',
            descripcion: 'Reporte de taller, refacciones instaladas',
            requerido: false,
            icono: '🔧',
        },
        {
            id: 'pedido',
            nombre: 'Orden de Compra / Cotización',
            descripcion: 'Autorización interna del gasto',
            requerido: true,
            icono: '🛒',
        },
        {
            id: 'entrega',
            nombre: 'Evidencia de Recepción (Insumos)',
            descripcion: 'Foto de refacciones o insumos recibidos en almacén',
            requerido: true,
            icono: '📸',
        },
        {
            id: 'poliza_seguro',
            nombre: 'Póliza de Seguro (Carga/Unidad)',
            descripcion: 'Póliza vigente de la unidad o seguro de carga específica',
            requerido: false,
            icono: '🛡️',
        },
        {
            id: 'pago',
            nombre: 'Comprobante de Pago',
            descripcion: 'Transferencia bancaria (Salida de banco)',
            requerido: true,
            icono: '💸',
        },
    ],

    // Tipo P: Pago
    P: [
        {
            id: 'estado_cuenta',
            nombre: 'Estado de Cuenta Bancario',
            descripcion: 'Renglón del banco donde se refleja el movimiento',
            requerido: true,
            icono: '🏦',
        },
        {
            id: 'transferencia',
            nombre: 'SPEI / Comprobante Transferencia',
            descripcion: 'PDF del banco con detalles de la operación',
            requerido: true,
            icono: '📲',
        },
    ],

    // Tipo N: Nómina (Operadores)
    N: [
        {
            id: 'recibo',
            nombre: 'Lista de Raya / Recibo Firmado',
            descripcion: 'Recibo de nómina firmado por el operador',
            requerido: true,
            icono: '✍️',
        },
        {
            id: 'contrato_laboral',
            nombre: 'Contrato Laboral / Expediente',
            descripcion: 'Contrato individual de trabajo vigente',
            requerido: false,
            icono: '📂',
        },
        {
            id: 'deposito',
            nombre: 'Dispersión Bancaria',
            descripcion: 'Comprobante de pago masivo o individual',
            requerido: true,
            icono: '💵',
        },
        {
            id: 'control_asistencia',
            nombre: 'Control de Viajes / Asistencia',
            descripcion: 'Reporte de viajes realizados en el periodo',
            requerido: false,
            icono: '🚍',
        },
    ],

    // Tipo T: Traslado (Carta Porte)
    T: [
        {
            id: 'carta_porte_t',
            nombre: 'Carta Porte (Traslado)',
            descripcion: 'CFDI de traslado con complemento Carta Porte',
            requerido: true,
            icono: '🚚',
        },
        {
            id: 'inventario',
            nombre: 'Salida de Inventario',
            descripcion: 'Orden de salida de almacén propia',
            requerido: false,
            icono: '📦',
        },
    ],
};

/**
 * Obtiene las categorías de evidencia para un tipo de comprobante
 */
export function getCategoriasPorTipo(
    tipoComprobante: string,
): CategoriaEvidencia[] {
    return CATEGORIAS_POR_TIPO[tipoComprobante] || [];
}

/**
 * Obtiene todas las categorías requeridas para un tipo de comprobante
 */
export function getCategoriasRequeridas(
    tipoComprobante: string,
): CategoriaEvidencia[] {
    const categorias = getCategoriasPorTipo(tipoComprobante);
    return categorias.filter((cat) => cat.requerido);
}

/**
 * Calcula el porcentaje de completitud de evidencias
 */
export function calcularCompletitud(
    tipoComprobante: string,
    categoriasSubidas: string[],
): number {
    const requeridas = getCategoriasRequeridas(tipoComprobante);
    if (requeridas.length === 0) return 100;

    const completadas = requeridas.filter((cat) =>
        categoriasSubidas.includes(cat.id),
    ).length;

    return Math.round((completadas / requeridas.length) * 100);
}
