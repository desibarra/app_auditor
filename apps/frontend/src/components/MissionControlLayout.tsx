import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useEmpresa } from '../context/EmpresaContext';
import axios from 'axios';
import { useEffect } from 'react';

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
    { label: 'Reporte SAT (REP)', path: '/reportes/sat-rep' },
];

const MissionControlLayout: React.FC<LayoutProps> = ({ children, title }) => {
    const location = useLocation();
    const { empresa, listaEmpresas, seleccionarEmpresa, loading, refreshEmpresas } = useEmpresa();

    // Estado para Modal de Nueva Empresa
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ rfc: '', razonSocial: '' });
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null); // Nuevo estado de error visual
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [darkMode]);

    const handleEmpresaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'NEW') {
            setErrorMsg(null); // Reset error al abrir
            setFormData({ rfc: '', razonSocial: '' });
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
        setErrorMsg(null); // Limpiar errores previos

        if (!formData.rfc || !formData.razonSocial) return;

        try {
            setSubmitting(true);
            const res = await axios.post('/api/empresas', formData);
            if (res.data.success) {
                // Éxito: Cerrar modal y recargar
                setShowModal(false);
                await refreshEmpresas();
                window.location.reload();
            }
        } catch (error: any) {
            console.error("Error creating company:", error);

            // Extracción inteligente del mensaje de error del backend
            let message = 'Error desconocido al crear la empresa.';

            if (error.response?.data) {
                const data = error.response.data;
                // Si el backend envía { message: "..." } o { error: "...", message: "..." }
                if (data.message) {
                    if (Array.isArray(data.message)) {
                        message = data.message[0]; // NestJS class-validator devuelve arrays
                    } else {
                        message = data.message;
                    }
                }
            } else if (error.message) {
                message = error.message;
            }

            setErrorMsg(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-main)] font-sans text-[13px] transition-colors duration-500">
            {/* Header Utilitario tipo Modern SaaS */}
            <div className="bg-[var(--color-bg-card)]/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-[var(--color-border)] px-8 py-3 sticky top-0 z-20 shadow-sm transition-all">
                <div className="max-w-[1600px] mx-auto flex justify-between items-center h-12">
                    <div className="flex items-center gap-10">
                        <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <div className="w-9 h-9 bg-[#0f172a] dark:bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-slate-900/10">S</div>
                            <span className="font-black tracking-tighter text-[#0f172a] dark:text-white text-lg uppercase">Sentinel</span>
                        </Link>
                        <nav className="flex gap-10 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                            {NAV_ITEMS.map((item) => {
                                const isActive = location.pathname.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`transition-all relative py-2 ${isActive
                                            ? 'text-[#0f172a] dark:text-blue-400'
                                            : 'hover:text-slate-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {item.label}
                                        {isActive && (
                                            <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#0f172a] dark:bg-blue-500 rounded-full shadow-[0_-1px_8px_rgba(15,23,42,0.4)] animate-in slide-in-from-bottom-1 transition-colors"></span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="flex items-center gap-8">
                        {title && title !== 'AUDITORÍA DETALLADA' && title !== 'DASHBOARD' && (
                            <span className="hidden lg:inline-block bg-[var(--color-bg-app)] text-[var(--color-text-main)] px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-[var(--color-border)] italic shadow-sm transition-all">
                                {title}
                            </span>
                        )}

                        {/* SELECTOR DE EMPRESA GLOBAL */}
                        <div className="flex items-center gap-4 bg-[var(--color-bg-card)] px-4 py-2 rounded-xl border border-[var(--color-border)] shadow-sm group hover:border-slate-400 dark:hover:border-blue-500 transition-all">
                            <div className="flex flex-col items-end">
                                {loading ? (
                                    <span className="text-slate-300 text-[10px] animate-pulse font-black uppercase tracking-widest">Protocolo de Carga...</span>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <select
                                                value={empresa?.id || ''}
                                                onChange={handleEmpresaChange}
                                                className="appearance-none bg-transparent font-black text-[var(--color-text-main)] text-right pr-6 focus:outline-none cursor-pointer transition-colors py-0 m-0 text-[11px] uppercase tracking-tighter"
                                                style={{ direction: 'rtl' }}
                                            >
                                                {listaEmpresas.map(emp => (
                                                    <option key={emp.id} value={emp.id} className="text-left text-slate-800 font-bold">
                                                        {emp.razonSocial.toUpperCase()}
                                                    </option>
                                                ))}
                                                <option value="" disabled>──────────────────</option>
                                                <option value="NEW" className="text-emerald-600 font-black">+ REGISTRAR ENTIDAD</option>
                                            </select>
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-[#0f172a]">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                        <span className="text-slate-400 text-[9px] font-black font-mono leading-none tracking-tight">
                                            RFC: {empresa?.rfc || '---'}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="text-[var(--color-text-dim)] hover:text-[var(--color-text-main)] transition-all p-2 bg-[var(--color-bg-app)] rounded-lg border border-[var(--color-border)] shadow-inner"
                        >
                            {darkMode ? '☀️' : '🌙'}
                        </button>

                        <Link to="/config" className="text-[var(--color-text-dim)] hover:text-[var(--color-primary)] border-l border-[var(--color-border)] pl-8 h-8 flex items-center transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-8 py-8 animate-in fade-in duration-700">
                {children}
            </main>

            {/* MODAL DE REGISTRO RÁPIDO */}
            {showModal && (
                <div className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(15,23,42,0.3)] border border-slate-100 w-full max-w-xl p-14 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Nueva Entidad</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Protocolo de Registro en Bóveda</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="bg-slate-50 hover:bg-slate-100 text-slate-400 p-3 rounded-2xl transition-all active:scale-90">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* ÁREA DE ERROR VISUAL */}
                        {errorMsg && (
                            <div className="mb-10 p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-start gap-5 animate-in slide-in-from-top-4 duration-500 shadow-sm">
                                <span className="text-2xl mt-0.5">⚠️</span>
                                <div>
                                    <p className="text-[11px] font-black text-rose-800 uppercase tracking-widest">Protocolo Interrumpido</p>
                                    <p className="text-[11px] text-rose-600 font-bold mt-1.5 leading-relaxed">{errorMsg}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleCrearEmpresa}>
                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-3 ml-1">RFC de la Organización</label>
                                    <input
                                        type="text"
                                        placeholder="XAXX010101000"
                                        className={`w-full px-6 py-5 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-slate-500/5 font-mono text-sm font-black uppercase transition-all shadow-inner ${errorMsg ? 'border-rose-300' : 'border-slate-100 focus:border-[#0f172a]'
                                            }`}
                                        maxLength={13}
                                        value={formData.rfc}
                                        onChange={e => {
                                            if (errorMsg) setErrorMsg(null); // Limpiar error al editar
                                            setFormData({ ...formData, rfc: e.target.value.toUpperCase() })
                                        }}
                                        required
                                    />
                                    <div className="flex justify-between items-center mt-3 ml-1">
                                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">Validación SAT Activa</p>
                                        <p className="text-[9px] text-slate-300 font-mono">{formData.rfc.length}/13</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-3 ml-1">Denominación o Razón Social</label>
                                    <input
                                        type="text"
                                        placeholder="EJ. CONSULTORÍA INTEGRAL S.A. DE C.V."
                                        className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl focus:border-[#0f172a] focus:ring-4 focus:ring-slate-500/5 focus:outline-none text-sm font-black uppercase transition-all shadow-inner"
                                        value={formData.razonSocial}
                                        onChange={e => setFormData({ ...formData, razonSocial: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mt-12 flex gap-5">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 btn-secondary py-5 text-[11px] rounded-[1.8rem]"
                                >
                                    ABORTAR
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-[1.5] btn-primary py-5 text-[11px] rounded-[1.8rem] shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
                                >
                                    {submitting && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
                                    {submitting ? 'VALIDANDO...' : 'ESTABLECER ENTIDAD'}
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
