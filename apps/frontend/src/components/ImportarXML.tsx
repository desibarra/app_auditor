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

            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                errorCount++;
                setUploadProgress({
                    total: files.length,
                    inserted: insertedCount,
                    duplicated: duplicatedCount,
                    errors: errorCount
                });
            }
        }

        setDuplicatedList(tempDuplicated);
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
                className={`px-6 py-3 rounded-lg font-bold text-sm uppercase transition-all flex items-center gap-2 ${empresaId
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg hover:shadow-xl'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                title={!empresaId ? 'Seleccione una empresa para importar XML' : 'Importar archivos XML'}
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Importar XML
            </button>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#0B0E14] rounded-xl shadow-2xl max-w-2xl w-full border border-gray-800">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 rounded-t-xl">
                            <div>
                                <h3 className="text-lg font-bold text-gray-100">Importar Archivos XML</h3>
                                <p className="text-xs text-gray-400 mt-1 font-mono">
                                    Empresa: <span className="text-indigo-400">{empresaNombre || 'N/A'}</span>
                                    {periodo && (
                                        <>
                                            {' | '}Periodo: <span className="text-indigo-400">{periodo}</span>
                                        </>
                                    )}
                                </p>
                            </div>
                            {!uploading && (
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Drop Zone */}
                        <div className="p-8">
                            {!uploading && resultsSummary.status === 'idle' && (
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${isDragging
                                        ? 'border-indigo-500 bg-indigo-500/10'
                                        : 'border-gray-700 bg-gray-800/30 hover:border-gray-600'
                                        }`}
                                >
                                    <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-700">
                                        <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-200 font-bold mb-2 text-lg">
                                        Arrastra tus XML aquí
                                    </p>
                                    <p className="text-gray-500 text-xs mb-6 max-w-xs mx-auto">
                                        El sistema validará duplicados automáticamente y rechazará archivos ya procesados.
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
                                        className="inline-flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-indigo-500/20"
                                    >
                                        Seleccionar desde PC
                                    </label>
                                </div>
                            )}

                            {/* Progress & Results */}
                            {(uploading || resultsSummary.status === 'completed') && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm font-bold ${uploading ? 'text-indigo-400 animate-pulse' : 'text-gray-300'}`}>
                                            {uploading ? '⏳ Procesando lotes...' : '✅ Proceso Finalizado'}
                                        </span>
                                        <span className="text-xs font-mono text-gray-500">
                                            {uploadProgress.inserted + uploadProgress.duplicated + uploadProgress.errors} / {uploadProgress.total}
                                        </span>
                                    </div>

                                    {/* Barra de Progreso */}
                                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
                                        <div
                                            className="bg-indigo-500 h-full transition-all duration-300 ease-out flex"
                                            style={{
                                                width: `${((uploadProgress.inserted + uploadProgress.duplicated + uploadProgress.errors) / uploadProgress.total) * 100}%`
                                            }}
                                        >
                                            {/* Sub-barras para visualizar composición (opcional, por ahora color sólido) */}
                                        </div>
                                    </div>

                                    {/* Resultados Detallados - Grid */}
                                    <div className="grid grid-cols-3 gap-4 mt-6">
                                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 text-center">
                                            <div className="text-2xl mb-1">📥</div>
                                            <div className="text-2xl font-bold text-white font-mono">{uploadProgress.inserted}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Nuevos</div>
                                        </div>
                                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 text-center relative overflow-hidden">
                                            {uploadProgress.duplicated > 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500 rounded-full m-2"></div>}
                                            <div className="text-2xl mb-1">⚠️</div>
                                            <div className={`text-2xl font-bold font-mono ${uploadProgress.duplicated > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>{uploadProgress.duplicated}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Duplicados</div>
                                        </div>
                                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 text-center relative overflow-hidden">
                                            {uploadProgress.errors > 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full m-2"></div>}
                                            <div className="text-2xl mb-1">❌</div>
                                            <div className={`text-2xl font-bold font-mono ${uploadProgress.errors > 0 ? 'text-red-400' : 'text-gray-600'}`}>{uploadProgress.errors}</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Errores</div>
                                        </div>
                                    </div>

                                    {/* DETALLES DE DUPLICADOS */}
                                    {uploadProgress.duplicated > 0 && (
                                        <div className="mt-4">
                                            <button
                                                onClick={() => setShowDuplicatedDetails(!showDuplicatedDetails)}
                                                className="text-xs text-yellow-500 hover:text-yellow-400 font-bold underline flex items-center gap-1 mx-auto"
                                            >
                                                {showDuplicatedDetails ? 'Ocultar XML duplicados' : '👉 Ver XML duplicados'}
                                            </button>

                                            {showDuplicatedDetails && (
                                                <div className="mt-2 text-left bg-gray-900/50 p-3 rounded border border-gray-800 max-h-40 overflow-y-auto">
                                                    <ul className="space-y-1">
                                                        {duplicatedList.map((item, idx) => (
                                                            <li key={idx} className="text-[10px] text-gray-400 font-mono flex justify-between">
                                                                <span className="truncate max-w-[200px]" title={item.name}>{item.name}</span>
                                                                <span className="text-gray-600">{item.uuid}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Mensaje Final Contextual */}
                                    {!uploading && (
                                        <>
                                            <div className={`mt-6 p-4 rounded border text-sm text-center ${uploadProgress.errors > 0 ? 'bg-red-500/10 border-red-500/30 text-red-200' :
                                                    uploadProgress.duplicated > 0 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200' :
                                                        'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                                }`}>
                                                {uploadProgress.errors > 0 ?
                                                    'Hubo errores durante la carga. Revise los archivos.' :
                                                    (uploadProgress.duplicated > 0 && uploadProgress.inserted === 0) ?
                                                        'Todos los archivos ya existían. No se realizaron cambios.' :
                                                        (uploadProgress.duplicated > 0) ?
                                                            `Importación parcial: ${uploadProgress.inserted} nuevos, ${uploadProgress.duplicated} duplicados omitidos.` :
                                                            'Carga completada exitosamente.'
                                                }
                                            </div>

                                            {/* DISCLAIMER LEGAL OBLIGATORIO */}
                                            {uploadProgress.duplicated > 0 && (
                                                <p className="text-[10px] text-gray-500 text-center mt-2 px-4 italic leading-relaxed">
                                                    “Los CFDI duplicados no se reimportan para preservar la integridad fiscal y evitar inconsistencias ante el SAT.”
                                                </p>
                                            )}
                                        </>
                                    )}

                                    {!uploading && (
                                        <button
                                            onClick={closeModal}
                                            className="w-full mt-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold text-xs uppercase tracking-wider border border-gray-600 transition-colors"
                                        >
                                            Cerrar Ventana
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

