import { useState, useEffect } from 'react';
import axios from 'axios';

interface Empresa {
    id: string;
    rfc: string;
    razonSocial: string;
    activa: boolean;
}

interface SelectorEmpresaProps {
    empresaSeleccionada: string | null;
    onSeleccionar: (empresaId: string) => void;
}

function SelectorEmpresa({ empresaSeleccionada, onSeleccionar }: SelectorEmpresaProps) {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ rfc: '', razonSocial: '' });
    const [submitting, setSubmitting] = useState(false);

    const fetchEmpresas = async () => {
        try {
            const response = await axios.get('/api/empresas');
            setEmpresas(response.data);

            // Si no hay empresa seleccionada, seleccionar la primera
            if (!empresaSeleccionada && response.data.length > 0) {
                onSeleccionar(response.data[0].id);
            }

            setError(null);
        } catch (err: any) {
            console.error('Error al cargar empresas:', err);
            setError('No se pudieron cargar las empresas');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmpresas();
    }, []);

    const handleCrearEmpresa = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.rfc || !formData.razonSocial) {
            alert('Por favor completa todos los campos');
            return;
        }

        try {
            setSubmitting(true);
            const response = await axios.post('/api/empresas', formData);

            if (response.data.success) {
                // Refrescar lista de empresas
                await fetchEmpresas();

                // Seleccionar la nueva empresa
                onSeleccionar(response.data.empresa.id);

                // Cerrar modal y limpiar form
                setShowModal(false);
                setFormData({ rfc: '', razonSocial: '' });

                alert('✓ Empresa creada exitosamente');
            }
        } catch (err: any) {
            console.error('Error al crear empresa:', err);
            alert(err.response?.data?.message || 'Error al crear la empresa');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Cargando empresas...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-sm text-red-500">{error}</span>
            </div>
        );
    }

    if (empresas.length === 0) {
        return (
            <>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">No hay empresas registradas</span>
                    <button
                        onClick={() => setShowModal(true)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + Registrar Empresa
                    </button>
                </div>

                {/* Modal de Registro Rápido */}
                {showModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Registro Rápido de Empresa
                            </h2>
                            <form onSubmit={handleCrearEmpresa} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        RFC *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.rfc}
                                        onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                                        placeholder="XAXX010101000"
                                        maxLength={13}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">12 o 13 caracteres</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Razón Social *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.razonSocial}
                                        onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                                        placeholder="Mi Empresa SA de CV"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        disabled={submitting}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Creando...' : 'Crear Empresa'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <label htmlFor="empresa-select" className="text-sm font-medium text-gray-700">
                Empresa:
            </label>
            <select
                id="empresa-select"
                value={empresaSeleccionada || ''}
                onChange={(e) => onSeleccionar(e.target.value)}
                className="
                    px-3 py-2 
                    border border-gray-300 rounded-lg 
                    bg-white 
                    text-sm text-gray-900
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    hover:border-gray-400
                    transition-colors
                "
            >
                {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                        {empresa.razonSocial} ({empresa.rfc})
                    </option>
                ))}
            </select>
            <button
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                title="Agregar nueva empresa"
            >
                + Nueva
            </button>

            {/* Modal de Registro */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Registrar Nueva Empresa
                        </h2>
                        <form onSubmit={handleCrearEmpresa} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    RFC *
                                </label>
                                <input
                                    type="text"
                                    value={formData.rfc}
                                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                                    placeholder="XAXX010101000"
                                    maxLength={13}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">12 o 13 caracteres</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Razón Social *
                                </label>
                                <input
                                    type="text"
                                    value={formData.razonSocial}
                                    onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                                    placeholder="Mi Empresa SA de CV"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setFormData({ rfc: '', razonSocial: '' });
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Creando...' : 'Crear Empresa'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SelectorEmpresa;
