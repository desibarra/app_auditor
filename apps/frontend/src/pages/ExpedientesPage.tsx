import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Expediente {
    id: number;
    folio: string;
    nombre: string;
    montoTotalIva: number;
    cantidadCfdis: number;
    estado: string;
    fechaCreacion: string;
}

import MissionControlLayout from '../components/MissionControlLayout';

function ExpedientesPage() {
    const navigate = useNavigate();

    // 1. Inicialización Robusta (Lazy State)
    const [empresaActiva, setEmpresaActiva] = useState<string>(() => {
        return localStorage.getItem('empresaSeleccionada') || '';
    });

    const [expedientes, setExpedientes] = useState<Expediente[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado para Generador Universal (Default: Mes Actual)
    const [anio, setAnio] = useState(2025);
    const [mes, setMes] = useState(11); // Default Noviembre para demo
    const [generandoZip, setGenerandoZip] = useState(false);

    useEffect(() => {
        // Doble check al montar
        const storedId = localStorage.getItem('empresaSeleccionada');
        if (storedId) {
            setEmpresaActiva(storedId);
            fetchExpedientes(storedId);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchExpedientes = async (empresaId: string) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/expedientes?empresaId=${empresaId}`);
            setExpedientes(response.data);
        } catch (error) {
            console.error('Error al cargar expedientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const descargarLegajoUniversal = async () => {
        const targetEmpresaId = empresaActiva || localStorage.getItem('empresaSeleccionada') || '';
        if (!targetEmpresaId) {
            if (confirm('⚠️ No se ha detectado una empresa activa. ¿Deseas ir al Dashboard para seleccionarla?')) {
                navigate('/dashboard');
            }
            return;
        }
        await ejecutarDescarga(targetEmpresaId, anio, mes);
    };

    const descargarLegajoSnapshot = async (exp: Expediente) => {
        // El nombre suele ser CIERRE MENSUAL YYYY-MM
        const parts = exp.nombre.split(' ');
        const [y, m] = parts[parts.length - 1].split('-');
        await ejecutarDescarga(empresaActiva, parseInt(y), parseInt(m));
    };

    const ejecutarDescarga = async (empresaId: string, a: number, m: number) => {
        try {
            setGenerandoZip(true);
            const response = await axios.post('/api/legajo/exportar', {
                empresaId,
                anio: a,
                mes: m
            }, {
                responseType: 'blob'
            });

            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                const json = JSON.parse(text);
                throw new Error(json.message || 'Error del servidor');
            }

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
            const link = document.createElement('a');
            link.href = url;
            const nombreArchivo = `Legajo_Fiscal_${a}_${m.toString().padStart(2, '0')}.zip`;
            link.setAttribute('download', nombreArchivo);

            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                link.remove();
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (error: any) {
            console.error('❌ Error generando Legajo:', error);
            alert(`⚠️ No se pudo descargar el legajo.`);
        } finally {
            setGenerandoZip(false);
        }
    };

    if (loading) {
        return (
            <MissionControlLayout title="Archivo Digital Maestro">
                <div className="h-[60vh] flex flex-col items-center justify-center gap-5 text-slate-400 font-sans">
                    <div className="w-14 h-14 border-x-4 border-slate-100 border-t-4 border-t-[#0f172a] rounded-2xl animate-spin"></div>
                    <p className="text-[10px] font-black tracking-[0.3em] uppercase opacity-50">Sincronizando Bóveda Digital...</p>
                </div>
            </MissionControlLayout>
        );
    }

    if (!empresaActiva) {
        return (
            <MissionControlLayout title="Archivo Digital Maestro">
                <div className="max-w-4xl mx-auto p-12 text-center mt-20 bg-white border border-slate-100 rounded-[3rem] shadow-2xl shadow-slate-200/50">
                    <div className="mx-auto h-20 w-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center text-4xl mb-8 border border-amber-100 shadow-inner">⚠️</div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Protocolo Interrumpido</h2>
                    <p className="mt-4 text-slate-500 font-medium max-w-md mx-auto leading-relaxed">Se requiere la selección de una unidad operativa (empresa) para acceder al Centro de Gestión de Materialidad.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-primary mt-10 py-3.5 px-10"
                    >
                        ESTABLECER CONEXIÓN DASHBOARD
                    </button>
                </div>
            </MissionControlLayout>
        );
    }

    return (
        <MissionControlLayout title="CENTRO DE GESTIÓN DE MATERIALIDAD">
            <div className="flex flex-col h-full space-y-10 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn-secondary py-2.5 px-6"
                    >
                        <span>←</span> CENTRO DE MANDO
                    </button>
                    <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[#0f172a] text-[10px] font-black tracking-[0.2em] uppercase">SISTEMA DE EVIDENCIA ACTIVO</span>
                    </div>
                </div>

                {/* SECCIÓN PRINCIPAL: GENERADOR DE LEGAJO */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-50 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none group-hover:bg-emerald-50/50 transition-all duration-1000"></div>

                    <div className="p-10 relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3.5 rounded-2xl bg-[#0f172a] text-white shadow-xl shadow-slate-900/20">
                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Generador de Cierre Mensual</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Legajos Fiscales Inmutables</p>
                                </div>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed max-w-xl font-medium">
                                Construcción de expediente maestro digital. Incluye validaciones XML, compulsas de estatus ante el SAT, y reporte consolidado de materialidad para blindaje fiscal.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500 border border-emerald-100 shadow-sm">✓</div> Validación CFDI
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500 border border-emerald-100 shadow-sm">✓</div> Reporte Forense PDF
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500 border border-emerald-100 shadow-sm">✓</div> Hash de Integridad
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-end gap-5 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner w-full lg:w-auto">
                            <div className="flex gap-5">
                                <div className="w-full sm:w-32">
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Año Fiscal</label>
                                    <div className="relative">
                                        <select
                                            value={anio}
                                            onChange={(e) => setAnio(Number(e.target.value))}
                                            className="block w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-xs font-black focus:ring-4 focus:ring-slate-500/5 focus:border-[#0f172a] outline-none appearance-none transition-all cursor-pointer uppercase tracking-widest"
                                        >
                                            <option value={2024}>2024</option>
                                            <option value={2025}>2025</option>
                                            <option value={2026}>2026</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full sm:w-48">
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.2em]">Periodo</label>
                                    <div className="relative">
                                        <select
                                            value={mes}
                                            onChange={(e) => setMes(Number(e.target.value))}
                                            className="block w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-xs font-black focus:ring-4 focus:ring-slate-500/5 focus:border-[#0f172a] outline-none appearance-none transition-all cursor-pointer uppercase tracking-widest"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {new Date(0, i).toLocaleString('es-MX', { month: 'long' }).toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={descargarLegajoUniversal}
                                disabled={generandoZip}
                                className={`btn-primary w-full sm:w-auto h-[46px] min-w-[180px] shadow-xl shadow-slate-900/10 ${generandoZip ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {generandoZip ? (
                                    <div className="flex items-center gap-3">
                                        <div className="h-4 w-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                                        <span>PROCESANDO...</span>
                                    </div>
                                ) : (
                                    "GENERAR LEGAJO"
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* HISTORIAL */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="w-2.5 h-2.5 bg-[#0f172a] rounded-full shadow-sm shadow-slate-900/20"></span> Historial de Protocolos Generados
                        </h3>
                        {expedientes.length > 0 && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{expedientes.length} ARCHIVADOS</span>}
                    </div>

                    {expedientes.length === 0 ? (
                        <div className="text-center py-28 bg-white/50 rounded-[3rem] border border-dashed border-slate-200 shadow-inner">
                            <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-xl shadow-slate-200/50">
                                <span className="text-4xl grayscale opacity-30">📁</span>
                            </div>
                            <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Base de Datos de Historial Vacía</h4>
                            <p className="text-[10px] text-slate-400 font-medium px-8 mt-3 max-w-sm mx-auto uppercase leading-loose">
                                No se han detectado cierres mensuales previos registrados en el protocolo institucional.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100">
                                        <tr>
                                            <th className="px-10 py-6">ID Folio</th>
                                            <th className="px-10 py-6">Denominación Protocolo</th>
                                            <th className="px-10 py-6">Timestamp Ejecución</th>
                                            <th className="px-10 py-6 text-center">Estatus Forense</th>
                                            <th className="px-10 py-6 text-right">Análisis</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {expedientes.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-slate-50/50 transition-all group">
                                                <td className="px-10 py-7 font-mono font-black text-xs text-slate-900 uppercase">
                                                    {exp.folio}
                                                </td>
                                                <td className="px-10 py-7">
                                                    <div className="font-black text-slate-900 text-sm tracking-tighter uppercase group-hover:text-[#0f172a] transition-colors">{exp.nombre}</div>
                                                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-1">Legajo Consolidado XML + PDF</div>
                                                </td>
                                                <td className="px-10 py-7 font-mono text-[11px] text-slate-500 font-black">
                                                    {new Date(exp.fechaCreacion).toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                                </td>
                                                <td className="px-10 py-7 text-center">
                                                    <div className={`mx-auto w-fit ${exp.estado === 'COMPLETO' ? 'badge-success' : 'px-4 py-1.5 rounded-xl text-[9px] font-black border bg-amber-50 text-amber-700 border-amber-100 shadow-sm'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${exp.estado === 'COMPLETO' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                        {exp.estado === 'COMPLETO' ? 'VÁLIDO E INMUTABLE' : 'PENDIENTE DE CIERRE'}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-7 text-right">
                                                    <button
                                                        onClick={() => descargarLegajoSnapshot(exp)}
                                                        disabled={generandoZip}
                                                        className="text-[10px] font-black uppercase tracking-widest text-[#0f172a] hover:bg-[#0f172a] hover:text-white border border-[#0f172a]/20 px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-[#0f172a]/20 bg-white"
                                                    >
                                                        {generandoZip ? '...' : 'CONSULTAR'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MissionControlLayout>
    );
}

export default ExpedientesPage;
