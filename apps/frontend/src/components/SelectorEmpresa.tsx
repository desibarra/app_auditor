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

            // Lógica de Selección Inteligente
            if (!empresaSeleccionada && response.data.length > 0) {
                // 1. Buscar Traslados de Vanguardia (TVA)
                const tva = response.data.find((e: Empresa) => e.rfc.includes('TVA060209QL6'));
                if (tva) {
                    onSeleccionar(tva.id);
                } else {
                    // 2. Buscar Koppara (si se conoce RFC, agregar aquí)
                    const koppara = response.data.find((e: Empresa) => e.razonSocial?.toUpperCase().includes('KOPPARA'));
                    if (koppara) {
                        onSeleccionar(koppara.id);
                    } else {
                        // 3. Fallback a la primera
                        onSeleccionar(response.data[0].id);
                    }
                }
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
        <div className="flex items-center gap-4">
            <div className="relative group">
                <select
                    id="empresa-select"
                    value={empresaSeleccionada || ''}
                    onChange={(e) => onSeleccionar(e.target.value)}
                    className="
                        appearance-none
                        px-4 py-2 pr-10
                        bg-white
                        border border-slate-200 hover:border-slate-400
                        rounded-lg
                        text-[11px] font-black text-slate-900 uppercase tracking-widest
                        focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500
                        transition-all cursor-pointer shadow-sm
                    "
                >
                    {empresas.map((empresa) => (
                        <option key={empresa.id} value={empresa.id}>
                            {empresa.razonSocial.toUpperCase()}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
            </div>

            <button
                onClick={() => setShowModal(true)}
                className="p-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-all group"
                title="Registrar nueva entidad"
            >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            </button>

            {/* Modal de Registro */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-10 w-full max-w-md shadow-2xl border border-slate-200">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                                    Nueva Entidad
                                </h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Protocolo de Registro Fiscal</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="bg-slate-50 hover:bg-slate-100 text-slate-400 p-2 rounded-xl transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCrearEmpresa} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                    Registro Federal (RFC)
                                </label>
                                <input
                                    type="text"
                                    value={formData.rfc}
                                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                                    placeholder="XAXX010101000"
                                    maxLength={13}
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500 text-sm font-bold text-slate-900 placeholder:text-slate-300 transition-all font-mono"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                    Razón Social Legal
                                </label>
                                <input
                                    type="text"
                                    value={formData.razonSocial}
                                    onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                                    placeholder="Nombre completo de la empresa"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-500/10 focus:border-slate-500 text-sm font-bold text-slate-900 placeholder:text-slate-300 transition-all"
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setFormData({ rfc: '', razonSocial: '' });
                                    }}
                                    className="flex-1 btn-secondary text-[10px]"
                                    disabled={submitting}
                                >
                                    CANCELAR
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary text-[10px]"
                                    disabled={submitting}
                                >
                                    {submitting ? 'CREANDO...' : 'DAR DE ALTA'}
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
