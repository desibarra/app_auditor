import { useState, useEffect } from 'react';
import axios from 'axios';

interface ModalPreviewEvidenciaProps {
    evidenciaId: number;
    tipoArchivo: string;
    descripcion: string;
    onClose: () => void;
    onDownload: () => void;
}

function ModalPreviewEvidencia({
    evidenciaId,
    tipoArchivo,
    descripcion,
    onClose,
    onDownload,
}: ModalPreviewEvidenciaProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [zoom, setZoom] = useState(100);

    useEffect(() => {
        fetchPreview();

        // Cerrar con ESC
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);

        return () => {
            window.removeEventListener('keydown', handleEsc);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [evidenciaId]);

    const fetchPreview = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(`/api/evidencias/download/${evidenciaId}`, {
                responseType: 'blob',
            });

            // Crear URL temporal para el blob
            const url = URL.createObjectURL(response.data);
            setPreviewUrl(url);
        } catch (err) {
            console.error('Error al cargar preview:', err);
            setError('No se pudo cargar la vista previa');
        } finally {
            setLoading(false);
        }
    };

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev + 25, 200));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev - 25, 50));
    };

    const handleResetZoom = () => {
        setZoom(100);
    };

    const isImage = ['jpg', 'jpeg', 'png'].includes(tipoArchivo.toLowerCase());
    const isPdf = tipoArchivo.toLowerCase() === 'pdf';

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
                onClick={onClose}
            >
                {/* Modal Content */}
                <div
                    className="relative w-full h-full flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold truncate">
                                Vista Previa
                            </h3>
                            <p className="text-sm text-gray-400 truncate mt-1">
                                {descripcion}
                            </p>
                        </div>

                        {/* Controles */}
                        <div className="flex items-center gap-2 ml-4">
                            {/* Zoom (solo para imágenes) */}
                            {isImage && (
                                <div className="flex items-center gap-2 mr-4">
                                    <button
                                        onClick={handleZoomOut}
                                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                                        title="Alejar"
                                    >
                                        🔍−
                                    </button>
                                    <span className="text-sm font-medium min-w-[60px] text-center">
                                        {zoom}%
                                    </span>
                                    <button
                                        onClick={handleZoomIn}
                                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                                        title="Acercar"
                                    >
                                        🔍+
                                    </button>
                                    <button
                                        onClick={handleResetZoom}
                                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                                        title="Restablecer zoom"
                                    >
                                        100%
                                    </button>
                                </div>
                            )}

                            {/* Descargar */}
                            <button
                                onClick={onDownload}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                                title="Descargar"
                            >
                                ⬇️ Descargar
                            </button>

                            {/* Cerrar */}
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
                                title="Cerrar (ESC)"
                            >
                                ✕ Cerrar
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-auto bg-gray-800 flex items-center justify-center p-4">
                        {loading ? (
                            <div className="text-center text-white">
                                <div className="text-4xl mb-4">⏳</div>
                                <p className="text-lg">Cargando vista previa...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center text-white">
                                <div className="text-4xl mb-4">❌</div>
                                <p className="text-lg text-red-400">{error}</p>
                                <button
                                    onClick={fetchPreview}
                                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    Reintentar
                                </button>
                            </div>
                        ) : previewUrl ? (
                            <>
                                {/* Preview de Imagen */}
                                {isImage && (
                                    <div className="max-w-full max-h-full overflow-auto">
                                        <img
                                            src={previewUrl}
                                            alt={descripcion}
                                            className="mx-auto rounded-lg shadow-2xl"
                                            style={{
                                                transform: `scale(${zoom / 100})`,
                                                transformOrigin: 'center',
                                                transition: 'transform 0.2s ease',
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Preview de PDF */}
                                {isPdf && (
                                    <iframe
                                        src={previewUrl}
                                        className="w-full h-full rounded-lg shadow-2xl bg-white"
                                        title={descripcion}
                                    />
                                )}

                                {/* Tipo no soportado */}
                                {!isImage && !isPdf && (
                                    <div className="text-center text-white">
                                        <div className="text-4xl mb-4">📄</div>
                                        <p className="text-lg">
                                            Vista previa no disponible para este tipo de archivo
                                        </p>
                                        <p className="text-sm text-gray-400 mt-2">
                                            Tipo: {tipoArchivo.toUpperCase()}
                                        </p>
                                        <button
                                            onClick={onDownload}
                                            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                        >
                                            ⬇️ Descargar archivo
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>

                    {/* Footer con atajos de teclado */}
                    <div className="bg-gray-900 text-gray-400 px-6 py-3 text-xs text-center border-t border-gray-700">
                        <span className="mr-4">
                            <kbd className="px-2 py-1 bg-gray-800 rounded">ESC</kbd> Cerrar
                        </span>
                        {isImage && (
                            <>
                                <span className="mr-4">
                                    <kbd className="px-2 py-1 bg-gray-800 rounded">+</kbd> Acercar
                                </span>
                                <span>
                                    <kbd className="px-2 py-1 bg-gray-800 rounded">-</kbd> Alejar
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default ModalPreviewEvidencia;
