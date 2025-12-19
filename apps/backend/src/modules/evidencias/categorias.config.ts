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
    // Tipo I: Ingreso (Ventas/Servicios)
    I: [
        {
            id: 'contrato',
            nombre: 'Contrato de Prestación de Servicios',
            descripcion: 'Contrato firmado con el cliente',
            requerido: true,
            icono: '📄',
        },
        {
            id: 'entregable',
            nombre: 'Evidencia de Entrega / Entregable',
            descripcion: 'Comprobante de entrega del producto o servicio',
            requerido: true,
            icono: '📦',
        },
        {
            id: 'pago',
            nombre: 'Comprobante de Pago',
            descripcion: 'Estado de cuenta o transferencia bancaria',
            requerido: true,
            icono: '💰',
        },
        {
            id: 'bitacora',
            nombre: 'Bitácora o Reporte de Servicio',
            descripcion: 'Reporte de actividades para el cliente',
            requerido: false,
            icono: '📝',
        },
        {
            id: 'correos',
            nombre: 'Correos o Minutas de Trabajo',
            descripcion: 'Comunicaciones con el cliente',
            requerido: false,
            icono: '📧',
        },
    ],

    // Tipo E: Egreso (Compras/Gastos)
    E: [
        {
            id: 'contrato',
            nombre: 'Contrato de Prestación de Servicios',
            descripcion: 'Contrato firmado con el proveedor',
            requerido: false,
            icono: '📄',
        },
        {
            id: 'contrato_arrendamiento',
            nombre: 'Contrato de Arrendamiento',
            descripcion: 'Contrato de arrendamiento firmado (para gastos de renta)',
            requerido: false,
            icono: '🏠',
        },
        {
            id: 'pedido',
            nombre: 'Orden de Compra o Pedido',
            descripcion: 'Documento que autoriza la compra',
            requerido: true,
            icono: '📦',
        },
        {
            id: 'entrega',
            nombre: 'Foto de Mercancía o Entrega',
            descripcion: 'Evidencia fotográfica de la recepción',
            requerido: true,
            icono: '📸',
        },
        {
            id: 'pago',
            nombre: 'Comprobante de Pago / Transferencia',
            descripcion: 'Estado de cuenta o transferencia bancaria',
            requerido: true,
            icono: '💰',
        },
        {
            id: 'bitacora',
            nombre: 'Bitácora o Reporte de Servicio',
            descripcion: 'Reporte detallado de actividades realizadas',
            requerido: false,
            icono: '📝',
        },
        {
            id: 'correos',
            nombre: 'Correos o Minutas de Trabajo',
            descripcion: 'Comunicaciones que validen la gestión',
            requerido: false,
            icono: '📧',
        },
        {
            id: 'cotizacion',
            nombre: 'Cotización Comparativa',
            descripcion: 'Cotización previa para sustentar selección',
            requerido: false,
            icono: '📑',
        },
    ],

    // Tipo P: Pago
    P: [
        {
            id: 'estado_cuenta',
            nombre: 'Estado de Cuenta Bancario',
            descripcion: 'Estado de cuenta que muestra el movimiento',
            requerido: true,
            icono: '🏦',
        },
        {
            id: 'transferencia',
            nombre: 'Comprobante de Transferencia',
            descripcion: 'Comprobante bancario de la transferencia',
            requerido: true,
            icono: '💸',
        },
    ],

    // Tipo N: Nómina
    N: [
        {
            id: 'recibo',
            nombre: 'Recibo de Nómina Firmado',
            descripcion: 'Recibo firmado por el empleado',
            requerido: true,
            icono: '✍️',
        },
        {
            id: 'deposito',
            nombre: 'Comprobante de Depósito',
            descripcion: 'Comprobante de depósito o transferencia',
            requerido: true,
            icono: '💵',
        },
    ],

    // Tipo T: Traslado
    T: [
        {
            id: 'guia',
            nombre: 'Guía de Traslado',
            descripcion: 'Documento de traslado de mercancías',
            requerido: true,
            icono: '🚚',
        },
        {
            id: 'foto',
            nombre: 'Foto de Mercancía',
            descripcion: 'Evidencia fotográfica del traslado',
            requerido: false,
            icono: '📸',
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
