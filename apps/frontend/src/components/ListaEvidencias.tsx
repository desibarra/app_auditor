import { useState, useEffect } from 'react';
import axios from 'axios';
import ModalPreviewEvidencia from './ModalPreviewEvidencia';

interface Evidencia {
    id: number;
    cfdiUuid: string;
    categoria: string;
    descripcion: string;
    archivo: string;
    estado: string;
    fechaSubida: string;
    tipoArchivo: string;
}

interface ListaEvidenciasProps {
    cfdiUuid: string;
    onUpdate: () => void;
}

function ListaEvidencias({ cfdiUuid, onUpdate }: ListaEvidenciasProps) {
    const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [previewEvidencia, setPreviewEvidencia] = useState<Evidencia | null>(null);

    useEffect(() => {
        fetchEvidencias();
    }, [cfdiUuid]);

    const fetchEvidencias = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/evidencias/${cfdiUuid}`);
            setEvidencias(response.data);
            setError(null);
        } catch (err) {
            console.error('Error al cargar evidencias:', err);
            setError('No se pudieron cargar las evidencias');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta evidencia?')) {
            return;
        }

        try {
            setDeletingId(id);
            await axios.delete(`/api/evidencias/${id}`);
            await fetchEvidencias();
            onUpdate();
        } catch (err: any) {
            console.error('Error al eliminar evidencia:', err);
            alert(err.response?.data?.message || 'Error al eliminar la evidencia');
        } finally {
            setDeletingId(null);
        }
    };

    const handleDownload = async (id: number, archivo: string) => {
        try {
            const response = await axios.get(`/api/evidencias/download/${id}`, {
                responseType: 'blob',
            });

            // Crear URL temporal y descargar
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', archivo.split('/').pop() || 'evidencia');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error al descargar evidencia:', err);
            alert('Error al descargar el archivo');
        }
    };

    const getIconoTipo = (tipo: string) => {
        if (tipo === 'pdf') return '📄';
        if (['jpg', 'jpeg', 'png'].includes(tipo)) return '🖼️';
        return '📎';
    };

    const getCategoriaLabel = (categoria: string) => {
        const labels: Record<string, string> = {
            'contrato': 'Contrato',
            'entregable': 'Evidencia de Entrega',
            'pago': 'Comprobante de Pago',
            'pedido': 'Orden de Compra',
            'entrega': 'Foto de Entrega',
            'estado_cuenta': 'Estado de Cuenta',
            'transferencia': 'Transferencia',
            'recibo': 'Recibo de Nómina',
            'deposito': 'Comprobante de Depósito',
            'guia': 'Guía de Traslado',
            'foto': 'Foto de Mercancía',
        };
        return labels[categoria] || categoria;
    };

    const formatearFecha = (fecha: string) => {
        try {
            return new Date(fecha).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return fecha;
        }
    };

    if (loading) {
        return (
            <div className="text-center py-6">
                <p className="text-sm text-gray-500">Cargando evidencias...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
                <button
                    onClick={fetchEvidencias}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (evidencias.length === 0) {
        return (
            <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-500">
                    📭 No hay evidencias adjuntas
                </p>
                <p className="text-xs text-gray-400 mt-1">
                    Sube tu primera evidencia usando el formulario de arriba
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {evidencias.map((evidencia) => (
                <div
                    key={evidencia.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start gap-3">
                        {/* Icono */}
                        <div className="text-3xl flex-shrink-0">
                            {getIconoTipo(evidencia.tipoArchivo)}
                        </div>

                        {/* Información */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                    <h4 className="text-sm font-semibold text-gray-900">
                                        {getCategoriaLabel(evidencia.categoria)}
                                    </h4>
                                    <p className="text-xs text-gray-600 mt-1 truncate">
                                        {evidencia.descripcion}
                                    </p>
                                </div>

                                {/* Botones de Acción */}
                                <div className="flex gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => setPreviewEvidencia(evidencia)}
                                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                        title="Vista previa"
                                    >
                                        👁️
                                    </button>
                                    <button
                                        onClick={() => handleDownload(evidencia.id, evidencia.archivo)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Descargar"
                                    >
                                        ⬇️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(evidencia.id)}
                                        disabled={deletingId === evidencia.id}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                        title="Eliminar"
                                    >
                                        {deletingId === evidencia.id ? '⏳' : '🗑️'}
                                    </button>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    📅 {formatearFecha(evidencia.fechaSubida)}
                                </span>
                                <span className="flex items-center gap-1">
                                    {evidencia.estado === 'completado' ? (
                                        <span className="text-green-600">✓ Completado</span>
                                    ) : (
                                        <span className="text-yellow-600">⏳ Pendiente</span>
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Resumen */}
            <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 text-center">
                    {evidencias.length} evidencia{evidencias.length !== 1 ? 's' : ''} adjuntada{evidencias.length !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Modal de Preview */}
            {previewEvidencia && (
                <ModalPreviewEvidencia
                    evidenciaId={previewEvidencia.id}
                    tipoArchivo={previewEvidencia.tipoArchivo}
                    descripcion={previewEvidencia.descripcion}
                    onClose={() => setPreviewEvidencia(null)}
                    onDownload={() => handleDownload(previewEvidencia.id, previewEvidencia.archivo)}
                />
            )}
        </div>
    );
}

export default ListaEvidencias;
