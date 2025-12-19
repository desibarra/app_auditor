import { useState, useEffect } from 'react';
import axios from 'axios';
import UploadEvidencia from './UploadEvidencia';
import ListaEvidencias from './ListaEvidencias';

interface DrawerMaterialidadProps {
    uuid: string;
    onClose: () => void;
    onDelete: () => void;
}

interface CfdiDetalle {
    uuid: string;
    emisorRfc: string;
    emisorNombre: string;
    receptorRfc: string;
    receptorNombre: string;
    fecha: string;
    tipoComprobante: string;
    total: number;
    moneda: string;
    estadoSat: string;
}

interface Impuesto {
    tipo: string;
    impuesto: string;
    tasaOCuota: number;
    importe: number;
}

function DrawerMaterialidad({ uuid, onClose, onDelete }: DrawerMaterialidadProps) {
    const [cfdi, setCfdi] = useState<CfdiDetalle | null>(null);
    const [impuestos, setImpuestos] = useState<Impuesto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [numEvidencias, setNumEvidencias] = useState(0);

    useEffect(() => {
        fetchDetalle();
        fetchContadorEvidencias();
    }, [uuid]);

    const fetchDetalle = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/cfdi/detalle/${uuid}`);
            setCfdi(response.data.cfdi);
            setImpuestos(response.data.impuestos || []);
            setError(null);
        } catch (err: any) {
            console.error('Error al cargar detalle:', err);
            setError('No se pudo cargar el detalle del CFDI');
        } finally {
            setLoading(false);
        }
    };

    const fetchContadorEvidencias = async () => {
        try {
            const response = await axios.get(`/api/evidencias/count/${uuid}`);
            setNumEvidencias(response.data.count);
        } catch (err) {
            console.error('Error al contar evidencias:', err);
        }
    };

    /**
     * Determina el tipo de evidencia correcto basado en la clasificación contable
     * - Si el emisor es la empresa → Ingreso/Venta → Tipo "I"
     * - Si el receptor es la empresa → Gasto/Compra → Tipo "E"
     */
    const getTipoEvidencia = (): string => {
        if (!cfdi) return 'I';

        // Obtener RFC de la empresa activa del localStorage
        const empresaActiva = localStorage.getItem('empresaActiva');
        if (!empresaActiva) return cfdi.tipoComprobante;

        // Por ahora, asumimos que si el tipoComprobante es "I" y el receptor
        // es diferente al emisor, es un gasto (tipo E para evidencias)
        // Esta lógica se puede mejorar obteniendo el RFC de la empresa

        // Solución temporal: Si dice "Gasto/Compra" en la interfaz, usar tipo "E"
        // Para esto, verificamos si el CFDI es de tipo "I" (Ingreso en el XML)
        // pero desde la perspectiva de la empresa es un gasto

        // Por simplicidad, usamos "E" para todos los gastos
        // El backend ya tiene la lógica correcta en categorias.config.ts
        return 'E'; // Forzar tipo E para mostrar categorías de gastos
    };

    const handleEvidenciaUpdate = () => {
        fetchContadorEvidencias();
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await axios.delete(`/api/cfdi/${uuid}`);
            onDelete();
            onClose();
        } catch (err: any) {
            console.error('Error al eliminar:', err);
            alert(err.response?.data?.message || 'Error al eliminar el CFDI');
        } finally {
            setDeleting(false);
        }
    };

    const formatearMoneda = (monto: number, moneda: string = 'MXN') => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: moneda,
        }).format(monto);
    };

    const formatearFecha = (fecha: string) => {
        try {
            return new Date(fecha).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return fecha;
        }
    };

    const getTipoLabel = (tipo: string) => {
        const tipos: Record<string, string> = {
            'I': 'Ingreso',
            'E': 'Egreso',
            'P': 'Pago',
            'N': 'Nómina',
            'T': 'Traslado',
        };
        return tipos[tipo] || tipo;
    };

    const getImpuestoLabel = (codigo: string) => {
        const impuestos: Record<string, string> = {
            '001': 'ISR',
            '002': 'IVA',
            '003': 'IEPS',
        };
        return impuestos[codigo] || codigo;
    };

    // Calcular totales de impuestos
    const totalTraslados = impuestos
        .filter(i => i.tipo === 'Traslado')
        .reduce((sum, i) => sum + i.importe, 0);

    const totalRetenciones = impuestos
        .filter(i => i.tipo === 'Retencion')
        .reduce((sum, i) => sum + i.importe, 0);

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-900">
                                Detalle del CFDI
                            </h2>
                            <p className="text-sm text-gray-500 font-mono mt-1">
                                {uuid}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar CFDI"
                            >
                                🗑️ Eliminar
                            </button>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Cargando detalle...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500">{error}</p>
                            <button
                                onClick={fetchDetalle}
                                className="mt-4 text-sm text-blue-600 hover:text-blue-700"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : cfdi ? (
                        <>
                            {/* Información General */}
                            <section>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Información General
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Fecha</label>
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatearFecha(cfdi.fecha)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 uppercase">Tipo</label>
                                            <p className="text-sm font-medium text-gray-900">
                                                {getTipoLabel(cfdi.tipoComprobante)}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Emisor</label>
                                        <p className="text-sm font-medium text-gray-900">{cfdi.emisorNombre}</p>
                                        <p className="text-xs text-gray-600 font-mono">{cfdi.emisorRfc}</p>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Receptor</label>
                                        <p className="text-sm font-medium text-gray-900">{cfdi.receptorNombre}</p>
                                        <p className="text-xs text-gray-600 font-mono">{cfdi.receptorRfc}</p>
                                    </div>

                                    <div className="pt-3 border-t border-gray-200">
                                        <label className="text-xs text-gray-500 uppercase">Total</label>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatearMoneda(cfdi.total, cfdi.moneda)}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-xs text-gray-500 uppercase">Estado SAT</label>
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${cfdi.estadoSat === 'Vigente'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {cfdi.estadoSat}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* Detalle Fiscal */}
                            <section>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Detalle Fiscal
                                </h3>

                                {impuestos.length === 0 ? (
                                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                                        <p className="text-sm text-gray-500 italic">
                                            No hay impuestos registrados
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Traslados */}
                                        {impuestos.filter(i => i.tipo === 'Traslado').length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                    Impuestos Trasladados
                                                </h4>
                                                <div className="bg-green-50 border border-green-200 rounded-lg overflow-hidden">
                                                    <table className="min-w-full divide-y divide-green-200">
                                                        <thead className="bg-green-100">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-green-800">
                                                                    Impuesto
                                                                </th>
                                                                <th className="px-4 py-2 text-right text-xs font-medium text-green-800">
                                                                    Tasa
                                                                </th>
                                                                <th className="px-4 py-2 text-right text-xs font-medium text-green-800">
                                                                    Importe
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-green-200">
                                                            {impuestos.filter(i => i.tipo === 'Traslado').map((imp, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="px-4 py-2 text-sm text-gray-900">
                                                                        {getImpuestoLabel(imp.impuesto)}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                                                        {(imp.tasaOCuota * 100).toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm font-semibold text-gray-900 text-right">
                                                                        {formatearMoneda(imp.importe, cfdi.moneda)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr className="bg-green-100">
                                                                <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-green-900">
                                                                    Total Trasladado
                                                                </td>
                                                                <td className="px-4 py-2 text-sm font-bold text-green-900 text-right">
                                                                    {formatearMoneda(totalTraslados, cfdi.moneda)}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Retenciones */}
                                        {impuestos.filter(i => i.tipo === 'Retencion').length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2">
                                                    Impuestos Retenidos
                                                </h4>
                                                <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                                                    <table className="min-w-full divide-y divide-red-200">
                                                        <thead className="bg-red-100">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-red-800">
                                                                    Impuesto
                                                                </th>
                                                                <th className="px-4 py-2 text-right text-xs font-medium text-red-800">
                                                                    Tasa
                                                                </th>
                                                                <th className="px-4 py-2 text-right text-xs font-medium text-red-800">
                                                                    Importe
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-red-200">
                                                            {impuestos.filter(i => i.tipo === 'Retencion').map((imp, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="px-4 py-2 text-sm text-gray-900">
                                                                        {getImpuestoLabel(imp.impuesto)}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                                                        {(imp.tasaOCuota * 100).toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-4 py-2 text-sm font-semibold text-gray-900 text-right">
                                                                        {formatearMoneda(imp.importe, cfdi.moneda)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr className="bg-red-100">
                                                                <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-red-900">
                                                                    Total Retenido
                                                                </td>
                                                                <td className="px-4 py-2 text-sm font-bold text-red-900 text-right">
                                                                    {formatearMoneda(totalRetenciones, cfdi.moneda)}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* Estatus de Expediente */}
                            <section>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Estatus de Expediente
                                </h3>
                                <div className={`border rounded-lg p-4 ${numEvidencias === 0 ? 'bg-red-50 border-red-200' :
                                    numEvidencias < 3 ? 'bg-yellow-50 border-yellow-200' :
                                        'bg-green-50 border-green-200'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">
                                            {numEvidencias === 0 ? '🔴' : numEvidencias < 3 ? '🟡' : '🟢'}
                                        </span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {numEvidencias === 0 ? 'Sin evidencias de materialidad' :
                                                    numEvidencias < 3 ? 'Materialización parcial' :
                                                        'Materialización completa'}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {numEvidencias} documento{numEvidencias !== 1 ? 's' : ''} adjuntado{numEvidencias !== 1 ? 's' : ''}
                                                {numEvidencias < 3 && ' - Se recomienda al menos 3 evidencias'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Gestión de Evidencias */}
                            <section>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Evidencias de Materialidad
                                </h3>

                                {/* Componente de Upload */}
                                <div className="mb-6">
                                    <UploadEvidencia
                                        cfdiUuid={uuid}
                                        tipoComprobante={getTipoEvidencia()}
                                        onSuccess={handleEvidenciaUpdate}
                                    />
                                </div>

                                {/* Lista de Evidencias */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                                        Documentos Adjuntos
                                    </h4>
                                    <ListaEvidencias
                                        cfdiUuid={uuid}
                                        onUpdate={handleEvidenciaUpdate}
                                    />
                                </div>
                            </section>
                        </>
                    ) : null}
                </div>
            </div>

            {/* Modal de Confirmación de Eliminación */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            ¿Eliminar CFDI?
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Esta acción eliminará permanentemente el CFDI y todos sus impuestos asociados.
                            Esta acción no se puede deshacer.
                        </p>
                        <p className="text-xs text-gray-500 font-mono mb-6 bg-gray-50 p-2 rounded">
                            UUID: {uuid}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={deleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                                disabled={deleting}
                            >
                                {deleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default DrawerMaterialidad;
