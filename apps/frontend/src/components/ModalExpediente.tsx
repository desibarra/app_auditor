import { useState } from 'react';
import axios from 'axios';

interface ModalExpedienteProps {
    isOpen: boolean;
    onClose: () => void;
    empresaId: string;
    cfdiUuids: string[];
    ivaTotal: number;
    onSuccess: (folio: string) => void;
}

function ModalExpediente({
    isOpen,
    onClose,
    empresaId,
    cfdiUuids,
    ivaTotal,
    onSuccess,
}: ModalExpedienteProps) {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nombre.trim()) {
            setError('El nombre del expediente es requerido');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await axios.post('/api/expedientes', {
                empresaId,
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || undefined,
                cfdiUuids,
                creadoPor: 'usuario', // TODO: Obtener del contexto de autenticación
            });

            if (response.data.success) {
                onSuccess(response.data.expediente.folio);
                handleClose();
            }
        } catch (err: any) {
            console.error('Error al crear expediente:', err);
            setError(err.response?.data?.message || 'Error al crear el expediente');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setNombre('');
        setDescripcion('');
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Generar Expediente de Devolución
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600"
                            disabled={loading}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="px-6 py-4">
                    {/* Resumen */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-900 mb-2">
                            Resumen del Expediente
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-blue-700">CFDIs seleccionados:</span>
                                <span className="ml-2 font-semibold text-blue-900">{cfdiUuids.length}</span>
                            </div>
                            <div>
                                <span className="text-blue-700">IVA Total Recuperable:</span>
                                <span className="ml-2 font-semibold text-blue-900">
                                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(ivaTotal)}
                                </span>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-blue-700">
                            ✅ Todos los CFDIs seleccionados tienen materialidad completa (3+ evidencias)
                        </p>
                    </div>

                    {/* Nombre del expediente */}
                    <div className="mb-4">
                        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Expediente *
                        </label>
                        <input
                            type="text"
                            id="nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Ej: Devolución IVA - Diciembre 2025"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                            required
                        />
                    </div>

                    {/* Descripción */}
                    <div className="mb-6">
                        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción (opcional)
                        </label>
                        <textarea
                            id="descripcion"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            placeholder="Agrega notas o comentarios sobre este expediente..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Advertencia legal */}
                    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-xs text-yellow-800">
                            <strong>⚠️ Importante:</strong> Al generar este expediente, confirmas que todos los CFDIs incluidos cuentan con la documentación soporte necesaria para respaldar la devolución ante el SAT.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generando...
                                </span>
                            ) : (
                                'Generar Expediente'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ModalExpediente;
