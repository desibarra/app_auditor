import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SelectorEmpresa from '../components/SelectorEmpresa';
import { TablaControlMensualDominio } from '../components/TablaControlMensualDominio';
import { useMetricasDominio } from '../hooks/useMetricasDominio';
import MissionControlLayout from '../components/MissionControlLayout';
import FiscalCharts from '../components/FiscalCharts';
import ContextBar from '../components/ContextBar';

interface HistoricoMes {
    mes: string;
    ingresos: number;
    egresos: number;
    fecha: string;
}

interface DashboardData {
    alertasActivas: {
        alta: number;
        media: number;
    };
    historico?: HistoricoMes[]; // Histórico 12 meses
}

function DashboardPage() {
    // Estado Global Dashboard
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string | null>(null);
    // const [loadingGlobal, setLoadingGlobal] = useState(false); // Eliminado si no se usa visualmente aún

    // TABS (Nivel 1 y 2)
    const [tabPrincipal, setTabPrincipal] = useState<'emitidos' | 'recibidos'>('emitidos');
    const [subTab, setSubTab] = useState<string>('ingresos');

    // FILTROS (Single Source of Truth)
    const [filtros, setFiltros] = useState<{
        mes: string | null;
        fechaInicio: string | null;
        fechaFin: string | null;
    }>({
        mes: new Date().toISOString().substring(0, 7),
        fechaInicio: null,
        fechaFin: null
    });

    // 1. Fetch Global Data (Histórico 12 meses, Alertas Generales)
    useEffect(() => {
        // RESET INTELIGENTE DE ESTADO: Previene mostrar datos de la empresa anterior
        setDashboardData(null);

        const fetchGlobal = async () => {
            if (!empresaSeleccionada) return;
            // setLoadingGlobal(true);
            try {
                const res = await axios.get(`/api/stats/dashboard?empresaId=${empresaSeleccionada}`);
                setDashboardData(res.data);
            } catch (err) {
                console.error("Error loading global stats", err);
            } finally {
                // setLoadingGlobal(false);
            }
        };
        fetchGlobal();
    }, [empresaSeleccionada]);

    // 2. Hook Metricas Dominio (Datos del Mes Actual/Filtro)
    const getEndpoint = () => {
        const base = tabPrincipal === 'emitidos' ? '/api/cfdi/emitidos' : '/api/cfdi/recibidos';
        // Mapeo de subtabs a endpoints
        if (tabPrincipal === 'emitidos') {
            if (subTab === 'ingresos') return `${base}/ingresos`;
            if (subTab === 'nomina') return `${base}/nomina`;
            if (subTab === 'pagos') return `${base}/pagos`;
            if (subTab === 'notas_credito') return `${base}/egresos`;
        } else {
            if (subTab === 'gastos') return `${base}/gastos`;
            if (subTab === 'pagos') return `${base}/pagos`;
            if (subTab === 'notas_credito') return `${base}/egresos`;
        }
        return `${base}/ingresos`; // Default
    };

    const endpoint = getEndpoint();

    // 1. Hook para KPIs (RESPETA FILTROS)
    const { metricas, dominio, rol, tipo, periodo, loading: loadingMetrics } = useMetricasDominio(
        empresaSeleccionada,
        endpoint,
        filtros
    );

    // 2. Hook para Tabla Mensual (IGNORA FILTROS - HISTÓRICO COMPLETO)
    // Pasamos un objeto vacío como filtro para forzar la carga de todos los meses disponibles
    const { resumen: resumenHistorico, loading: loadingTabla } = useMetricasDominio(
        empresaSeleccionada,
        endpoint,
        {}
    );

    // Handlers
    const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFiltros(prev => ({ ...prev, mes: null, [name]: value || null }));
    };

    // Cálculos Inteligentes para KPIs (Safe Logic)
    // Usamos 'any' temporalmente para metricas si TS se queja, pero idealmente extendemos la interfaz.
    const metricasSafe: any = metricas || {};
    // FIX: Usar nombres de propiedades correctos según useMetricasDominio.ts
    const isPeriodoEmpty = !metricas || metricasSafe.cfdi_del_mes === 0;
    const montoDisplay = metricasSafe.importe_total_mes || 0;
    const historicoDisplay = metricasSafe.total_general || 0;

    // Calcular variación vs mes anterior del DashboardData si existe
    /*
    const variacion = dashboardData?.historico && dashboardData.historico.length > 1 
        ? ((montoDisplay - dashboardData.historico[1].ingresos) / dashboardData.historico[1].ingresos) * 100 
        : 0;
    */

    return (
        <MissionControlLayout title="CENTRO DE MANDO FISCAL">

            {/* 1. BARRA DE CONTEXTO (HUD) - SIEMPRE VISIBLE */}
            <ContextBar
                empresaNombre={dashboardData?.alertasActivas ? "EMPRESA VINCULADA" : "SELECCIONE EMPRESA"} // Idealmente traer nombre real
                empresaRfc={empresaSeleccionada || '---'}
                periodoLabel={filtros.mes || 'HISTÓRICO GLOBAL'}
                modo={tabPrincipal}
                subModo={subTab}
            />

            <div className="space-y-6 mt-6">

                {/* BLOQUE DE CONTROL SUPERIOR (Selectores + Estado) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* A. BLOQUE ESTADO (3 cols) */}
                    <div className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-lg p-4 shadow-lg flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <div className={`w-2 h-2 rounded-full ${dashboardData?.alertasActivas?.alta ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-2">IDENTIDAD & ESTADO</span>
                            <div className="mb-4">
                                <SelectorEmpresa
                                    empresaSeleccionada={empresaSeleccionada}
                                    onSeleccionar={(id) => setEmpresaSeleccionada(id)}
                                />
                            </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-800">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-bold">ESTADO SAT</span>
                                <span className={`text-sm font-bold tracking-wide ${dashboardData?.alertasActivas?.alta ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {dashboardData?.alertasActivas?.alta ? '⚠️ ALERTA FISCAL' : '✓ EN REGLA'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* B. BLOQUE MAGNITUD (6 cols) - KPIs Centrales */}
                    <div className="lg:col-span-6 grid grid-cols-2 gap-4">
                        {/* KPI: Total Monetario */}
                        <div className="bg-gray-900 border-l-4 border-indigo-500 rounded-r-lg p-5 shadow-lg relative flex flex-col justify-center">
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block mb-1">
                                TOTAL {tabPrincipal.toUpperCase()}
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl text-white font-mono font-bold tracking-tight">
                                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(montoDisplay)}
                                </span>
                            </div>
                            {/* Contexto Histórico "Anti-Pánico" */}
                            {isPeriodoEmpty && historicoDisplay > 0 && (
                                <div className="mt-2 bg-gray-800/50 rounded px-2 py-1 inline-flex items-center gap-2 max-w-fit">
                                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <span className="text-[10px] text-gray-400">
                                        Histórico Global: <span className="text-white font-mono">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(historicoDisplay)}</span>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* KPI: Volumen Operativo */}
                        <div className="bg-gray-900 border-l-4 border-blue-500 rounded-r-lg p-5 shadow-lg flex flex-col justify-center">
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest block mb-1">
                                VOLUMEN OPERATIVO
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl text-white font-mono font-bold tracking-tight">
                                    {metricasSafe.cfdi_del_mes || 0}
                                </span>
                                <span className="text-xs text-blue-400 font-bold">CFDI</span>
                            </div>
                            <div className="mt-2 text-[10px] text-gray-500">
                                Transacciones procesadas en este periodo
                            </div>
                        </div>
                    </div>

                    {/* C. BLOQUE PERIODO (3 cols) - Control y Filtros */}
                    <div className="lg:col-span-3 bg-gray-800/40 border border-gray-700 rounded-lg p-4 flex flex-col justify-center gap-3">
                        <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1 block">PERIODO ACTIVO</span>
                            <div className="relative group cursor-pointer" onClick={() => document.querySelector<HTMLInputElement>('input[name="mes"]')?.showPicker()}>
                                <input
                                    type="month"
                                    name="mes"
                                    value={filtros.mes || ''}
                                    onChange={handleFechaChange}
                                    className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded px-3 py-2 pl-9 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors cursor-pointer"
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-hover:text-emerald-400 transition-colors">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                            </div>
                        </div>
                        <div className="flex rounded-md shadow-sm mt-1" role="group">
                            <button
                                onClick={() => setTabPrincipal('emitidos')}
                                className={`flex-1 px-4 py-2 text-xs font-bold uppercase rounded-l-lg border transition-all ${tabPrincipal === 'emitidos' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700 hover:text-white'}`}
                            >Emitidos</button>
                            <button
                                onClick={() => setTabPrincipal('recibidos')}
                                className={`flex-1 px-4 py-2 text-xs font-bold uppercase rounded-r-lg border-t border-b border-r transition-all ${tabPrincipal === 'recibidos' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-800 text-gray-400 border-gray-600 hover:bg-gray-700 hover:text-white'}`}
                            >Recibidos</button>
                        </div>
                    </div>
                </div>

                {/* NIVEL 2: GRÁFICAS (Mission Control Visuals) */}
                <FiscalCharts
                    historico={dashboardData?.historico}
                    topConcentracion={metricasSafe.top_clientes?.map((c: any) => ({ id: c.rfc, total: c.total, nombre: c.razon_social }))}
                    tipo={tabPrincipal === 'emitidos' ? 'ingresos' : 'gastos'}
                />

                {/* NIVEL 3: OPERACIÓN (Tabla) */}
                <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200 mb-8">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <h3 className="text-gray-800 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                            Auditoría Detallada
                        </h3>
                        {/* Selector de Subtabs tipo 'Pill' */}
                        <div className="flex flex-wrap gap-2">
                            {(tabPrincipal === 'emitidos' ? ['ingresos', 'nomina', 'pagos', 'notas_credito'] : ['gastos', 'pagos', 'notas_credito']).map(st => (
                                <button
                                    key={st}
                                    onClick={() => setSubTab(st)}
                                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md border transition-all ${subTab === st ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
                                >
                                    {st.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <TablaControlMensualDominio
                        resumen={resumenHistorico}
                        dominio={dominio || subTab.toUpperCase()}
                        loading={loadingTabla}
                        periodoLabel={periodo || ''}
                        totalHistorico={metricasSafe.total_general}
                        onLimpiarFiltros={() => setFiltros({ mes: new Date().toISOString().substring(0, 7), fechaInicio: null, fechaFin: null })}
                        empresaId={empresaSeleccionada}
                        rol={rol}
                        tipo={tipo}
                    />
                </div>
            </div>
        </MissionControlLayout>
    );
}

export default DashboardPage;
