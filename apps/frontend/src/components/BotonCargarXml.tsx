import { useState, useRef } from 'react';
import { parsearXmlsPreview, CfdiPreview } from '../utils/xmlParser';
import ModalRevisionXml from './ModalRevisionXml';

interface BotonCargarXmlProps {
    empresaId?: string; // Opcional - se detecta automáticamente si no se proporciona
    onSuccess?: () => void;
}

interface ResultadoCarga {
    archivo: string;
    exito: boolean;
    duplicado: boolean;
    mensaje: string;
    uuid?: string;
}

function BotonCargarXml({ empresaId, onSuccess }: BotonCargarXmlProps) {
    const [uploading, setUploading] = useState(false);
    const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
    const [resultados, setResultados] = useState<ResultadoCarga[]>([]);
    const [mostrarResumen, setMostrarResumen] = useState(false);
    const [mostrarModalRevision, setMostrarModalRevision] = useState(false);
    const [archivosPrevios, setArchivosPrevios] = useState<CfdiPreview[]>([]);
    const [archivosOriginales, setArchivosOriginales] = useState<File[]>([]);
    const [parseando, setParseando] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;

        if (!files || files.length === 0) {
            return;
        }

        // Validar que todos sean XML
        const archivosInvalidos = Array.from(files).filter(
            file => !file.name.toLowerCase().endsWith('.xml')
        );

        if (archivosInvalidos.length > 0) {
            alert(`${archivosInvalidos.length} archivo(s) no son XML y serán omitidos`);
        }

        const archivosValidos = Array.from(files).filter(
            file => file.name.toLowerCase().endsWith('.xml')
        );

        if (archivosValidos.length === 0) {
            alert('No se seleccionaron archivos XML válidos');
            return;
        }

        // Parsear XMLs en el frontend para vista previa
        setParseando(true);
        try {
            const previews = await parsearXmlsPreview(archivosValidos);
            setArchivosPrevios(previews);
            setArchivosOriginales(archivosValidos);
            setMostrarModalRevision(true);
        } catch (error) {
            console.error('Error al parsear archivos:', error);
            alert('Error al procesar los archivos XML');
        } finally {
            setParseando(false);
        }
    };

    const handleConfirmarImportacion = async (archivosConfirmados: CfdiPreview[]) => {
        setMostrarModalRevision(false);

        // Filtrar archivos originales basándose en los confirmados
        const nombresConfirmados = archivosConfirmados.map(a => a.archivo);
        const archivosAImportar = archivosOriginales.filter(
            file => nombresConfirmados.includes(file.name)
        );

        if (archivosAImportar.length > 0) {
            await procesarArchivosMasivos(archivosAImportar);
        }
    };

    const handleCancelarRevision = () => {
        setMostrarModalRevision(false);
        setArchivosPrevios([]);
        setArchivosOriginales([]);

        // Limpiar input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const procesarArchivosMasivos = async (archivos: File[]) => {
        setUploading(true);
        setProgreso({ actual: 0, total: archivos.length });
        setResultados([]);
        setMostrarResumen(false);

        const resultadosTemp: ResultadoCarga[] = [];

        for (let i = 0; i < archivos.length; i++) {
            const archivo = archivos[i];
            setProgreso({ actual: i + 1, total: archivos.length });

            try {
                const formData = new FormData();
                formData.append('file', archivo);

                const url = empresaId
                    ? `/api/cfdi/importar-xml?empresaId=${empresaId}`
                    : '/api/cfdi/importar-xml';

                // Usar fetch en lugar de axios para evitar problemas de interceptores
                const response = await fetch(url, {
                    method: 'POST',
                    body: formData,
                    // No establecer Content-Type, el navegador lo hace automáticamente con boundary
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                if (data.success) {
                    resultadosTemp.push({
                        archivo: archivo.name,
                        exito: true,
                        duplicado: data.duplicado || false,
                        mensaje: data.duplicado
                            ? `Duplicado: ${data.uuid}`
                            : `Importado: ${data.emisor} - $${data.total?.toLocaleString('es-MX')}`,
                        uuid: data.uuid,
                    });
                }
            } catch (error: any) {
                console.error(`Error al cargar ${archivo.name}:`, error);
                resultadosTemp.push({
                    archivo: archivo.name,
                    exito: false,
                    duplicado: false,
                    mensaje: error.message || 'Error al importar',
                });
            }
        }

        setResultados(resultadosTemp);
        setUploading(false);
        setMostrarResumen(true);

        // Limpiar input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // Llamar callback de éxito si hay al menos un archivo importado exitosamente
        const exitosos = resultadosTemp.filter(r => r.exito && !r.duplicado);
        if (onSuccess && exitosos.length > 0) {
            setTimeout(() => {
                onSuccess();
            }, 500);
        }
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const cerrarResumen = () => {
        setMostrarResumen(false);
        setResultados([]);
    };

    // Calcular estadísticas
    const exitosos = resultados.filter(r => r.exito && !r.duplicado).length;
    const duplicados = resultados.filter(r => r.duplicado).length;
    const errores = resultados.filter(r => !r.exito).length;

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <input
                ref={fileInputRef}
                type="file"
                accept=".xml"
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />

            <button
                onClick={handleButtonClick}
                disabled={uploading}
                className={`btn-primary shadow-indigo-100 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {uploading ? (
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="uppercase tracking-widest text-[10px]">Cargando {progreso.actual}/{progreso.total}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-lg">📁</span>
                        <span className="uppercase tracking-widest text-[10px] font-black">Importar CFDI 4.0</span>
                    </div>
                )}
            </button>

            {/* Barra de Progreso */}
            {uploading && (
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                            className="bg-indigo-600 h-full rounded-full transition-all duration-700 ease-in-out"
                            style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                        Analizando paquete forense: {progreso.actual} de {progreso.total}
                    </p>
                </div>
            )}

            {/* Resumen de Resultados */}
            {mostrarResumen && (
                <div className="border border-slate-200 rounded-2xl p-6 bg-white shadow-xl shadow-slate-200/40 animate-in slide-in-from-top-2 duration-500">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                            Reporte de Procesamiento
                        </h3>
                        <button
                            onClick={cerrarResumen}
                            className="bg-slate-50 hover:bg-slate-100 text-slate-400 p-1.5 rounded-lg transition-colors"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-center">
                            <div className="text-xl font-black text-emerald-600 tracking-tighter">{exitosos}</div>
                            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Nuevos</div>
                        </div>
                        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3 text-center">
                            <div className="text-xl font-black text-amber-600 tracking-tighter">{duplicados}</div>
                            <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Omitidos</div>
                        </div>
                        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-center">
                            <div className="text-xl font-black text-rose-600 tracking-tighter">{errores}</div>
                            <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Errores</div>
                        </div>
                    </div>

                    {/* Lista de Resultados */}
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                        {resultados.map((resultado, index) => (
                            <div
                                key={index}
                                className={`
                                    p-3 rounded-xl text-xs border transition-all
                                    ${resultado.exito && !resultado.duplicado
                                        ? 'bg-emerald-50/30 border-emerald-50 text-emerald-800'
                                        : resultado.duplicado
                                            ? 'bg-amber-50/30 border-amber-50 text-amber-800'
                                            : 'bg-rose-50/30 border-rose-50 text-rose-800'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold opacity-75">
                                        {resultado.exito && !resultado.duplicado ? '✓' : resultado.duplicado ? '↶' : '⚠'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold truncate text-[11px] uppercase tracking-tight" title={resultado.archivo}>
                                            {resultado.archivo}
                                        </div>
                                        <div className="text-[9px] opacity-60 font-medium">
                                            {resultado.mensaje}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mensaje Final */}
                    <div className="mt-6 pt-4 border-t border-slate-50">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center text-slate-400 italic">
                            Auditoría de consistencia completada
                        </p>
                    </div>
                </div>
            )}

            {/* Mensaje de Parseando */}
            {parseando && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Analizando archivos XML...
                </div>
            )}

            {/* Modal de Revisión */}
            {mostrarModalRevision && (
                <ModalRevisionXml
                    archivos={archivosPrevios}
                    onConfirmar={handleConfirmarImportacion}
                    onCancelar={handleCancelarRevision}
                />
            )}
        </div>
    );
}

export default BotonCargarXml;
