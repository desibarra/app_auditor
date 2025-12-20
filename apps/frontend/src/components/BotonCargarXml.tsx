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
        <div className="space-y-3">
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
                className={`
                    px-4 py-2 rounded-lg font-medium transition-colors
                    ${uploading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }
                `}
            >
                {uploading ? (
                    <>
                        <span className="inline-block animate-spin mr-2">⏳</span>
                        Cargando {progreso.actual} de {progreso.total}...
                    </>
                ) : (
                    <>
                        📄 Cargar XML (Múltiples)
                    </>
                )}
            </button>

            {/* Barra de Progreso */}
            {uploading && (
                <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
                        ></div>
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                        Procesando archivo {progreso.actual} de {progreso.total}
                    </p>
                </div>
            )}

            {/* Resumen de Resultados */}
            {mostrarResumen && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900">
                            Resumen de Importación
                        </h3>
                        <button
                            onClick={cerrarResumen}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-green-700">{exitosos}</div>
                            <div className="text-xs text-green-600">Importados</div>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-yellow-700">{duplicados}</div>
                            <div className="text-xs text-yellow-600">Duplicados</div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-red-700">{errores}</div>
                            <div className="text-xs text-red-600">Errores</div>
                        </div>
                    </div>

                    {/* Lista de Resultados */}
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {resultados.map((resultado, index) => (
                            <div
                                key={index}
                                className={`
                                    p-2 rounded text-sm
                                    ${resultado.exito && !resultado.duplicado
                                        ? 'bg-green-50 border border-green-200'
                                        : resultado.duplicado
                                            ? 'bg-yellow-50 border border-yellow-200'
                                            : 'bg-red-50 border border-red-200'
                                    }
                                `}
                            >
                                <div className="flex items-start gap-2">
                                    <span className="text-lg">
                                        {resultado.exito && !resultado.duplicado ? '✓' : resultado.duplicado ? '⚠' : '✗'}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate" title={resultado.archivo}>
                                            {resultado.archivo}
                                        </div>
                                        <div className={`
                                            text-xs
                                            ${resultado.exito && !resultado.duplicado
                                                ? 'text-green-700'
                                                : resultado.duplicado
                                                    ? 'text-yellow-700'
                                                    : 'text-red-700'
                                            }
                                        `}>
                                            {resultado.mensaje}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mensaje Final */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-700 text-center">
                            {exitosos > 0 && (
                                <span className="text-green-600 font-medium">
                                    ✓ {exitosos} importado{exitosos !== 1 ? 's' : ''} con éxito
                                </span>
                            )}
                            {duplicados > 0 && (
                                <span className="text-yellow-600 font-medium ml-2">
                                    ⚠ {duplicados} duplicado{duplicados !== 1 ? 's' : ''} omitido{duplicados !== 1 ? 's' : ''}
                                </span>
                            )}
                            {errores > 0 && (
                                <span className="text-red-600 font-medium ml-2">
                                    ✗ {errores} error{errores !== 1 ? 'es' : ''}
                                </span>
                            )}
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
