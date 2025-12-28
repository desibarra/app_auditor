import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import SelectorEmpresa from '../components/SelectorEmpresa';
import MissionControlLayout from '../components/MissionControlLayout';
import FiscalCharts from '../components/FiscalCharts';
import ContextBar from '../components/ContextBar';

interface SentinelSummary {
    periodo: string;
    flujo: string;
    empresaMeta?: {
        razonSocial: string;
        rfc: string;
        sector?: string;
        regimenFiscal?: string;
    };
    kpis: {
        total: number;
        ingresos: number;
        egresos: number;
        countIngresos: number;
        countEgresos: number;
    };
    perfilRiesgo: 'CRÍTICO' | 'MEDIO' | 'BAJO';
    alertas: {
        tipo: 'ROJA' | 'AMARILLA';
        titulo: string;
        desc: string;
        fundamento: string;
    }[];
    alertasMeta: {
        vista: string;
        flujo: string;
        periodo: string;
    };
    tendencia: {
        status: 'OK' | 'INSUFICIENTE';
        mesesDisponibles: number;
        data: { mes: string; ingresos: number; egresos: number }[];
    };
    topConcentracion: {
        id: string;
        nombre: string;
        total: number;
    }[];
    timestamp: string;
}

function DashboardPage() {
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string | null>(() => {
        return localStorage.getItem('empresaSeleccionada');
    });

    const [tabPrincipal, setTabPrincipal] = useState<'emitidos' | 'recibidos'>('emitidos');
    const [subTab, setSubTab] = useState<string>('ingresos');

    const [filtros, setFiltros] = useState({
        mes: new Date().toISOString().substring(0, 7)
    });

    const [summary, setSummary] = useState<SentinelSummary | null>(null);
    const [loading, setLoading] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);

    // 1. CONSISTENCIA DE FLUJO
    useEffect(() => {
        if (tabPrincipal === 'emitidos' && (subTab === 'gastos')) setSubTab('ingresos');
        if (tabPrincipal === 'recibidos' && (subTab === 'ingresos' || subTab === 'nomina')) setSubTab('gastos');
    }, [tabPrincipal]);

    // 2. SENTINEL ENGINE FETCH (FUENTE ÚNICA DE VERDAD)
    useEffect(() => {
        const fetchSummary = async () => {
            if (!empresaSeleccionada || !filtros.mes) return;
            setLoading(true);
            try {
                let flujoLargo: 'EMITIDOS' | 'RECIBIDOS' | 'PAGOS' = 'RECIBIDOS';
                if (subTab === 'pagos') flujoLargo = 'PAGOS';
                else if (tabPrincipal === 'emitidos') flujoLargo = 'EMITIDOS';
                else flujoLargo = 'RECIBIDOS';

                const res = await axios.get('/api/stats/sentinel-summary', {
                    params: {
                        empresaId: empresaSeleccionada,
                        periodo: filtros.mes,
                        flujo: flujoLargo
                    }
                });
                setSummary(res.data);
            } catch (err) {
                console.error("Sentinel Engine Critical Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, [empresaSeleccionada, filtros.mes, tabPrincipal, subTab]);

    const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFiltros({ mes: e.target.value });
    };

    const tryShowPicker = (ref: React.RefObject<HTMLInputElement>) => {
        try {
            if (ref.current && 'showPicker' in ref.current) {
                // @ts-ignore
                ref.current.showPicker();
            } else {
                (ref.current as any)?.click();
            }
        } catch (error) {
            console.warn('Picker error', error);
        }
    };

    if (loading && !summary) {
        return (
            <MissionControlLayout title="CENTRO DE MANDO" lastUpdate={null}>
                <div className="h-[70vh] flex flex-col items-center justify-center text-center">
                    <div className="relative w-24 h-24 mb-10">
                        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl">🛡️</span>
                        </div>
                    </div>
                    <p className="text-gray-500 font-black text-[12px] uppercase tracking-[0.5em] animate-pulse">Sentinel Auditing Engine Initializing...</p>
                </div>
            </MissionControlLayout>
        );
    }

    if (!empresaSeleccionada) {
        return (
            <MissionControlLayout title="IDENTIDAD PENDIENTE">
                <div className="h-[60vh] flex flex-col items-center justify-center text-center p-8 bg-black/20 rounded-3xl border border-gray-800/50 m-8">
                    <div className="w-20 h-20 bg-indigo-600/10 rounded-3xl flex items-center justify-center mb-8 rotate-12 border border-indigo-500/20">
                        <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Ausencia de Identidad Fiscal</h2>
                    <p className="text-gray-500 max-w-xs mb-10 text-xs font-medium leading-relaxed">Seleccione una entidad para desplegar el mapa de riesgos y comportamiento transaccional forense.</p>
                    <div className="w-72">
                        <SelectorEmpresa
                            empresaSeleccionada={null}
                            onSeleccionar={(id) => {
                                setEmpresaSeleccionada(id);
                                localStorage.setItem('empresaSeleccionada', id);
                            }}
                        />
                    </div>
                </div>
            </MissionControlLayout>
        );
    }

    const currentEmpresa = summary?.empresaMeta;

    return (
        <MissionControlLayout title="CENTRO DE MANDO FISCAL" lastUpdate={null}>

            {/* BARRA DE CONTEXTO DINÁMICA */}
            <div className="mb-8">
                <ContextBar
                    empresaNombre={currentEmpresa?.razonSocial || "IDENTIDAD CARGANDO..."}
                    empresaRfc={currentEmpresa?.rfc || "---"}
                    periodoLabel={filtros.mes}
                    modo={tabPrincipal}
                    subModo={subTab.toUpperCase()}
                    sector={currentEmpresa?.sector}
                    regimenFiscal={currentEmpresa?.regimenFiscal}
                />
            </div>

            <div className="space-y-8">

                {/* NIVEL 1: KPIs GLOBALES */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* RIESGO */}
                    <div className="lg:col-span-3 fiscal-card p-6 border-l-4 border-l-indigo-600 group hover:bg-white/5 transition-all">
                        <span className="text-[10px] text-gray-500 font-black tracking-[0.2em] block mb-6 uppercase">Dictamen Forense</span>
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <div className={`w-3.5 h-3.5 rounded-full ${summary?.perfilRiesgo === 'CRÍTICO' ? 'bg-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.6)]' : summary?.perfilRiesgo === 'MEDIO' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'}`}></div>
                                <span className={`text-3xl font-black tracking-tighter ${summary?.perfilRiesgo === 'CRÍTICO' ? 'text-rose-500' : summary?.perfilRiesgo === 'MEDIO' ? 'text-yellow-500' : 'text-emerald-500'}`}>
                                    {summary?.perfilRiesgo || 'BAJO'}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-600 font-bold mt-2 font-mono uppercase tracking-tighter italic">Validación SAT-Grade Activa</p>
                        </div>
                    </div>

                    {/* IMPORTES */}
                    <div className="lg:col-span-6 grid grid-cols-2 gap-6">
                        <div className="fiscal-card p-6 flex flex-col justify-center relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg className="w-12 h-12 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" /><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" /></svg>
                            </div>
                            <span className="text-[10px] text-gray-500 font-black tracking-[0.2em] block mb-2 uppercase">Importe Acumulado</span>
                            <div className="text-3xl font-black font-mono text-white tracking-tighter">
                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(summary?.kpis.ingresos || 0)}
                            </div>
                            <p className="text-[10px] text-gray-600 mt-2 font-bold uppercase tracking-tight">Periodo Auditado: {filtros.mes}</p>
                        </div>
                        <div className="fiscal-card p-6 flex flex-col justify-center relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                <svg className="w-12 h-12 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 002-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                            </div>
                            <span className="text-[10px] text-gray-500 font-black tracking-[0.2em] block mb-2 uppercase">Validaciones Forenses</span>
                            <div className="text-3xl font-black font-mono text-white tracking-tighter">
                                {summary?.kpis.total || 0}
                            </div>
                            <p className="text-[10px] text-gray-600 mt-2 font-bold uppercase tracking-tight">CFDIs en Base de Datos</p>
                        </div>
                    </div>

                    {/* FILTROS */}
                    <div className="lg:col-span-3 fiscal-card p-5 flex flex-col gap-4">
                        <div>
                            <span className="text-[10px] text-gray-500 font-black tracking-[0.2em] block mb-2 uppercase">Periodo de Análisis</span>
                            <div className="relative group" onClick={() => tryShowPicker(dateInputRef)}>
                                <input
                                    ref={dateInputRef}
                                    type="month"
                                    className="w-full bg-[#080a0f] border border-gray-800 text-white rounded px-3 py-2 text-sm font-mono outline-none group-hover:border-indigo-500 transition-colors cursor-pointer"
                                    value={filtros.mes}
                                    onChange={handleFechaChange}
                                />
                            </div>
                        </div>
                        <div className="flex bg-[#050505] p-1 rounded-lg border border-gray-800 shadow-inner">
                            <button onClick={() => setTabPrincipal('emitidos')} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded transition-all ${tabPrincipal === 'emitidos' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-300'}`}>EMITIDOS</button>
                            <button onClick={() => setTabPrincipal('recibidos')} className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded transition-all ${tabPrincipal === 'recibidos' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:text-gray-300'}`}>RECIBIDOS</button>
                        </div>
                    </div>
                </div>

                {/* NIVEL 2: CLASIFICACIÓN (SENTINEL SELECTORS) */}
                <div className="fiscal-card p-5 bg-gradient-to-r from-[#151A23] to-[#1a212b]">
                    <span className="text-[10px] text-gray-500 font-black tracking-[0.2em] block mb-6 uppercase">Flujo Transaccional Validado</span>
                    <div className="flex flex-wrap gap-2">
                        {(tabPrincipal === 'emitidos'
                            ? ['ingresos', 'nomina', 'pagos', 'notas_credito']
                            : ['gastos', 'pagos', 'notas_credito']
                        ).map(st => (
                            <button
                                key={st}
                                onClick={() => setSubTab(st)}
                                className={`px-6 py-2.5 text-[10px] font-black uppercase border rounded-xl transition-all ${subTab === st ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)] ring-1 ring-emerald-500/20' : 'bg-transparent text-gray-600 border-gray-800/50 hover:border-gray-600'}`}
                            >
                                {st.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* NIVEL 3: ALERTAS CORE */}
                <div className="fiscal-card border-l-4 border-l-rose-600 relative overflow-hidden min-h-[140px]">
                    {loading && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-20 flex items-center justify-center">
                            <span className="text-rose-500 text-[11px] font-black tracking-[0.5em] animate-pulse uppercase">Auditing Engine Recalculating...</span>
                        </div>
                    )}
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-gray-400 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-4">
                                <span className="w-1.5 h-4 bg-rose-600 rounded-full shadow-[0_0_10px_rgba(225,29,72,0.4)]"></span>
                                ALERTAS FORENSES — {tabPrincipal.toUpperCase()} — {filtros.mes}
                            </h3>
                            {summary?.alertas.length === 0 && (
                                <span className="text-[10px] font-black px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 uppercase tracking-widest ring-1 ring-emerald-500/20">🛡️ Operación Técnicamente Coherente</span>
                            )}
                        </div>

                        <div className="space-y-4">
                            {summary?.alertas && summary.alertas.length > 0 ? (
                                summary.alertas.map((alerta, idx) => (
                                    <div key={idx} className={`p-6 rounded-2xl border flex flex-col gap-4 transition-all hover:translate-x-1 ${alerta.tipo === 'ROJA' ? 'bg-rose-500/5 border-rose-500/20 shadow-[0_4px_20px_rgba(225,29,72,0.05)]' : 'bg-yellow-500/5 border-yellow-500/20 shadow-[0_4px_20px_rgba(245,158,11,0.05)]'}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-5">
                                                <div className={`w-3 h-3 rounded-full ${alerta.tipo === 'ROJA' ? 'bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.6)]' : 'bg-yellow-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]'}`}></div>
                                                <span className="text-sm font-black text-gray-100 uppercase tracking-wide">{alerta.titulo}</span>
                                            </div>
                                            <span className="text-[10px] font-mono font-black text-gray-500 bg-black/60 px-3 py-1.5 rounded-lg border border-white/5 tracking-tighter uppercase">{alerta.fundamento}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-400 leading-relaxed pl-8 font-medium tracking-wide border-l border-white/5 ml-1.5 py-1">
                                            {alerta.desc}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center border-2 border-dashed border-gray-800/40 rounded-3xl bg-black/10">
                                    <div className="w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/10">
                                        <span className="text-3xl">🛡️</span>
                                    </div>
                                    <p className="text-gray-400 text-xs font-black uppercase tracking-[0.3em]">{summary?.alertasMeta?.flujo === 'pagos' ? 'Trazabilidad de Complementos Validada' : 'No se detectaron Anomalías'}</p>
                                    <p className="text-gray-600 text-[11px] mt-4 max-w-sm mx-auto leading-relaxed font-bold italic">
                                        El Sentinel Engine ha completado el análisis de <strong>{subTab.toUpperCase()}</strong> sin hallazgos forenses críticos para este periodo.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* NIVEL 4: ANALÍTICA AVANZADA */}
                <FiscalCharts
                    tendencia={summary?.tendencia}
                    topConcentracion={summary?.topConcentracion}
                    tipo={tabPrincipal === 'emitidos' ? 'ingresos' : 'gastos'}
                />

            </div>
        </MissionControlLayout>
    );
}

export default DashboardPage;
