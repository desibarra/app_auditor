import { useState, useEffect } from 'react';
import axios from 'axios';
import ModalPreviewEvidencia from './ModalPreviewEvidencia';
import UploadEvidencia from './UploadEvidencia';

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
    tipoComprobante: string;
    folioControl?: string;
    onUpdate: () => void;
    onClose: () => void;
}

interface CategoriaReq {
    id: string;
    nombre: string;
    requerido: boolean;
}

function ListaEvidencias({ cfdiUuid, tipoComprobante, folioControl, onUpdate }: ListaEvidenciasProps) {
    const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
    const [categoriasReq, setCategoriasReq] = useState<CategoriaReq[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [previewEvidencia, setPreviewEvidencia] = useState<Evidencia | null>(null);

    // Derived state for score
    const [score, setScore] = useState(0);
    const [statusLabel, setStatusLabel] = useState('SIN BLINDAJE');
    const [missingDocs, setMissingDocs] = useState<string[]>([]);

    useEffect(() => {
        fetchData();
        // Escuchar evento de subida exitosa
        const handleUploadSuccess = () => fetchData();
        window.addEventListener('evidencia_subida_' + cfdiUuid, handleUploadSuccess);
        return () => window.removeEventListener('evidencia_subida_' + cfdiUuid, handleUploadSuccess);
    }, [cfdiUuid, tipoComprobante]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resEvidencias, resCats] = await Promise.all([
                axios.get(`/api/evidencias/${cfdiUuid}`),
                axios.get(`/api/evidencias/categorias/${tipoComprobante || 'I'}`)
            ]);

            const evs = resEvidencias.data;
            const cats = resCats.data.categorias as CategoriaReq[];

            setEvidencias(evs);
            setCategoriasReq(cats);

            // Calcular Score Sentinel
            calculateScore(evs, cats);

            setError(null);
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError('Error cargando expediente');
        } finally {
            setLoading(false);
        }
    };

    const calculateScore = (currentEvidencias: Evidencia[], requirements: CategoriaReq[]) => {
        const requiredCats = requirements.filter(c => c.requerido);
        if (requiredCats.length === 0) {
            setScore(100);
            setStatusLabel('NO REQUIERE (AUTOMÁTICO)');
            return;
        }

        const uploadedCategories = new Set(currentEvidencias.map(e => e.categoria));
        const missing = requiredCats.filter(req => !uploadedCategories.has(req.id));

        const generatedScore = Math.round(((requiredCats.length - missing.length) / requiredCats.length) * 100);

        setScore(generatedScore);
        setMissingDocs(missing.map(m => m.nombre));

        if (generatedScore === 100) setStatusLabel('🛡️ BLINDAJE COMPLETO');
        else if (generatedScore >= 50) setStatusLabel('⚠️ PARCIAL / RIESGO MEDIO');
        else setStatusLabel('🚨 INDEFENSO / RIESGO ALTO');
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta evidencia?')) return;
        try {
            await axios.delete(`/api/evidencias/${id}`);
            await fetchData(); // Recalcular todo
            onUpdate();
        } catch (err: any) {
            alert('Error al eliminar');
        }
    };

    const handleDownload = async (id: number, archivo: string) => {
        try {
            const response = await axios.get(`/api/evidencias/download/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', archivo.split('/').pop() || 'evidence');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) { alert('Error descarga'); }
    };

    // ... helpers de iconos (sin cambios) ...
    const getIconoTipo = (tipo: string) => {
        if (tipo === 'pdf') return '📄';
        if (['jpg', 'jpeg', 'png'].includes(tipo)) return '🖼️';
        return '📎';
    };

    const getCategoriaLabel = (catId: string) => {
        const cat = categoriasReq.find(c => c.id === catId);
        return cat ? cat.nombre : catId;
    };


    if (loading) return <p className="text-gray-500 text-center py-4">Validando materialidad...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="space-y-6">
            {/* SENTINEL SCORE CARD */}
            <div className={`p-5 rounded-lg border flex flex-col sm:flex-row justify-between items-center shadow-lg transition-all ${score === 100 ? 'bg-gradient-to-r from-green-900 to-gray-900 border-green-500' :
                score >= 50 ? 'bg-gradient-to-r from-yellow-900 to-gray-900 border-yellow-500' :
                    'bg-gradient-to-r from-red-900 to-gray-900 border-red-600'
                }`}>

                <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 ${score === 100 ? 'border-green-400 text-green-400 bg-green-900/50' :
                        score >= 50 ? 'border-yellow-400 text-yellow-400 bg-yellow-900/50' :
                            'border-red-500 text-red-500 bg-red-900/50'
                        }`}>
                        {score}%
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-100 text-lg uppercase tracking-wider">Nivel de Blindaje</h3>
                        <p className={`font-mono font-bold text-sm ${score === 100 ? 'text-green-300' :
                            score >= 50 ? 'text-yellow-300' :
                                'text-red-300'
                            }`}>
                            {statusLabel}
                        </p>
                    </div>
                </div>

                {/* Missing Docs Warning */}
                {missingDocs.length > 0 && (
                    <div className="mt-4 sm:mt-0 text-right">
                        <p className="text-xs text-red-300 font-bold uppercase mb-1">⚠️ FALTANTE CRÍTICO:</p>
                        <ul className="text-xs text-gray-300 space-y-0.5">
                            {missingDocs.slice(0, 3).map(doc => (
                                <li key={doc}>• {doc}</li>
                            ))}
                            {missingDocs.length > 3 && <li>... y {missingDocs.length - 3} más</li>}
                        </ul>
                    </div>
                )}
            </div>

            {/* Evidence Grid */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="px-4 py-3 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-300 uppercase">Documentación Cargada ({evidencias.length})</h4>
                </div>

                {/* Content - same as read? */}
                {/* I need to make sure I am replacing the correct blocks. I will target the empty state and the upload section individually/together if possible. */}
                {/* Empty State */}
                {evidencias.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 bg-[#0B0E14] border-t border-gray-800">
                        <div className="text-4xl mb-3 opacity-50">📂</div>
                        <p className="font-bold text-gray-400">Expediente vacío</p>
                        <p className="text-xs mt-1 text-gray-600">Cargue los documentos requeridos para blindar esta operación.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800 bg-[#0B0E14]">
                        {evidencias.map((ev) => (
                            <div key={ev.id} className="p-4 hover:bg-gray-800/50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="text-2xl opacity-70" title={ev.tipoArchivo}>{getIconoTipo(ev.tipoArchivo)}</span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-200 truncate">
                                            {getCategoriaLabel(ev.categoria)}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs text-gray-500 truncate max-w-[200px]" title={ev.descripcion || ev.archivo}>
                                                {ev.descripcion || ev.archivo}
                                            </p>
                                            <span className="text-[10px] text-gray-600">• {new Date(ev.fechaSubida).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setPreviewEvidencia(ev)}
                                        className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30 rounded transition-colors"
                                        title="Vista Previa"
                                    >
                                        👁
                                    </button>
                                    <button
                                        onClick={() => handleDownload(ev.id, ev.archivo)}
                                        className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 rounded transition-colors"
                                        title="Descargar"
                                    >
                                        💾
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ev.id)}
                                        className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-900/30 rounded transition-colors"
                                        title="Eliminar"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* UPLOAD SECTION (RESTORED/ADDED) */}
            <div className="bg-[#0B0E14] p-4 rounded-xl border border-gray-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <svg className="w-20 h-20 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                </div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                    <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
                    Subir Nueva Evidencia
                </h4>
                <div className="relative z-10">
                    <UploadEvidencia
                        cfdiUuid={cfdiUuid}
                        tipoComprobante={tipoComprobante}
                        folioControl={folioControl}
                        onSuccess={fetchData}
                    />
                </div>
            </div>

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
