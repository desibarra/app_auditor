import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface CategoriaEvidencia {
    id: string;
    nombre: string;
    descripcion: string;
    requerido: boolean;
    icono?: string;
}

interface UploadEvidenciaProps {
    cfdiUuid: string;
    tipoComprobante: string;
    folioControl?: string; // Nuevo prop opcional
    onSuccess: () => void;
}

function UploadEvidencia({ cfdiUuid, tipoComprobante, folioControl, onSuccess }: UploadEvidenciaProps) {
    const [categorias, setCategorias] = useState<CategoriaEvidencia[]>([]);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [archivo, setArchivo] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchCategorias();
    }, [tipoComprobante]);

    const fetchCategorias = async () => {
        try {
            const response = await axios.get(`/api/evidencias/categorias/${tipoComprobante}`);
            setCategorias(response.data.categorias);
            // Seleccionar primera categoría por defecto
            if (response.data.categorias.length > 0) {
                setCategoriaSeleccionada(response.data.categorias[0].id);
            }
        } catch (err) {
            console.error('Error al cargar categorías:', err);
            setError('No se pudieron cargar las categorías');
        }
    };

    const handleFileChange = (file: File) => {
        // Validar tipo de archivo
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            setError('Solo se permiten archivos PDF, JPG y PNG');
            return;
        }

        // Validar tamaño (50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('El archivo no debe superar los 50MB');
            return;
        }

        setArchivo(file);
        setError(null);

        // Generar preview para imágenes
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!archivo || !categoriaSeleccionada) {
            setError('Por favor selecciona una categoría y un archivo');
            return;
        }

        try {
            setUploading(true);
            setProgress(0);
            setError(null);

            const formData = new FormData();
            // IMPORTANTE: Agregar campos de texto PRIMERO
            formData.append('cfdiUuid', cfdiUuid);
            formData.append('categoria', categoriaSeleccionada);
            formData.append('descripcion', descripcion || archivo.name);
            // Default folio if not provided
            formData.append('folio_control', folioControl || `AUDIT-1X1-${new Date().getFullYear()}`);

            // Archivo al FINAL
            formData.append('file', archivo);

            await axios.post('/api/evidencias/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / (progressEvent.total || 100)
                    );
                    setProgress(percentCompleted);
                },
            });

            // Limpiar formulario
            setArchivo(null);
            setPreview(null);
            setDescripcion('');
            setProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Notificar éxito
            onSuccess();
        } catch (err: any) {
            console.error('Error al subir evidencia:', err);

            // Mensaje de error amigable
            let errorMessage = 'Error al subir el archivo';

            if (err.response) {
                if (err.response.status === 413) {
                    errorMessage = 'El archivo es demasiado grande. El límite es 50MB.';
                } else if (err.response.data?.message) {
                    errorMessage = err.response.data.message;
                } else {
                    errorMessage = `Error del servidor (${err.response.status}). Intenta de nuevo.`;
                }
            } else if (err.request) {
                errorMessage = 'No hubo respuesta del servidor. Verifica tu conexión.';
            } else {
                errorMessage = err.message;
            }

            setError(errorMessage);
        } finally {
            setUploading(false);
        }
    };



    return (
        <div className="space-y-4">
            {/* Selector de Categoría */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría de Evidencia *
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {categorias.map((cat) => {
                            const isSelected = categoriaSeleccionada === cat.id;
                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => !uploading && setCategoriaSeleccionada(cat.id)}
                                    className={`flex items-start p-3 rounded-md cursor-pointer transition-all border ${isSelected
                                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 z-10'
                                        : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                        }`}
                                >
                                    <span className="text-2xl mr-3 mt-0.5">{cat.icono}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                {cat.nombre}
                                            </p>
                                            {cat.requerido && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                                    Requerido
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                                            {cat.descripcion}
                                        </p>
                                    </div>
                                    <div className="ml-3 mt-1">
                                        <div className={`w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                                            }`}>
                                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Descripción */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (opcional)
                </label>
                <input
                    type="text"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej: Contrato firmado el 15 de diciembre"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    disabled={uploading}
                />
            </div>

            {/* Zona de Drag & Drop */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo *
                </label>
                <div
                    className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-gray-50'
                        } ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleInputChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        disabled={uploading}
                    />

                    {archivo ? (
                        <div className="space-y-3">
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="max-h-40 mx-auto rounded"
                                />
                            ) : (
                                <div className="text-5xl">📄</div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {archivo.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {(archivo.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                            {!uploading && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setArchivo(null);
                                        setPreview(null);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                    }}
                                    className="text-sm text-red-600 hover:text-red-700"
                                >
                                    Cambiar archivo
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="text-5xl">📎</div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    Arrastra un archivo aquí
                                </p>
                                <p className="text-xs text-gray-500">
                                    o haz clic para seleccionar
                                </p>
                            </div>
                            <p className="text-xs text-gray-400">
                                PDF, JPG o PNG (máx. 50MB)
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Barra de Progreso */}
            {uploading && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subiendo...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">❌ {error}</p>
                </div>
            )}

            {/* Botón de Subir */}
            <button
                onClick={handleUpload}
                disabled={!archivo || !categoriaSeleccionada || uploading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
                {uploading ? '⏳ Subiendo...' : '📤 Subir Evidencia'}
            </button>
        </div>
    );
}

export default UploadEvidencia;
