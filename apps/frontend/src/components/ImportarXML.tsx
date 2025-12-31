import React, { useState, useCallback } from 'react';
import axios from 'axios';

interface ImportarXMLProps {
    empresaId: string | null;
    empresaNombre?: string;
    periodo?: string;
    onImportComplete?: () => void;
}

const ImportarXML: React.FC<ImportarXMLProps> = ({
    empresaId,
    empresaNombre,
    periodo,
    onImportComplete
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{
        total: number;
        inserted: number;
        duplicated: number;
        errors: number;
    }>({ total: 0, inserted: 0, duplicated: 0, errors: 0 });

    const [errorList, setErrorList] = useState<Array<{ name: string; message: string }>>([]);
    const [showErrorDetails, setShowErrorDetails] = useState(false);
    const [duplicatedList, setDuplicatedList] = useState<Array<{ name: string; uuid: string }>>([]);
    const [showDuplicatedDetails, setShowDuplicatedDetails] = useState(false);

    const [resultsSummary, setResultsSummary] = useState<{
        status: 'idle' | 'processing' | 'completed';
        message: string;
    }>({ status: 'idle', message: '' });

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.xml'));
        if (files.length > 0) {
            handleUpload(files);
        }
    }, [empresaId]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files).filter(f => f.name.toLowerCase().endsWith('.xml'));
            if (files.length > 0) {
                handleUpload(files);
            }
        }
    }, [empresaId]);

    const handleUpload = async (files: File[]) => {
        if (!empresaId) return;

        setUploading(true);
        setUploadProgress({ total: files.length, inserted: 0, duplicated: 0, errors: 0 });
        setResultsSummary({ status: 'processing', message: 'Procesando archivos...' });
        setDuplicatedList([]);

        let insertedCount = 0;
        let duplicatedCount = 0;
        let errorCount = 0;
        const tempDuplicated: Array<{ name: string; uuid: string }> = [];
        const tempErrors: Array<{ name: string; message: string }> = [];

        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('empresaId', empresaId);

                const response = await axios.post('/api/cfdi/importar-xml', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                if (response.data.status === 'DUPLICATED' || response.data.duplicado === true) {
                    duplicatedCount++;
                    tempDuplicated.push({
                        name: file.name,
                        uuid: response.data.uuid || 'N/A'
                    });
                } else {
                    insertedCount++;
                }

                setUploadProgress({
                    total: files.length,
                    inserted: insertedCount,
                    duplicated: duplicatedCount,
                    errors: errorCount
                });

            } catch (error: any) {
                console.error(`Error uploading ${file.name}:`, error);
                errorCount++;
                const errorMessage = error.response?.data?.message || error.message || 'Error de conexión';
                tempErrors.push({ name: file.name, message: errorMessage });
                setUploadProgress(prev => ({ ...prev, errors: errorCount }));
            }
        }

        setDuplicatedList(tempDuplicated);
        setErrorList(tempErrors);
        setUploading(false);
        setResultsSummary({ status: 'completed', message: 'Proceso finalizado' });

        // Lógica de cierre automático inteligente
        // Solo cerrar automático si TODO fue perfecto (100% insertados, 0 errores, 0 duplicados)
        // Si hubo duplicados o errores, mantenemos el modal para que el usuario vea el reporte.
        if (errorCount === 0 && duplicatedCount === 0) {
            setTimeout(() => {
                closeModal();
            }, 1000);
        } else {
            // Refrescar al fondo de todos modos
            if (onImportComplete) onImportComplete();
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setUploadProgress({ total: 0, inserted: 0, duplicated: 0, errors: 0 });
        setResultsSummary({ status: 'idle', message: '' });
        setDuplicatedList([]);
        setShowDuplicatedDetails(false);
        setErrorList([]);
        setShowErrorDetails(false);
        if (onImportComplete) onImportComplete();
    };

    const openModal = () => {
        if (empresaId) {
            setIsModalOpen(true);
        }
    };

    return (
        <>
            {/* BOTÓN IMPORTAR XML */}
            <button
                onClick={openModal}
                disabled={!empresaId}
                className="btn-success w-full"
                title={!empresaId ? 'Seleccione una empresa para importar XML' : 'Importar archivos XML'}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                IMPORTAR XML
            </button>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Carga de Documentos XML</h3>
                                <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-widest">
                                    {empresaNombre || 'N/A'} • {periodo || 'Periodo Global'}
                                </p>
                            </div>
                            {!uploading && (
                                <button
                                    onClick={closeModal}
                                    className="p-2 bg-white hover:bg-slate-100 text-slate-400 rounded-xl transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Drop Zone */}
                        <div className="p-10">
                            {!uploading && resultsSummary.status === 'idle' && (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all ${isDragging
                                        ? 'border-[#0f172a] bg-slate-50'
                                        : 'border-slate-200 bg-slate-50/50 hover:border-[#0f172a]/50'
                                        }`}
                                >
                                    <div className="bg-white w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-sm">
                                        <svg className="w-10 h-10 text-[#0f172a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-900 font-black mb-2 text-xl tracking-tight uppercase">
                                        Arrastra tus XML aquí
                                    </p>
                                    <p className="text-slate-400 text-xs mb-8 max-w-xs mx-auto font-medium">
                                        Validación de integridad y duplicados activa. El sistema procesará lotes de forma segura.
                                    </p>
                                    <input
                                        type="file"
                                        multiple
                                        accept=".xml"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="xml-file-input"
                                    />
                                    <label
                                        htmlFor="xml-file-input"
                                        className="btn-primary cursor-pointer px-10 shadow-indigo-100"
                                    >
                                        Seleccionar desde PC
                                    </label>
                                </div>
                            )}

                            {/* Progress & Results */}
                            {(uploading || resultsSummary.status === 'completed') && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${uploading ? 'text-indigo-600 animate-pulse' : 'text-slate-900'}`}>
                                            {uploading ? '⏳ Protocolo de procesado activo...' : '✅ Sincronización Completada'}
                                        </span>
                                        <span className="text-[10px] font-black font-mono text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                            {uploadProgress.inserted + uploadProgress.duplicated + uploadProgress.errors} / {uploadProgress.total}
                                        </span>
                                    </div>

                                    {/* Barra de Progreso */}
                                    <div className="w-full bg-slate-50 rounded-full h-4 overflow-hidden border border-slate-100 p-1 shadow-inner">
                                        <div
                                            className="bg-[#0f172a] h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_15px_rgba(15,23,42,0.2)]"
                                            style={{
                                                width: `${((uploadProgress.inserted + uploadProgress.duplicated + uploadProgress.errors) / uploadProgress.total) * 100}%`
                                            }}
                                        />
                                    </div>

                                    {/* Resultados Detallados - Grid */}
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
                                            <div className="text-3xl mb-2">📥</div>
                                            <div className="text-2xl font-black text-slate-900 font-mono tracking-tighter">{uploadProgress.inserted}</div>
                                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Nuevos</div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center relative overflow-hidden">
                                            <div className="text-3xl mb-2">⚠️</div>
                                            <div className={`text-2xl font-black font-mono tracking-tighter ${uploadProgress.duplicated > 0 ? 'text-amber-600' : 'text-slate-300'}`}>{uploadProgress.duplicated}</div>
                                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Duplicados</div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center relative overflow-hidden">
                                            <div className="text-3xl mb-2">❌</div>
                                            <div className={`text-2xl font-black font-mono tracking-tighter ${uploadProgress.errors > 0 ? 'text-rose-600' : 'text-slate-300'}`}>{uploadProgress.errors}</div>
                                            <div className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">Errores</div>
                                        </div>
                                    </div>

                                    {/* DETALLES DE ERRORES */}
                                    {uploadProgress.errors > 0 && (
                                        <div className="mt-2">
                                            <button
                                                onClick={() => setShowErrorDetails(!showErrorDetails)}
                                                className="text-[10px] text-rose-600 font-black uppercase tracking-widest hover:underline flex items-center gap-1 mx-auto"
                                            >
                                                {showErrorDetails ? 'Ocultar bitácora de errores' : '🚩 Ver por qué fallaron'}
                                            </button>

                                            {showErrorDetails && (
                                                <div className="mt-4 text-left bg-rose-50/30 p-4 rounded-2xl border border-rose-100 max-h-48 overflow-y-auto">
                                                    <ul className="space-y-2">
                                                        {errorList.map((item, idx) => (
                                                            <li key={idx} className="text-[9px] text-rose-700 font-black font-mono flex flex-col gap-1 bg-white p-3 rounded-lg border border-rose-100">
                                                                <span className="truncate uppercase">{item.name}</span>
                                                                <span className="text-rose-500 font-bold opacity-70 italic">{item.message}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* DETALLES DE DUPLICADOS */}
                                    {uploadProgress.duplicated > 0 && (
                                        <div className="mt-2">
                                            <button
                                                onClick={() => setShowDuplicatedDetails(!showDuplicatedDetails)}
                                                className="text-[10px] text-amber-600 font-black uppercase tracking-widest hover:underline flex items-center gap-1 mx-auto"
                                            >
                                                {showDuplicatedDetails ? 'Ocultar XML registrados' : '👉 Ver XML ya registrados'}
                                            </button>

                                            {showDuplicatedDetails && (
                                                <div className="mt-4 text-left bg-amber-50/30 p-4 rounded-2xl border border-amber-100 max-h-48 overflow-y-auto">
                                                    <ul className="space-y-2">
                                                        {duplicatedList.map((item, idx) => (
                                                            <li key={idx} className="text-[9px] text-amber-700 font-black font-mono flex justify-between bg-white p-2 rounded-lg border border-amber-100">
                                                                <span className="truncate max-w-[250px]" title={item.name}>{item.name.toUpperCase()}</span>
                                                                <span className="text-amber-500/60 font-normal">UUID: {item.uuid.substring(0, 8)}...</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Mensaje Final Contextual */}
                                    {!uploading && (
                                        <div className={`p-5 rounded-2xl border text-[10px] font-black uppercase tracking-widest text-center ${uploadProgress.errors > 0 ? 'bg-rose-50 border-rose-100 text-rose-700' :
                                            uploadProgress.duplicated > 0 ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                                'bg-emerald-50 border-emerald-100 text-emerald-700'
                                            }`}>
                                            {uploadProgress.errors > 0 ?
                                                'Anomalía detectada. Revise la consistencia de los archivos XML.' :
                                                (uploadProgress.duplicated > 0 && uploadProgress.inserted === 0) ?
                                                    'Protocolo de integridad: Registros idénticos omitidos automáticamente.' :
                                                    (uploadProgress.duplicated > 0) ?
                                                        `Sincronización parcial: ${uploadProgress.inserted} procesados y ${uploadProgress.duplicated} duplicados protegidos.` :
                                                        'Sincronización de bóveda completada exitosamente.'
                                            }
                                        </div>
                                    )}

                                    {!uploading && (
                                        <button
                                            onClick={closeModal}
                                            className="btn-secondary w-full py-4"
                                        >
                                            Finalizar Protocolo de Carga
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ImportarXML;

