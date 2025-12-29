import React, { useState, useRef } from 'react';
import { useMetricasDominio } from '../hooks/useMetricasDominio';
import { TablaControlMensualDominio } from '../components/TablaControlMensualDominio';
import MissionControlLayout from '../components/MissionControlLayout';
import ContextBar from '../components/ContextBar';
import SelectorEmpresa from '../components/SelectorEmpresa';
import ImportarXML from '../components/ImportarXML';
import axios from 'axios';
import InformeDefenseModal from '../components/fiscal/InformeDefenseModal';
import ComplementosPagoTable from '../components/fiscal/ComplementosPagoTable';

function AuditoriaDetalladaPage() {
    // Estado de empresa
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string | null>(() => {
        return localStorage.getItem('empresaSeleccionada');
    });
    const [empresaData, setEmpresaData] = useState<{
        razonSocial: string;
        rfc: string;
        sector?: string;
        regimenFiscal?: string;
    } | null>(null);

    // TABS (Nivel 1 y 2)
    const [tabPrincipal, setTabPrincipal] = useState<'emitidos' | 'recibidos' | 'pagos'>('emitidos');
    const [subTab, setSubTab] = useState<string>('ingresos');

    // FILTROS
    const [filtros, setFiltros] = useState<{
        mes: string | null;
        fechaInicio: string | null;
        fechaFin: string | null;
    }>({
        mes: new Date().toISOString().substring(0, 7),
        fechaInicio: null,
        fechaFin: null
    });

    // Estado Modal Informe SAT
    const [showReporteModal, setShowReporteModal] = useState(false);

    // Ref para el input de fecha (Corrección UX)
    const dateInputRef = useRef<HTMLInputElement>(null);

    // Helper para abrir el picker nativo de forma segura
    const tryShowPicker = () => {
        try {
            if (dateInputRef.current && 'showPicker' in dateInputRef.current) {
                // @ts-ignore
                dateInputRef.current.showPicker();
            } else {
                (dateInputRef.current as unknown as HTMLElement)?.click();
            }
        } catch (error) {
            console.warn('Error opening date picker:', error);
        }
    };

    // Fetch Empresa Data
    React.useEffect(() => {
        const fetchEmpresaData = async () => {
            if (!empresaSeleccionada) {
                setEmpresaData(null);
                return;
            }
            try {
                const res = await axios.get(`/api/cfdi/empresas`);
                const empresa = res.data.find((e: any) => e.id === empresaSeleccionada);
                if (empresa) {
                    let sector = empresa.sector;
                    let regimenFiscal = empresa.regimenFiscal;

                    if (empresa.configuracion) {
                        try {
                            const config = typeof empresa.configuracion === 'string'
                                ? JSON.parse(empresa.configuracion)
                                : empresa.configuracion;

                            const extractCode = (value: string | undefined): string | undefined => {
                                if (!value) return undefined;
                                if (/^\d+$/.test(value)) return value;
                                const match = value.match(/^(\d+)\s*-/);
                                return match ? match[1] : value;
                            };

                            const sectorRaw = config.sector ||
                                config.giro ||
                                config.giro_principal ||
                                config.sectorPrincipal ||
                                config['sector_giro_principal'] ||
                                sector;

                            const regimenRaw = config.regimenFiscal ||
                                config.regimen ||
                                config.regimen_fiscal ||
                                config['regimen-fiscal'] ||
                                regimenFiscal;

                            sector = extractCode(sectorRaw) || sector;
                            regimenFiscal = extractCode(regimenRaw) || regimenFiscal;
                        } catch (parseError) {
                            console.warn("Error parsing empresa configuracion:", parseError);
                        }
                    }

                    setEmpresaData({
                        razonSocial: empresa.razonSocial,
                        rfc: empresa.rfc,
                        sector,
                        regimenFiscal
                    });
                }
            } catch (err) {
                console.error("Error loading empresa data", err);
            }
        };
        fetchEmpresaData();
    }, [empresaSeleccionada]);

    // Hook Metricas Dominio
    const getEndpoint = () => {
        const base = tabPrincipal === 'emitidos' ? '/api/cfdi/emitidos' : '/api/cfdi/recibidos';
        if (tabPrincipal === 'emitidos') {
            if (subTab === 'ingresos') return `${base}/ingresos`;
            if (subTab === 'nomina') return `${base}/nomina`;
            if (subTab === 'pagos') return `${base}/pagos`;
            if (subTab === 'notas_credito') return `${base}/egresos`;
            return `${base}/ingresos`;
        } else {
            // Mapping for Recibidos
            if (subTab === 'gastos' || subTab === 'ingresos') return `${base}/gastos`;
            if (subTab === 'pagos') return `${base}/pagos`;
            if (subTab === 'notas_credito') return `${base}/egresos`;
            return `${base}/gastos`;
        }
    };

    const { metricas, resumen: resumenHistorico, loading: loadingTabla, dominio: dominioReal, rol: rolReal, tipo: tipoReal } = useMetricasDominio(
        empresaSeleccionada,
        getEndpoint(),
        filtros
    );

    const metricasSafe: any = metricas || {};
    const periodo = filtros.mes || (filtros.fechaInicio && filtros.fechaFin ? `${filtros.fechaInicio} a ${filtros.fechaFin}` : null);

    // Sentinel Engine Sync (Fuente de Verdad Única para Header)
    const [summary, setSummary] = useState<any>(null);

    React.useEffect(() => {
        const fetchSentinelStatus = async () => {
            if (!empresaSeleccionada || !filtros.mes) {
                setSummary(null);
                return;
            }
            try {
                // Mapear el flujo al formato Sentinel (EMITIDOS | RECIBIDOS | PAGOS)
                let flujoSentinel: 'EMITIDOS' | 'RECIBIDOS' | 'PAGOS' = 'RECIBIDOS';
                if (tabPrincipal === 'pagos') flujoSentinel = 'PAGOS';
                else if (tabPrincipal === 'emitidos') flujoSentinel = 'EMITIDOS';

                const res = await axios.get('/api/stats/sentinel-summary', {
                    params: {
                        empresaId: empresaSeleccionada,
                        periodo: filtros.mes,
                        flujo: flujoSentinel
                    }
                });
                setSummary(res.data);
            } catch (err) {
                console.error("Error syncing Sentinel Status:", err);
            }
        };
        fetchSentinelStatus();
    }, [empresaSeleccionada, filtros.mes, tabPrincipal]);

    // Función para refrescar datos después de importar XML
    const handleRefreshData = () => {
        // El hook useMetricasDominio se actualizará automáticamente
        // porque depende de empresaSeleccionada y filtros
        // Forzar re-render actualizando filtros
        setFiltros({ ...filtros });
    };

    return (
        <MissionControlLayout title="AUDITORÍA DETALLADA">
            {/* BARRA DE CONTEXTO */}
            <ContextBar
                empresaNombre={empresaData?.razonSocial || "SELECCIONE EMPRESA"}
                empresaRfc={empresaData?.rfc || '---'}
                periodoLabel={filtros.mes || 'HISTÓRICO GLOBAL'}
                modo={summary?.vistaActiva || tabPrincipal.toUpperCase()}
                subModo={subTab}
                perfilRiesgo={summary?.perfilRiesgo}
                sector={empresaData?.sector}
                regimenFiscal={empresaData?.regimenFiscal}
            />

            <div className="space-y-6 mt-6">
                {/* SELECTOR DE EMPRESA Y PERIODO */}
                <div className="fiscal-card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Selector Empresa */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Empresa Auditada
                            </label>
                            <SelectorEmpresa
                                empresaSeleccionada={empresaSeleccionada}
                                onSeleccionar={(id) => {
                                    setEmpresaSeleccionada(id);
                                    localStorage.setItem('empresaSeleccionada', id);
                                }}
                            />
                        </div>

                        {/* Selector Periodo */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                                Periodo Fiscal
                            </label>
                            <div
                                className="relative group cursor-pointer"
                                onClick={tryShowPicker}
                            >
                                <input
                                    ref={dateInputRef}
                                    type="month"
                                    value={filtros.mes || ''}
                                    onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })}
                                    onClick={tryShowPicker}
                                    className="w-full bg-[#0B0E14] border border-gray-700 text-white rounded-md px-4 py-2.5 pl-10 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors cursor-pointer appearance-none font-mono text-sm hover:border-gray-600"
                                    style={{ colorScheme: 'dark' }}
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-hover:text-indigo-400 transition-colors">
                                    <svg className="h-4 w-4 text-gray-500 group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TABS PRINCIPALES */}
                <div className="flex gap-4 p-1 bg-[#0B0E14] rounded-xl border border-gray-800">
                    <button
                        onClick={() => setTabPrincipal('emitidos')}
                        className={`flex-1 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all relative overflow-hidden ${tabPrincipal === 'emitidos'
                            ? 'bg-blue-600/10 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800 border border-transparent'
                            }`}
                    >
                        {tabPrincipal === 'emitidos' && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 shadow-[0_0_8px_#3b82f6]"></span>}
                        📤 Emitidos
                    </button>
                    <button
                        onClick={() => setTabPrincipal('recibidos')}
                        className={`flex-1 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all relative overflow-hidden ${tabPrincipal === 'recibidos'
                            ? 'bg-purple-600/10 text-purple-400 border border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.2)]'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800 border border-transparent'
                            }`}
                    >
                        {tabPrincipal === 'recibidos' && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-purple-500 shadow-[0_0_8px_#a855f7]"></span>}
                        📥 Recibidos
                    </button>
                    <button
                        onClick={() => setTabPrincipal('pagos')}
                        className={`flex-1 px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all relative overflow-hidden ${tabPrincipal === 'pagos'
                            ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800 border border-transparent'
                            }`}
                    >
                        {tabPrincipal === 'pagos' && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>}
                        💰 Pagos / Complementos
                    </button>
                </div>

                {/* BARRA COMPACTA DE CONTEXTO (1 línea) */}
                <div className="bg-[#0B0E14] border border-gray-800 rounded-lg px-6 py-3 shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-6 text-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-bold uppercase tracking-wider">Empresa:</span>
                            <span className="text-gray-300 font-mono truncate max-w-[200px]" title={empresaData?.razonSocial}>
                                {empresaData?.razonSocial || 'NO SELECCIONADA'}
                            </span>
                        </div>
                        <div className="h-4 w-px bg-gray-800"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-bold uppercase tracking-wider">Periodo:</span>
                            <span className="text-gray-300 font-mono">
                                {filtros.mes
                                    ? new Date(filtros.mes + '-01T12:00:00').toLocaleDateString('es-MX', { month: 'short', year: 'numeric' }).toUpperCase().replace('.', '')
                                    : 'NO SELECCIONADO'}
                            </span>
                        </div>
                        <div className="h-4 w-px bg-gray-800"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-bold uppercase tracking-wider">Modo:</span>
                            <span className={`font-bold ${tabPrincipal === 'emitidos' ? 'text-blue-400' : 'text-purple-400'}`}>
                                {tabPrincipal.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-900 px-3 py-1 rounded border border-gray-800">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">Total XML</span>
                        <span className="text-emerald-400 font-bold font-mono text-sm">
                            {loadingTabla ? '...' : metricasSafe.cfdi_del_mes || 0}
                        </span>
                    </div>
                </div>

                {/* ACCIONES: IMPORTAR + GENERAR INFORME */}
                <div className="flex justify-between items-end">
                    <button
                        onClick={() => setShowReporteModal(true)}
                        disabled={!empresaSeleccionada || !filtros.mes}
                        className="px-5 py-2.5 bg-gradient-to-r from-indigo-900 to-indigo-800 hover:from-indigo-800 hover:to-indigo-700 text-indigo-100 font-bold uppercase tracking-wider text-xs rounded-lg shadow-lg border border-indigo-700/50 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/20"
                    >
                        <span>📄</span> Generar Informe SAT – Devolución de IVA
                    </button>

                    <ImportarXML
                        empresaId={empresaSeleccionada}
                        empresaNombre={empresaData?.razonSocial}
                        periodo={filtros.mes || undefined}
                        onImportComplete={handleRefreshData}
                    />
                </div>

                {/* TABLA DE AUDITORÍA - SIEMPRE VISIBLE */}
                {tabPrincipal === 'pagos' ? (
                    empresaSeleccionada && filtros.mes && (
                        <ComplementosPagoTable
                            empresaId={empresaSeleccionada}
                            periodo={filtros.mes}
                        />
                    )
                ) : (
                    <div className="fiscal-card overflow-hidden">
                        <div className="bg-[#0B0E14]/50 px-6 py-4 border-b border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]"></span>
                                Auditoría Mensual SAT-Grade
                            </h3>
                            {/* Selector de Subtabs */}
                            <div className="flex flex-wrap gap-2 p-1 bg-[#0B0E14] rounded-lg border border-gray-800">
                                {(tabPrincipal === 'emitidos' ? ['ingresos', 'nomina', 'pagos', 'notas_credito'] : ['gastos', 'pagos', 'notas_credito']).map(st => (
                                    <button
                                        key={st}
                                        onClick={() => setSubTab(st)}
                                        className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md border transition-all ${subTab === st
                                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/50 shadow-sm'
                                            : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800'
                                            }`}
                                    >
                                        {st.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <TablaControlMensualDominio
                            resumen={resumenHistorico}
                            dominio={dominioReal || subTab.toUpperCase()}
                            loading={loadingTabla}
                            periodoLabel={periodo || ''}
                            totalHistorico={metricasSafe.total_general}
                            onLimpiarFiltros={() => setFiltros({ mes: new Date().toISOString().substring(0, 7), fechaInicio: null, fechaFin: null })}
                            empresaId={empresaSeleccionada}
                            rol={rolReal || (tabPrincipal === 'emitidos' ? 'EMISOR' : 'RECEPTOR')}
                            tipo={tipoReal || (subTab === 'ingresos' ? 'I' : subTab === 'nomina' ? 'N' : subTab === 'pagos' ? 'P' : 'E')}
                        />
                    </div>
                )}
            </div>
            {/* MODAL INFORME SAT */}
            {showReporteModal && empresaSeleccionada && filtros.mes && (
                <InformeDefenseModal
                    key={`${empresaSeleccionada}-${filtros.mes}`}
                    empresaId={empresaSeleccionada}
                    mes={filtros.mes}
                    isOpen={showReporteModal}
                    onClose={() => setShowReporteModal(false)}
                />
            )}
        </MissionControlLayout>
    );
}

export default AuditoriaDetalladaPage;
