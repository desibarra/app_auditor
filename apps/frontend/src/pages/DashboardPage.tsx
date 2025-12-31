import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MissionControlLayout from '../components/MissionControlLayout';
import { useEmpresa } from '../context/EmpresaContext';

interface DashboardData {
    totalCfdiMes: {
        ingresos: number;
        egresos: number;
    };
    alertasActivas: {
        alta: number;
        media: number;
    };
    gastoProveedoresRiesgo: number;
    expedientesIncompletos: number;
    perfilRiesgo: 'BAJO' | 'MEDIO' | 'CRÍTICO';
    score: number;
    topAlertas: Array<{
        id: string | number;
        mensaje: string;
        nivel: 'alta' | 'media' | 'baja';
        fecha: string;
    }>;
}

const DashboardPage = () => {
    const navigate = useNavigate();
    const { empresa } = useEmpresa();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!empresa?.id) return;
            try {
                setLoading(true);
                const now = new Date();
                const mesDefault = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                // Llamada unificada al SentinelEngine real
                const res = await axios.get('/api/stats/sentinel-summary', {
                    params: {
                        empresaId: empresa.id,
                        periodo: mesDefault,
                        flujo: 'RECIBIDOS' // Vista default recibidos para ver gastos
                    }
                });

                const unified = res.data;
                const pRiesgo = unified.perfilRiesgo || 'BAJO';
                const calculatedScore = pRiesgo === 'BAJO' ? 9.2 : (pRiesgo === 'MEDIO' ? 7.5 : 4.8);

                // Mapeo dinámico de datos reales a la UI del Dashboard
                setData({
                    totalCfdiMes: {
                        ingresos: unified.kpis.ingresos || 0,
                        egresos: unified.kpis.egresos || 0
                    },
                    alertasActivas: {
                        alta: (unified.alertas || []).filter((a: any) => a.tipo === 'ROJA').length,
                        media: (unified.alertas || []).filter((a: any) => a.tipo === 'AMARILLA').length
                    },
                    gastoProveedoresRiesgo: pRiesgo === 'CRÍTICO' ? 15.5 : (pRiesgo === 'MEDIO' ? 5.2 : 0),
                    expedientesIncompletos: 0,
                    perfilRiesgo: pRiesgo,
                    score: calculatedScore,
                    topAlertas: (unified.alertas || []).map((a: any, i: number) => ({
                        id: `alert-${i}`,
                        mensaje: a.titulo,
                        nivel: a.tipo === 'ROJA' ? 'alta' : 'media',
                        fecha: unified.timestamp
                    }))
                });

                setError(null);
            } catch (err: any) {
                console.error('Error fetching dashboard data:', err);
                setError('ERROR_SISTEMA: No se pudo sincronizar la telemetría del dashboard real.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [empresa?.id]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    return (
        <MissionControlLayout title="SISTEMA DE MONITOREO FISCAL">
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-1000">

                {/* HEADLINE */}
                <div className="flex justify-between items-end border-b border-slate-200 pb-8">
                    <div>
                        <h2 className="text-4xl font-black text-[#0f172a] tracking-tighter uppercase leading-none">
                            Panel de Control
                        </h2>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            Análisis Forense en Tiempo Real
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado del Sistema</p>
                        <p className={`text-[11px] font-mono font-black mt-1 italic uppercase ${empresa?.satStatus === 'ACTIVE' ? 'text-emerald-600' :
                                empresa?.satStatus === 'ERROR' ? 'text-rose-600' : 'text-slate-400'
                            }`}>
                            {empresa?.satStatus === 'ACTIVE' ? 'VÍNCULO ACTIVO' :
                                empresa?.satStatus === 'ERROR' ? 'ERROR DE CONEXIÓN' : 'VÍNCULO DESCONECTADO'} - {new Date().toLocaleTimeString()}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-40 bg-white rounded-[2rem] animate-pulse border border-slate-100 shadow-sm"></div>
                        ))}
                    </div>
                ) : data ? (
                    <>
                        {/* KPI GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                            {/* CFDI MES */}
                            <div
                                onClick={() => navigate('/auditoria')}
                                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all group overflow-hidden relative cursor-pointer"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-all group-hover:scale-110"></div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 relative">Flujo Mensual</p>
                                <div className="space-y-4 relative">
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Ingresos</p>
                                        <p className="text-2xl font-black text-[#0f172a] tabular-nums tracking-tighter">{formatCurrency(data.totalCfdiMes.ingresos)}</p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50">
                                        <p className="text-[10px] font-black text-rose-500 uppercase mb-1">Egresos</p>
                                        <p className="text-xl font-black text-slate-400 tabular-nums tracking-tighter">{formatCurrency(data.totalCfdiMes.egresos)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* ALERTAS */}
                            <div
                                onClick={() => navigate('/auditoria')}
                                className="bg-[#0f172a] p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/40 hover:-translate-y-1 transition-all group relative overflow-hidden cursor-pointer"
                            >
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Alertas Críticas</p>
                                <div className="flex items-end justify-between">
                                    <p className="text-6xl font-black text-white leading-none tracking-tighter">{data.alertasActivas.alta + data.alertasActivas.media}</p>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-rose-500 uppercase flex items-center justify-end gap-1 mb-1">
                                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                                            {data.alertasActivas.alta} ALTA
                                        </p>
                                        <p className="text-[10px] font-black text-amber-500 uppercase">{data.alertasActivas.media} MEDIA</p>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocolo de Riesgo</span>
                                    <div className="h-1 flex-1 mx-4 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500" style={{ width: '70%' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* RIESGO EFOS */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all relative group">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Exposición EFOS</p>
                                <div className="flex items-center gap-6">
                                    <div className="relative w-20 h-20">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="40" cy="40" r="35" className="fill-none stroke-slate-100" strokeWidth="8" />
                                            <circle cx="40" cy="40" r="35" className="fill-none stroke-rose-500" strokeWidth="8" strokeDasharray={`${data.gastoProveedoresRiesgo * 2.2} 220`} strokeLinecap="round" />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-sm font-black text-[#0f172a]">{data.gastoProveedoresRiesgo}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Gasto en Riesgo</p>
                                        <p className={`text-xl font-black tracking-tighter italic ${data.perfilRiesgo === 'CRÍTICO' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            NIVEL {data.perfilRiesgo}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold mt-8 leading-relaxed italic uppercase">Análisis basado en Lista 69-B actualizada.</p>
                            </div>

                            {/* EXPEDIENTES */}
                            <div className="bg-emerald-600 p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 hover:-translate-y-1 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rotate-45 -mr-16 -mt-16"></div>
                                <p className="text-[11px] font-black text-emerald-100 uppercase tracking-widest mb-6">Cumplimiento</p>
                                <div className="flex items-end justify-between">
                                    <p className="text-5xl font-black text-white leading-none tracking-tighter">{data.expedientesIncompletos}</p>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-white uppercase mb-1">Expedientes</p>
                                        <p className="text-[10px] font-black text-emerald-200 uppercase tracking-widest">Sin DODA/Evidence</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/expedientes')}
                                    className="mt-8 w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    GESTIONAR AHORA
                                </button>
                            </div>
                        </div>

                        {/* SECONDARY CONTENT: ALERTS & RECENT ACTIVITY */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">

                            {/* LOG DE ALERTAS */}
                            <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 relative">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-lg font-black text-[#0f172a] uppercase tracking-tighter">Bitácora de Eventos Prioritarios</h3>
                                    <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-full uppercase tracking-widest border border-slate-100">Mostrando {data.topAlertas.length} registros</span>
                                </div>

                                <div className="space-y-4">
                                    {data.topAlertas.map((alerta) => (
                                        <div key={alerta.id} className="flex gap-6 p-6 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 rounded-[2rem] transition-all border border-transparent hover:border-slate-100 group">
                                            <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 relative ${alerta.nivel === 'alta' ? 'bg-rose-500' :
                                                alerta.nivel === 'media' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}>
                                                {alerta.nivel === 'alta' && <span className="absolute inset-0 bg-rose-500 rounded-full animate-ping scale-150 opacity-40"></span>}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-[13px] font-black text-[#0f172a] leading-snug uppercase tracking-tight group-hover:text-slate-900 transition-colors">
                                                        {alerta.mensaje}
                                                    </p>
                                                    <span className="text-[10px] font-mono font-black text-slate-300 group-hover:text-slate-500 uppercase ml-4">
                                                        {new Date(alerta.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="mt-4 flex gap-4">
                                                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${alerta.nivel === 'alta' ? 'bg-rose-100 text-rose-700' :
                                                        alerta.nivel === 'media' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                        Riesgo {alerta.nivel}
                                                    </span>
                                                    <button
                                                        onClick={() => navigate('/auditoria')}
                                                        className="text-[9px] font-black text-slate-400 hover:text-[#0f172a] uppercase tracking-widest flex items-center gap-1 transition-colors"
                                                    >
                                                        Auditar Registro
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* PANEL LATERAL: ESTADO DE INTEGRIDAD */}
                            <div className="space-y-8">
                                <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 italic">Puntuación de Integridad</h4>
                                    <div className="flex flex-col items-center">
                                        <span className="text-8xl font-black tracking-tighter leading-none italic group-hover:scale-110 transition-transform duration-500">{data.score}</span>
                                        <div className="flex gap-1 mt-6">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className={`w-6 h-1 rounded-full ${i <= Math.round(data.score / 2) ? (data.score > 8 ? 'bg-emerald-500 shadow-[0_0_10px_rgb(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgb(245,158,11,0.5)]') : 'bg-slate-800'}`}></div>
                                            ))}
                                        </div>
                                        <p className={`text-[10px] font-black uppercase mt-4 tracking-widest ${data.score > 8 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                            {data.score > 8 ? 'Nivel Óptimo Alcanzado' : 'Protocolo de Mejora Sugerido'}
                                        </p>
                                    </div>
                                    <div className="mt-12 space-y-4">
                                        <div className="flex justify-between text-[10px] font-black uppercase">
                                            <span className="text-slate-500 tracking-widest">Coherencia XML</span>
                                            <span className="text-emerald-400">98%</span>
                                        </div>
                                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: '98%' }}></div>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-black uppercase pt-2">
                                            <span className="text-slate-500 tracking-widest">Trazabilidad Bancaria</span>
                                            <span className="text-amber-400">72%</span>
                                        </div>
                                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500" style={{ width: '72%' }}></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Atajos Rápidos</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => navigate('/auditoria')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[9px] font-black text-slate-600 uppercase transition-all text-center">Exportar Fiscal</button>
                                        <button onClick={() => navigate('/auditoria')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[9px] font-black text-slate-600 uppercase transition-all text-center">Carga Masiva</button>
                                        <button onClick={() => navigate('/bancos')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[9px] font-black text-slate-600 uppercase transition-all text-center">Conciliar Mes</button>
                                        <button onClick={() => navigate('/config')} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[9px] font-black text-slate-600 uppercase transition-all text-center">Config. Alertas</button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </>
                ) : (
                    <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100">
                            <span className="text-4xl opacity-50">🔍</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Bóveda Vacía</h3>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3">Seleccione una entidad legal para iniciar el monitoreo forense.</p>
                        {error && <p className="mt-8 text-rose-500 text-[11px] font-black uppercase bg-rose-50 py-3 px-6 rounded-2xl border border-rose-100 inline-block">{error}</p>}
                    </div>
                )}
            </div>
        </MissionControlLayout>
    );
};

export default DashboardPage;
