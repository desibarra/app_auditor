import { useState } from 'react';
import { CfdiPreview } from '../utils/xmlParser';

interface ModalRevisionXmlProps {
    archivos: CfdiPreview[];
    onConfirmar: (archivosSeleccionados: CfdiPreview[]) => void;
    onCancelar: () => void;
}

function ModalRevisionXml({ archivos, onConfirmar, onCancelar }: ModalRevisionXmlProps) {
    const [archivosActuales, setArchivosActuales] = useState<CfdiPreview[]>(archivos);
    const [archivoExpandido, setArchivoExpandido] = useState<string | null>(null);

    const eliminarArchivo = (nombreArchivo: string) => {
        setArchivosActuales(prev => prev.filter(a => a.archivo !== nombreArchivo));
    };

    const toggleExpansion = (nombreArchivo: string) => {
        setArchivoExpandido(prev => prev === nombreArchivo ? null : nombreArchivo);
    };

    const formatearMoneda = (monto: number | undefined, moneda: string = 'MXN') => {
        if (monto === undefined) return 'N/A';
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: moneda,
        }).format(monto);
    };

    const formatearFecha = (fecha: string | undefined) => {
        if (!fecha) return 'N/A';
        try {
            return new Date(fecha).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return fecha;
        }
    };

    const getTipoComprobanteLabel = (tipo: string | undefined) => {
        const tipos: Record<string, string> = {
            'I': 'Ingreso',
            'E': 'Egreso',
            'P': 'Pago',
            'N': 'Nómina',
            'T': 'Traslado',
        };
        return tipos[tipo || ''] || tipo || 'N/A';
    };

    const archivosValidos = archivosActuales.filter(a => !a.error);
    const archivosConError = archivosActuales.filter(a => a.error);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Revisión de Archivos XML
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Revisa los archivos antes de importarlos. Puedes eliminar los que no desees.
                            </p>
                        </div>
                        <button
                            onClick={onCancelar}
                            className="text-gray-400 hover:text-gray-600 text-2xl"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="text-2xl font-bold text-blue-700">{archivosActuales.length}</div>
                            <div className="text-xs text-blue-600">Total Seleccionados</div>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="text-2xl font-bold text-green-700">{archivosValidos.length}</div>
                            <div className="text-xs text-green-600">Válidos</div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <div className="text-2xl font-bold text-red-700">{archivosConError.length}</div>
                            <div className="text-xs text-red-600">Con Errores</div>
                        </div>
                    </div>
                </div>

                {/* Tabla de Archivos */}
                <div className="flex-1 overflow-y-auto p-6">
                    {archivosActuales.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No hay archivos para revisar</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {archivosActuales.map((archivo, index) => (
                                <div
                                    key={index}
                                    className={`
                                        border rounded-lg overflow-hidden transition-all
                                        ${archivo.error
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-gray-200 bg-white hover:border-blue-300'
                                        }
                                    `}
                                >
                                    {/* Fila Principal */}
                                    <div className="p-4">
                                        <div className="flex items-center gap-4">
                                            {/* Número */}
                                            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                                {index + 1}
                                            </div>

                                            {/* Información Principal */}
                                            <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                                                {/* Archivo */}
                                                <div className="col-span-1">
                                                    <div className="text-xs text-gray-500">Archivo</div>
                                                    <div className="text-sm font-medium text-gray-900 truncate" title={archivo.archivo}>
                                                        {archivo.archivo}
                                                    </div>
                                                </div>

                                                {/* Emisor */}
                                                <div className="col-span-1">
                                                    <div className="text-xs text-gray-500">Emisor</div>
                                                    <div className="text-sm text-gray-900 truncate" title={archivo.emisorNombre}>
                                                        {archivo.emisorNombre || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-mono">
                                                        {archivo.emisorRfc || 'N/A'}
                                                    </div>
                                                </div>

                                                {/* Receptor */}
                                                <div className="col-span-1">
                                                    <div className="text-xs text-gray-500">Receptor</div>
                                                    <div className="text-sm text-gray-900 truncate" title={archivo.receptorNombre}>
                                                        {archivo.receptorNombre || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-mono">
                                                        {archivo.receptorRfc || 'N/A'}
                                                    </div>
                                                </div>

                                                {/* Tipo y Fecha */}
                                                <div className="col-span-1">
                                                    <div className="text-xs text-gray-500">Tipo / Fecha</div>
                                                    <div className="text-sm text-gray-900">
                                                        {getTipoComprobanteLabel(archivo.tipoComprobante)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {formatearFecha(archivo.fecha)}
                                                    </div>
                                                </div>

                                                {/* Total */}
                                                <div className="col-span-1 text-right">
                                                    <div className="text-xs text-gray-500">Total</div>
                                                    <div className="text-lg font-bold text-gray-900">
                                                        {formatearMoneda(archivo.total, archivo.moneda)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Acciones */}
                                            <div className="flex-shrink-0 flex items-center gap-2">
                                                {!archivo.error && (
                                                    <button
                                                        onClick={() => toggleExpansion(archivo.archivo)}
                                                        className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Ver detalles"
                                                    >
                                                        {archivoExpandido === archivo.archivo ? '▼' : '▶'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => eliminarArchivo(archivo.archivo)}
                                                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        {/* Error */}
                                        {archivo.error && (
                                            <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-red-600">⚠</span>
                                                    <span className="text-sm text-red-700 font-medium">
                                                        {archivo.error}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Detalles Expandidos */}
                                    {archivoExpandido === archivo.archivo && !archivo.error && (
                                        <div className="border-t border-gray-200 bg-gray-50 p-4">
                                            <div className="grid grid-cols-2 gap-6">
                                                {/* Conceptos */}
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 mb-2">
                                                        Conceptos ({archivo.conceptos?.length || 0})
                                                    </h4>
                                                    {archivo.conceptos && archivo.conceptos.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {archivo.conceptos.map((concepto, idx) => (
                                                                <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                                                                    <div className="text-sm font-medium text-gray-900 truncate">
                                                                        {concepto.descripcion}
                                                                    </div>
                                                                    <div className="text-xs text-gray-600 mt-1">
                                                                        {concepto.cantidad} × {formatearMoneda(concepto.valorUnitario)} = {formatearMoneda(concepto.importe)}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(archivo.conceptos.length > 5) && (
                                                                <div className="text-xs text-gray-500 italic">
                                                                    ... y {archivo.conceptos.length - 5} conceptos más
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 italic">Sin conceptos</p>
                                                    )}
                                                </div>

                                                {/* Impuestos */}
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 mb-2">
                                                        Impuestos ({archivo.impuestos?.length || 0})
                                                    </h4>
                                                    {archivo.impuestos && archivo.impuestos.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {archivo.impuestos.map((impuesto, idx) => (
                                                                <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-sm font-medium text-gray-900">
                                                                            {impuesto.tipo} - {impuesto.impuesto}
                                                                        </span>
                                                                        <span className="text-sm font-bold text-gray-900">
                                                                            {formatearMoneda(impuesto.importe)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 italic">Sin impuestos</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            {archivosValidos.length > 0 && (
                                <span>
                                    Se importarán <strong>{archivosValidos.length}</strong> archivo{archivosValidos.length !== 1 ? 's' : ''}
                                </span>
                            )}
                            {archivosConError.length > 0 && (
                                <span className="ml-2 text-red-600">
                                    ({archivosConError.length} con errores serán omitidos)
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onCancelar}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => onConfirmar(archivosValidos)}
                                disabled={archivosValidos.length === 0}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Confirmar e Importar ({archivosValidos.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalRevisionXml;
