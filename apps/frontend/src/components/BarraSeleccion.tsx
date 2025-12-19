interface BarraSeleccionProps {
    cantidadSeleccionados: number;
    ivaTotal: number;
    onGenerarExpediente: () => void;
    onLimpiarSeleccion: () => void;
}

function BarraSeleccion({
    cantidadSeleccionados,
    ivaTotal,
    onGenerarExpediente,
    onLimpiarSeleccion,
}: BarraSeleccionProps) {
    if (cantidadSeleccionados === 0) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-500 shadow-lg z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                    {/* Info */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                                {cantidadSeleccionados}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                                {cantidadSeleccionados} CFDI{cantidadSeleccionados > 1 ? 's' : ''} seleccionado{cantidadSeleccionados > 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="h-6 w-px bg-gray-300"></div>

                        <div>
                            <span className="text-xs text-gray-500">IVA Total Recuperable</span>
                            <p className="text-lg font-bold text-green-600">
                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(ivaTotal)}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onLimpiarSeleccion}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Limpiar Selección
                        </button>
                        <button
                            onClick={onGenerarExpediente}
                            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Generar Expediente de Devolución
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BarraSeleccion;
