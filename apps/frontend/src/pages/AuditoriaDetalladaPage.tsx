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
                regimenFiscal={empresaData?.regimen_fiscal || '---'}
            />

            <div className="space-y-6 mt-6">
                {/* CONFIGURACIÓN DE VISTA */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="fiscal-card p-6 lg:col-span-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Bóveda Fiscal: Empresa Activa</label>
                        <SelectorEmpresa empresaSeleccionada={empresaId} onSeleccionar={handleSeleccionarEmpresa} />
                    </div>
                    <div className="fiscal-card p-6" onClick={tryShowPicker}>
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Ejercicio y Mes de Auditoría</label>
                        <div className="flex items-center gap-3 bg-[#0B0E14] px-4 py-2.5 rounded-lg border border-gray-700 hover:border-indigo-500 transition-colors cursor-pointer">
                            <span className="text-xl">📅</span>
                            <input
                                ref={dateInputRef}
                                type="month"
                                value={`${periodo.anio}-${periodo.mes}`}
                                onChange={(e) => {
                                    const [y, m] = e.target.value.split('-');
                                    if (y && m) setPeriodo({ anio: y, mes: m });
                                }}
                                className="bg-transparent border-none text-white font-mono text-sm focus:ring-0 w-full"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </div>
                </div>

                {/* NAVEGACIÓN DE DOMINIOS */}
                <div className="flex flex-wrap gap-2 p-1.5 bg-[#0B0E14] rounded-xl border border-gray-800">
                    <button onClick={() => setTabPrincipal('emitidos')} className={`flex-1 py-3 px-6 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tabPrincipal === 'emitidos' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-500 hover:text-gray-300'}`}>📤 Emitidos (Ventas)</button>
                    <button onClick={() => setTabPrincipal('recibidos')} className={`flex-1 py-3 px-6 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tabPrincipal === 'recibidos' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-gray-500 hover:text-gray-300'}`}>📥 Recibidos (Gastos)</button>
                    <button onClick={() => setTabPrincipal('pagos')} className={`flex-1 py-3 px-6 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tabPrincipal === 'pagos' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-500 hover:text-gray-300'}`}>💰 Pagos y Reps</button>
                </div>

                {/* ACCIONES CRÍTICAS */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                    <button
                        onClick={() => setShowReporteModal(true)}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl border border-gray-700 text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                        <span>🛡️</span> Informe de Defensa Fiscal
                    </button>

                    <ImportarXML
                        empresaId={empresaId}
                        empresaNombre={empresaData?.razonSocial}
                        periodo={`${periodo.anio}-${periodo.mes}`}
                        onImportComplete={refresh}
                    />
                </div>

                {/* TABLA PRINCIPAL REACTIVA */}
                {tabPrincipal === 'pagos' ? (
                    empresaId && <ComplementosPagoTable empresaId={empresaId} periodo={`${periodo.anio}-${periodo.mes}`} />
                ) : (
                    <div className="fiscal-card">
                        <div className="px-6 py-4 border-b border-gray-800 bg-[#1A1F29]/50 flex flex-col md:flex-row justify-between items-center gap-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Desglose Mensual Analítico</h3>
                            <div className="flex gap-1.5 p-1 bg-[#0B0E14] rounded-lg border border-gray-800">
                                {(tabPrincipal === 'emitidos' ? ['ingresos', 'nomina', 'pagos', 'notas_credito'] : ['gastos', 'pagos', 'notas_credito']).map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setSubTab(st)}
                                        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-tighter rounded-md transition-all ${subTab === st ? 'bg-indigo-500 text-white' : 'text-gray-600 hover:text-gray-400'}`}
                                    >
                                        {st.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <TablaControlMensualDominio
                            resumen={resumen}
                            dominio={tabPrincipal.toUpperCase()}
                            loading={loading}
                            periodoLabel={`${periodo.mes}/${periodo.anio}`}
                            totalHistorico={metricas?.total_general || 0}
                            empresaId={empresaId}
                            rol={tabPrincipal === 'emitidos' ? 'EMISOR' : 'RECEPTOR'}
                            tipo={subTab === 'ingresos' ? 'I' : subTab === 'nomina' ? 'N' : subTab === 'pagos' ? 'P' : 'E'}
                        />
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
        </MissionControlLayout>
    );
};

export default AuditoriaDetalladaPage;
