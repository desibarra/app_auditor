import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMetricasDominio } from '../hooks/useMetricasDominio';
import { TablaControlMensualDominio } from '../components/TablaControlMensualDominio';
import MissionControlLayout from '../components/MissionControlLayout';
import ContextBar from '../components/ContextBar';
import SelectorEmpresa from '../components/SelectorEmpresa';
import ImportarXML from '../components/ImportarXML';
import axios from 'axios';
import InformeDefenseModal from '../components/fiscal/InformeDefenseModal';
import ComplementosPagoTable from '../components/fiscal/ComplementosPagoTable';

const AuditoriaDetalladaPage: React.FC = () => {
    // ESTADO CENTRAL (CONTEXTO FISCAL)
    const [empresaId, setEmpresaId] = useState<string | null>(() => localStorage.getItem('empresaSeleccionada'));
    const [periodo, setPeriodo] = useState<{ mes: string; anio: string }>({
        mes: new Date().toISOString().substring(5, 7),
        anio: new Date().getFullYear().toString()
    });

    // ESTADO DE UI
    const [tabPrincipal, setTabPrincipal] = useState<'emitidos' | 'recibidos' | 'pagos'>('emitidos');
    const [subTab, setSubTab] = useState<string>('ingresos');
    const [showReporteModal, setShowReporteModal] = useState(false);
    const [empresaData, setEmpresaData] = useState<any>(null);
    const [sentinelStatus, setSentinelStatus] = useState<any>(null);
    const [showHistorialModal, setShowHistorialModal] = useState(false);
    const [historialCambios, setHistorialCambios] = useState<any[]>([]);

    const dateInputRef = useRef<HTMLInputElement>(null);

    // PERSISTENCIA DE EMPRESA
    const handleSeleccionarEmpresa = (id: string) => {
        setEmpresaId(id);
        localStorage.setItem('empresaSeleccionada', id);
    };

    // NAVEGACIÓN Y REACTIVIDAD
    const tryShowPicker = () => {
        if (dateInputRef.current && 'showPicker' in dateInputRef.current) {
            try { dateInputRef.current.showPicker(); } catch (e) { console.warn(e); }
        }
    };

    // FETCH DATA EMPRESA
    useEffect(() => {
        if (!empresaId) return;
        axios.get(`/api/empresas/${empresaId}`).then(res => setEmpresaData(res.data)).catch(console.error);
    }, [empresaId]);

    // SYNC SENTINEL STATUS (KPI SUPERIOR)
    const syncSentinel = useCallback(async () => {
        if (!empresaId) return;
        try {
            const res = await axios.get('/api/stats/sentinel-summary', {
                params: { empresaId, periodo: `${periodo.anio}-${periodo.mes}`, flujo: tabPrincipal.toUpperCase() }
            });
            setSentinelStatus(res.data);
        } catch (e) { console.error(e); }
    }, [empresaId, periodo, tabPrincipal]);



    const fetchHistorial = async () => {
        if (!empresaId) return;
        try {
            const res = await axios.get(`/api/cfdi/historial-estatus?empresaId=${empresaId}`);
            setHistorialCambios(res.data);
            setShowHistorialModal(true);
        } catch (e) {
            console.error('Error fetching historial:', e);
        }
    };

    useEffect(() => { syncSentinel(); }, [syncSentinel]);

    // HOOK DE MÉTRICAS (VISIÓN ANUAL CON FILTRO REACTIVO)
    const getEndpoint = () => {
        const base = tabPrincipal === 'emitidos' ? '/api/cfdi/emitidos' : '/api/cfdi/recibidos';
        const map: any = { ingresos: 'ingresos', gastos: 'gastos', nomina: 'nomina', pagos: 'pagos', notas_credito: 'egresos' };
        return `${base}/${map[subTab] || 'ingresos'}`;
    };

    const { metricas, resumen, loading, refresh } = useMetricasDominio(
        empresaId,
        getEndpoint(),
        { mes: `${periodo.anio}-${periodo.mes}` }
    );

    return (
        <MissionControlLayout title="AUDITORÍA FISCAL DETALLADA">
            <ContextBar
                empresaNombre={empresaData?.razonSocial || "REQUERIDO: SELECCIONAR EMPRESA"}
                empresaRfc={empresaData?.rfc || '---'}
                periodoLabel={`${periodo.mes}/${periodo.anio}`}
                modo={tabPrincipal.toUpperCase()}
                subModo={subTab.toUpperCase()}
                perfilRiesgo={sentinelStatus?.perfilRiesgo || 0}
                sector={empresaData?.sector || 'General'}
                satStatus={empresaData?.satStatus}
            />

            <div className="space-y-10 mt-10 animate-in fade-in duration-700">
                {/* CONFIGURACIÓN DE VISTA */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 lg:col-span-2 group hover:shadow-2xl transition-all duration-500">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-5 block">Bóveda Fiscal: Entidad bajo Auditoría</label>
                        <SelectorEmpresa empresaSeleccionada={empresaId} onSeleccionar={handleSeleccionarEmpresa} />
                    </div>
                    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 group hover:shadow-2xl transition-all duration-500 cursor-pointer" onClick={tryShowPicker}>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-5 block">Ejercicio y Mes de Análisis</label>
                        <div className="flex items-center gap-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] px-6 py-4 hover:border-[#0f172a]/20 transition-all group-hover:bg-white shadow-inner">
                            <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">📅</span>
                            <div className="flex-1">
                                <input
                                    ref={dateInputRef}
                                    type="month"
                                    value={`${periodo.anio}-${periodo.mes}`}
                                    onChange={(e) => {
                                        const [y, m] = e.target.value.split('-');
                                        if (y && m) setPeriodo({ anio: y, mes: m });
                                    }}
                                    className="bg-transparent border-none text-[#0f172a] font-black text-sm focus:ring-0 w-full uppercase cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* NAVEGACIÓN DE DOMINIOS (SEGMENTED CONTROL PREMIUM) */}
                <div className="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 flex gap-2">
                    <button
                        onClick={() => setTabPrincipal('emitidos')}
                        className={`flex-1 py-4.5 px-6 text-[11px] font-black uppercase tracking-[0.2em] rounded-[1.8rem] transition-all duration-500 flex items-center justify-center gap-3 ${tabPrincipal === 'emitidos' ? 'bg-[#0f172a] text-white shadow-xl shadow-slate-900/20 active:scale-95' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className={tabPrincipal === 'emitidos' ? 'opacity-100' : 'opacity-40'}>📤</span>
                        EMITIDOS (VENTAS)
                    </button>
                    <button
                        onClick={() => setTabPrincipal('recibidos')}
                        className={`flex-1 py-4.5 px-6 text-[11px] font-black uppercase tracking-[0.2em] rounded-[1.8rem] transition-all duration-500 flex items-center justify-center gap-3 ${tabPrincipal === 'recibidos' ? 'bg-[#0f172a] text-white shadow-xl shadow-slate-900/20 active:scale-95' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className={tabPrincipal === 'recibidos' ? 'opacity-100' : 'opacity-40'}>📥</span>
                        RECIBIDOS (GASTOS)
                    </button>
                    <button
                        onClick={() => setTabPrincipal('pagos')}
                        className={`flex-1 py-4.5 px-6 text-[11px] font-black uppercase tracking-[0.2em] rounded-[1.8rem] transition-all duration-500 flex items-center justify-center gap-3 ${tabPrincipal === 'pagos' ? 'bg-[#0f172a] text-white shadow-xl shadow-slate-900/20 active:scale-95' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                    >
                        <span className={tabPrincipal === 'pagos' ? 'opacity-100' : 'opacity-40'}>💳</span>
                        PAGOS Y REPS
                    </button>
                </div>

                {/* ACCIONES CRÍTICAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex items-center">
                        <ImportarXML
                            empresaId={empresaId}
                            empresaNombre={empresaData?.razonSocial}
                            periodo={`${periodo.anio}-${periodo.mes}`}
                            onImportComplete={refresh}
                        />
                    </div>

                    <button
                        onClick={fetchHistorial}
                        disabled={!empresaId}
                        className="bg-slate-100 p-4 rounded-[2rem] border border-slate-200 text-[#0f172a] font-black text-[10px] tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                        📜 BITÁCORA DE CAMBIOS SAT
                    </button>
                    <button
                        onClick={() => setShowReporteModal(true)}
                        className="btn-primary py-5 px-10 rounded-[2rem] shadow-2xl shadow-slate-900/20 text-xs tracking-[0.3em]"
                    >
                        ⚖️ INFORME DE DEFENSA FISCAL
                    </button>
                </div>

                {/* TABLA PRINCIPAL REACTIVA */}
                {tabPrincipal === 'pagos' ? (
                    <div className="animate-in slide-in-from-bottom-6 duration-700">
                        {empresaId && <ComplementosPagoTable empresaId={empresaId} periodo={`${periodo.anio}-${periodo.mes}`} />}
                    </div>
                ) : (
                    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden animate-in slide-in-from-bottom-10 duration-1000">
                        <div className="px-10 py-10 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-10">
                            <div>
                                <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-4">
                                    <div className="w-1.5 h-6 bg-[#0f172a] rounded-full"></div>
                                    Desglose Mensual Analítico
                                </h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1.5 ml-5">Exploración detallada de folios fiscales</p>
                            </div>
                            <div className="flex gap-2 p-2 bg-slate-50 rounded-[1.8rem] border border-slate-100 shadow-inner">
                                {(tabPrincipal === 'emitidos' ? ['ingresos', 'nomina', 'pagos', 'notas_credito'] : ['gastos', 'pagos', 'notas_credito']).map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setSubTab(st)}
                                        className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.2rem] transition-all duration-500 ${subTab === st ? 'bg-[#0f172a] text-white shadow-lg active:scale-95' : 'text-slate-400 hover:text-slate-800'}`}
                                    >
                                        {st.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="p-2">
                            <TablaControlMensualDominio
                                resumen={resumen}
                                dominio={tabPrincipal.toUpperCase()}
                                loading={loading}
                                periodoLabel={`${periodo.mes}/${periodo.anio}`}
                                totalHistorico={metricas?.total_general || 0}
                                empresaId={empresaId}
                                rol={tabPrincipal === 'emitidos' ? 'EMISOR' : 'RECEPTOR'}
                                tipo={subTab === 'ingresos' ? 'I' : subTab === 'nomina' ? 'N' : subTab === 'pagos' ? 'P' : 'E'}
                                onSyncComplete={() => {
                                    if (refresh) refresh();
                                    fetchHistorial();
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {showReporteModal && empresaId && (
                <InformeDefenseModal
                    isOpen={showReporteModal}
                    onClose={() => setShowReporteModal(false)}
                    empresaId={empresaId}
                    mes={`${periodo.anio}-${periodo.mes}`}
                />
            )}
            {/* MODAL HISTORIAL DE CAMBIOS SAT */}
            {showHistorialModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
                        <div className="p-8 bg-[#0f172a] text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter">Historial de Sincronización SAT</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Bitácora de cambios de estatus detectados</p>
                            </div>
                            <button onClick={() => setShowHistorialModal(false)} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all">✕</button>
                        </div>
                        <div className="flex-1 overflow-auto p-8">
                            {historialCambios.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                    <span className="text-5xl mb-4">📂</span>
                                    <p className="font-black text-xs uppercase tracking-widest">No se han detectado cambios de estatus recientemente</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {historialCambios.map((log: any) => {
                                        const detalles = JSON.parse(log.detalles);
                                        return (
                                            <div key={log.id} className="bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all duration-300">
                                                <div className="flex items-center gap-5">
                                                    <div className={`p-4 rounded-2xl ${detalles.nuevo === 'CANCELADO' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                        {detalles.nuevo === 'CANCELADO' ? '🚫' : '✅'}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">
                                                            {new Date(log.fecha).toLocaleString()} • Folio: {detalles.folio || 'S/F'}
                                                        </p>
                                                        <div className="font-black text-slate-900 text-sm tracking-tight truncate max-w-md">
                                                            UUID: {log.entidadId}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-slate-300 uppercase italic">{detalles.previo || 'DESCONOCIDO'}</span>
                                                        <span className="text-slate-300">➔</span>
                                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${detalles.nuevo === 'CANCELADO' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'}`}>
                                                            {detalles.nuevo}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
                            <button onClick={() => setShowHistorialModal(false)} className="btn-primary py-4 px-10">ENTENDIDO</button>
                        </div>
                    </div>
                </div>
            )}
        </MissionControlLayout>
    );
};

export default AuditoriaDetalladaPage;
