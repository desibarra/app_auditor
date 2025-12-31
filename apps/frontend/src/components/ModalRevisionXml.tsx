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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl shadow-indigo-500/10 border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 bg-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                                Revisión Pre-Auditoría
                            </h2>
                            <p className="text-xs text-slate-500 mt-2 font-medium">
                                Análisis forense preliminar de los documentos seleccionados.
                            </p>
                        </div>
                        <button
                            onClick={onCancelar}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-400 p-2 rounded-xl transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-3 gap-6 mt-8">
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex flex-col items-center">
                            <div className="text-2xl font-black text-indigo-600 tracking-tighter">{archivosActuales.length}</div>
                            <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">Paquete Total</div>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center">
                            <div className="text-2xl font-black text-emerald-600 tracking-tighter">{archivosValidos.length}</div>
                            <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Sanos/Válidos</div>
                        </div>
                        <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex flex-col items-center">
                            <div className="text-2xl font-black text-rose-600 tracking-tighter">{archivosConError.length}</div>
                            <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">Con Riesgo/Error</div>
                        </div>
                    </div>
                </div>

                {/* Tabla de Archivos */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                    {archivosActuales.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                            <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em]">No hay documentos para procesar</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {archivosActuales.map((archivo, index) => (
                                <div
                                    key={index}
                                    className={`
                                        rounded-2xl border transition-all duration-300
                                        ${archivo.error
                                            ? 'border-rose-200 bg-rose-50/30'
                                            : 'border-slate-100 bg-white hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5'
                                        }
                                    `}
                                >
                                    {/* Fila Principal */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-6">
                                            {/* Número */}
                                            <div className="flex-shrink-0 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xs font-black text-slate-400 border border-slate-100">
                                                {String(index + 1).padStart(2, '0')}
                                            </div>

                                            {/* Información Principal */}
                                            <div className="flex-1 grid grid-cols-5 gap-6 items-center">
                                                {/* Archivo */}
                                                <div className="col-span-1">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Archivo</div>
                                                    <div className="text-[11px] font-bold text-slate-700 truncate font-mono bg-slate-50 px-2 py-0.5 rounded" title={archivo.archivo}>
                                                        {archivo.archivo}
                                                    </div>
                                                </div>

                                                {/* Emisor */}
                                                <div className="col-span-1">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Emisor/RFC</div>
                                                    <div className="text-[11px] font-bold text-slate-800 truncate" title={archivo.emisorNombre}>
                                                        {archivo.emisorNombre || 'N/A'}
                                                    </div>
                                                    <div className="text-[10px] text-indigo-500 font-black tracking-tight mt-0.5">
                                                        {archivo.emisorRfc || 'N/A'}
                                                    </div>
                                                </div>

                                                {/* Receptor */}
                                                <div className="col-span-1">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Receptor/RFC</div>
                                                    <div className="text-[11px] font-bold text-slate-800 truncate" title={archivo.receptorNombre}>
                                                        {archivo.receptorNombre || 'N/A'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 font-black tracking-tight mt-0.5">
                                                        {archivo.receptorRfc || 'N/A'}
                                                    </div>
                                                </div>

                                                {/* Tipo y Fecha */}
                                                <div className="col-span-1">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Metadatos</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                                                            {getTipoComprobanteLabel(archivo.tipoComprobante)}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-slate-600">
                                                            {formatearFecha(archivo.fecha)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Total */}
                                                <div className="col-span-1 text-right">
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cuantía</div>
                                                    <div className="text-sm font-black text-slate-900 tracking-tighter">
                                                        {formatearMoneda(archivo.total, archivo.moneda)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Acciones */}
                                            <div className="flex-shrink-0 flex items-center gap-2">
                                                {!archivo.error && (
                                                    <button
                                                        onClick={() => toggleExpansion(archivo.archivo)}
                                                        className="w-10 h-10 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                        title="Ver detalles"
                                                    >
                                                        {archivoExpandido === archivo.archivo ? '▼' : '▶'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => eliminarArchivo(archivo.archivo)}
                                                    className="w-10 h-10 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        {/* Error Case */}
                                        {archivo.error && (
                                            <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
                                                <span className="text-lg">🚫</span>
                                                <div>
                                                    <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Atención: Anomalía técnica</div>
                                                    <div className="text-[11px] text-rose-700 font-bold">{archivo.error}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Detalles Expandidos */}
                                    {archivoExpandido === archivo.archivo && !archivo.error && (
                                        <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-in slide-in-from-top-2 duration-300">
                                            <div className="grid grid-cols-2 gap-8">
                                                {/* Conceptos */}
                                                <div>
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between">
                                                        Conceptos <span>{archivo.conceptos?.length || 0}</span>
                                                    </h4>
                                                    {archivo.conceptos && archivo.conceptos.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {archivo.conceptos.map((concepto, idx) => (
                                                                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                                    <div className="text-[11px] font-bold text-slate-800 truncate" title={concepto.descripcion}>
                                                                        {concepto.descripcion}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-500 font-medium mt-1 flex justify-between font-mono">
                                                                        <span>{concepto.cantidad} × {formatearMoneda(concepto.valorUnitario)}</span>
                                                                        <span className="font-bold text-indigo-600">{formatearMoneda(concepto.importe)}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-[10px] text-slate-400 italic">No se detectaron conceptos base</p>
                                                    )}
                                                </div>

                                                {/* Impuestos */}
                                                <div>
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between">
                                                        Gravámenes <span>{archivo.impuestos?.length || 0}</span>
                                                    </h4>
                                                    {archivo.impuestos && archivo.impuestos.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {archivo.impuestos.map((impuesto, idx) => (
                                                                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tighter">
                                                                            {impuesto.tipo} - {impuesto.impuesto}
                                                                        </span>
                                                                        <span className="text-[11px] font-black text-slate-900 font-mono">
                                                                            {formatearMoneda(impuesto.importe)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-[10px] text-slate-400 italic">CFDI sin desglose de impuestos</p>
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
                <div className="p-8 border-t border-slate-100 bg-white">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Resumen del Lote</div>
                            <div className="text-xs font-bold text-slate-600">
                                {archivosValidos.length > 0 ? (
                                    <span>
                                        Importando <span className="text-indigo-600">{archivosValidos.length}</span> documentos íntegros.
                                    </span>
                                ) : 'Seleccione archivos válidos para proceder.'}
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={onCancelar}
                                className="btn-secondary px-8 py-3"
                            >
                                Cancelar Análisis
                            </button>
                            <button
                                onClick={() => onConfirmar(archivosValidos)}
                                disabled={archivosValidos.length === 0}
                                className="btn-primary px-10 py-3 shadow-indigo-100 disabled:opacity-50 disabled:grayscale"
                            >
                                Confirmar y Sincronizar ({archivosValidos.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalRevisionXml;
