import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useEmpresa } from '../context/EmpresaContext';
import axios from 'axios';

interface LayoutProps {
    children: ReactNode;
    title?: string;
    lastUpdate?: Date | null;
}

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Auditoría Detallada', path: '/auditoria' },
    { label: 'Expedientes & Riesgos', path: '/expedientes' },
    { label: 'Conciliación Bancaria', path: '/bancos' },
    { label: 'Devoluciones', path: '/devoluciones' },
];

const MissionControlLayout: React.FC<LayoutProps> = ({ children, title, lastUpdate }) => {
    const location = useLocation();
    const { empresa, listaEmpresas, seleccionarEmpresa, loading, refreshEmpresas } = useEmpresa();

    // Estado para Modal de Nueva Empresa
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ rfc: '', razonSocial: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleEmpresaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'NEW') {
            setShowModal(true);
            return;
        }
        const selected = listaEmpresas.find(emp => emp.id === value);
        if (selected) {
            seleccionarEmpresa(selected);
        }
    };

    const handleCrearEmpresa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.rfc || !formData.razonSocial) return;

        try {
            setSubmitting(true);
            const res = await axios.post('/api/empresas', formData);
            if (res.data.success) {
                await refreshEmpresas(); // Recargar lista del contexto
                const nueva = res.data.empresa;
                // Seleccionar explícitamente la nueva empresa
                // (refreshEmpresas podría no seleccionarla automáticamente si ya había una seleccionada)
                // Pero aquí queremos forzar el cambio a la nueva creada
                // Sin embargo seleccionarEmpresa espera un objeto completo que viene de la lista
                // Esperamos a que el contexto se actualice... o mejor, forzamos reloading
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            alert('Error al crear empresa. Verifique el RFC.');
        } finally {
            setSubmitting(false);
            setShowModal(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans text-sm selection:bg-zinc-200">
            {/* Header Utilitario tipo SAP/Oracle - CONSISTENTE CON DASHBOARD */}
            <div className="bg-white border-b border-zinc-300 px-6 py-2 sticky top-0 z-20 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex justify-between items-center h-10">
                    <div className="flex items-center gap-6">
                        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <span className="font-bold tracking-tight text-zinc-800">SENTINEL</span>
                            <span className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 text-[10px] font-mono text-zinc-500 rounded-sm">
                                AUDIT MODE
                            </span>
                        </Link>
                        <div className="h-4 w-px bg-zinc-300 mx-2"></div>
                        <nav className="flex gap-6 text-xs font-medium text-zinc-600">
                            {NAV_ITEMS.map((item) => {
                                const isActive = location.pathname.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`transition-colors ${isActive
                                            ? 'text-zinc-900 border-b-2 border-zinc-900 pb-[13px]'
                                            : 'hover:text-zinc-900'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        {title && title !== 'AUDITORÍA DETALLADA' && title !== 'DASHBOARD' && (
                            <span className="hidden lg:inline-block bg-zinc-100 px-2 py-0.5 rounded text-[10px] font-bold text-zinc-500 uppercase tracking-wider border border-zinc-200">
                                {title}
                            </span>
                        )}

                        {/* SELECTOR DE EMPRESA GLOBAL */}
                        <div className="flex flex-col items-end relative group">
                            {loading ? (
                                <span className="text-zinc-400 text-[10px]">Cargando...</span>
                            ) : (
                                <>
                                    <div className="relative">
                                        <select
                                            value={empresa?.id || ''}
                                            onChange={handleEmpresaChange}
                                            className="appearance-none bg-transparent font-semibold text-zinc-700 text-right pr-6 focus:outline-none cursor-pointer hover:text-blue-600 transition-colors py-0 m-0"
                                            style={{ direction: 'rtl' }}
                                        >
                                            {listaEmpresas.map(emp => (
                                                <option key={emp.id} value={emp.id} className="text-left text-zinc-700">
                                                    {emp.razonSocial}
                                                </option>
                                            ))}
                                            <option value="" disabled>──────────────────</option>
                                            <option value="NEW" className="text-blue-600 font-bold">+ Registrar Nueva Empresa</option>
                                        </select>
                                        {/* Flecha custom */}
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                    <span className="text-zinc-400 text-[10px] font-mono mt-0 leading-none">
                                        RFC: {empresa?.rfc || '---'}
                                    </span>
                                </>
                            )}
                        </div>

                        <Link to="/config" className="text-zinc-400 hover:text-zinc-600 border-l border-zinc-200 pl-4 ml-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-6">
                {children}
            </main>

            {/* MODAL DE REGISTRO RÁPIDO (Estilo Enterprise) */}
            {showModal && (
                <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white rounded-sm shadow-2xl border border-zinc-200 w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-zinc-800 font-bold text-lg">Nueva Entidad Fiscal</h3>
                            <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCrearEmpresa}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">RFC de la Organización</label>
                                    <input
                                        type="text"
                                        placeholder="XAXX010101000"
                                        className="w-full border border-zinc-300 px-3 py-2 rounded-sm focus:border-blue-500 focus:outline-none font-mono text-sm uppercase"
                                        maxLength={13}
                                        value={formData.rfc}
                                        onChange={e => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Razón Social</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Consultoría Integral S.A. de C.V."
                                        className="w-full border border-zinc-300 px-3 py-2 rounded-sm focus:border-blue-500 focus:outline-none text-sm"
                                        value={formData.razonSocial}
                                        onChange={e => setFormData({ ...formData, razonSocial: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 rounded-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm bg-zinc-900 text-white hover:bg-zinc-800 rounded-sm font-medium disabled:opacity-50"
                                >
                                    {submitting ? 'Registrando...' : 'Dar de Alta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MissionControlLayout;
