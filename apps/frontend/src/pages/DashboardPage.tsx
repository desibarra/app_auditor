import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TablaCfdiRecientes from '../components/TablaCfdiRecientes';
import BotonCargarXml from '../components/BotonCargarXml';
import SelectorEmpresa from '../components/SelectorEmpresa';
import GraficaIngresosEgresos from '../components/GraficaIngresosEgresos';
import SkeletonCard from '../components/SkeletonCard';
import { TablaControlMensualDominio } from '../components/TablaControlMensualDominio';
import { useMetricasDominio } from '../hooks/useMetricasDominio';

interface HistoricoMes {
    mes: string;
    ingresos: number;
    egresos: number;
    fecha: string;
}

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
    topAlertas: Array<{
        id: string | number;
        mensaje: string;
        nivel: 'alta' | 'media' | 'baja';
        fecha: string;
    }>;
    historico?: HistoricoMes[];
}

function DashboardPage() {
    const navigate = useNavigate();
    const [data, setData] = useState<DashboardData | null>(null);
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string | null>(null);

    // 🛡️ TABS SAT-GRADE (Nivel 1 y 2)
    const [tabPrincipal, setTabPrincipal] = useState<'emitidos' | 'recibidos'>('emitidos');
    const [subTab, setSubTab] = useState<string>('ingresos');

    // 🔍 ESTADO DE FILTROS (Single Source of Truth)
    const [filtros, setFiltros] = useState<{
        mes: string | null;
        fechaInicio: string | null;
        fechaFin: string | null;
    }>({
        mes: new Date().toISOString().substring(0, 7), // Default: Mes actual
        fechaInicio: null,
        fechaFin: null
    });

    // Resetear sub-tab al cambiar de contexto principal
    useEffect(() => {
        if (tabPrincipal === 'emitidos') {
            // Default: Ingresos
            if (!['ingresos', 'nomina', 'pagos', 'notas_credito'].includes(subTab)) setSubTab('ingresos');
        } else {
            // Default: Gastos
            if (!['gastos', 'pagos', 'notas_credito'].includes(subTab)) setSubTab('gastos');
        }
    }, [tabPrincipal]);

    // Determinar Endpoint Oficial SAT-Grade
    const getEndpoint = () => {
        if (tabPrincipal === 'emitidos') {
            switch (subTab) {
                case 'ingresos': return '/api/cfdi/emitidos/ingresos';
                case 'nomina': return '/api/cfdi/emitidos/nomina';
                case 'pagos': return '/api/cfdi/emitidos/pagos';
                case 'notas_credito': return '/api/cfdi/emitidos/egresos'; // NC Emitidas (Tipo E)
            }
        } else {
            switch (subTab) {
                case 'gastos': return '/api/cfdi/recibidos/gastos'; // Gastos (Tipo I)
                case 'pagos': return '/api/cfdi/recibidos/pagos';
                case 'notas_credito': return '/api/cfdi/recibidos/egresos'; // NC Recibidas (Tipo E)
            }
        }
        return '';
    };

    // 🎣 HOOK DINÁMICO (Consume la verdad única del dominio seleccionado + filtros)
    const { metricas, resumen, dominio, periodo, loading: loadingDominio, error: errorDominio, refresh } = useMetricasDominio(
        empresaSeleccionada,
        getEndpoint(),
        filtros
    );

    // Carga Global inicial
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const healthRes = await axios.get('/api/dashboard/health');
                setHealth(healthRes.data);

                if (empresaSeleccionada) {
                    const statsRes = await axios.get(`/api/stats/dashboard?empresaId=${empresaSeleccionada}`);
                    setData(statsRes.data);
                } else {
                    setData({
                        totalCfdiMes: { ingresos: 0, egresos: 0 },
                        alertasActivas: { alta: 0, media: 0 },
                        gastoProveedoresRiesgo: 0,
                        expedientesIncompletos: 0,
                        topAlertas: [],
                        historico: [],
                    });
                }
                setError(null);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('No se pudo cargar los datos del dashboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [empresaSeleccionada, refreshKey]);

    const handleFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFiltros(prev => ({
            ...prev,
            mes: null, // Desactivar selección de mes si se usan rangos
            [name]: value || null
        }));
    };

    const handleLimpiarFiltros = () => {
        setFiltros({
            mes: new Date().toISOString().substring(0, 7),
            fechaInicio: null,
            fechaFin: null
        });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-lg">Cargando...</div></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center"><div className="text-red-500 text-lg">{error}</div></div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm z-10 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-3">
                                <img src="/kontify-sentinel-logo.svg" alt="Kontify · Sentinel" style={{ height: '40px', width: 'auto' }} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 font-medium tracking-wide">
                                AUDITORÍA FISCAL INTELIGENTE
                            </p>
                            {health && <p className="text-xs text-emerald-600 mt-0.5 font-bold">● SISTEMA OPERATIVO</p>}
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/expedientes')} className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                📁 Mis Expedientes
                            </button>
                            <SelectorEmpresa
                                empresaSeleccionada={empresaSeleccionada}
                                onSeleccionar={(id) => {
                                    setEmpresaSeleccionada(id);
                                    localStorage.setItem('empresaActiva', id);
                                    setRefreshKey(prev => prev + 1);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* 🏷️ TABS PRINCIPALES SEGMETADOS */}
                <div className="flex justify-center mb-6">
                    <div className="bg-gray-100 p-1 rounded-lg inline-flex shadow-inner">
                        <button
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${tabPrincipal === 'emitidos' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setTabPrincipal('emitidos')}
                        >
                            📤 CFDI Emitidos
                        </button>
                        <button
                            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${tabPrincipal === 'recibidos' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setTabPrincipal('recibidos')}
                        >
                            📥 CFDI Recibidos
                        </button>
                    </div>
                </div>

                {/* 🏷️ SUB-TABS (DOMINIOS) */}
                <div className="mb-6 flex gap-3 border-b border-gray-200 pb-1 overflow-x-auto">
                    {tabPrincipal === 'emitidos' ? (
                        <>
                            {['ingresos', 'nomina', 'pagos', 'notas_credito'].map(t => (
                                <button
                                    key={t}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${subTab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                    onClick={() => setSubTab(t)}
                                >
                                    {t === 'notas_credito' ? 'Notas de Crédito' : t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </>
                    ) : (
                        <>
                            {['gastos', 'pagos', 'notas_credito'].map(t => (
                                <button
                                    key={t}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${subTab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                                    onClick={() => setSubTab(t)}
                                >
                                    {t === 'notas_credito' ? 'Notas de Crédito' : (t === 'gastos' ? 'Gastos' : t.charAt(0).toUpperCase() + t.slice(1))}
                                </button>
                            ))}
                        </>
                    )}
                </div>

                {/* 🔍 BARRA DE FILTROS PROFESIONAL */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-8 flex flex-wrap items-end gap-x-6 gap-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Periodo (Mes)</label>
                        <input
                            type="month"
                            className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-400"
                            value={filtros.mes || ''}
                            onChange={(e) => setFiltros({ mes: e.target.value, fechaInicio: null, fechaFin: null })}
                            disabled={!!filtros.fechaInicio}
                        />
                    </div>

                    <div className="h-8 w-px bg-gray-200 self-center hidden sm:block"></div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Rango Inicia</label>
                        <input
                            type="date"
                            name="fechaInicio"
                            className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={filtros.fechaInicio || ''}
                            onChange={handleFechaChange}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Rango Termina</label>
                        <input
                            type="date"
                            name="fechaFin"
                            className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            value={filtros.fechaFin || ''}
                            onChange={handleFechaChange}
                        />
                    </div>

                    <div className="flex-grow text-right">
                        {(filtros.fechaInicio || filtros.mes !== new Date().toISOString().substring(0, 7)) && (
                            <button
                                onClick={handleLimpiarFiltros}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                                🔄 Restaurar Filtros
                            </button>
                        )}
                    </div>
                </div>

                {/* 📌 ENCABEZADO EXPLICATIVO DE VISTA ACTUAL */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <span className="text-gray-400">Vista:</span>
                            <span className="text-indigo-700 bg-indigo-50 px-2 rounded">
                                {tabPrincipal === 'emitidos' ? 'Emitidos' : 'Recibidos'} &gt; {subTab.charAt(0).toUpperCase() + subTab.slice(1)}
                            </span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 ml-1">
                            Mostrando datos del periodo: <strong className="text-gray-700">{periodo || 'Calculando...'}</strong>
                        </p>
                    </div>
                </div>

                {/* 🚨 ERROR DE CONEXIÓN (ANTI-PÁNICO) */}
                {errorDominio && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r shadow-sm animate-fade-in-down">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-bold text-red-800 uppercase tracking-wide">Error de Comunicación con Servidor</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p className="font-medium">{errorDominio}</p>
                                    <p className="mt-2 text-red-600 bg-red-100 p-2 rounded inline-block">
                                        🛡️ <strong>Nota de Seguridad:</strong> Tus datos están intactos en la base de datos. Este es un problema temporal de visualización.
                                    </p>
                                </div>
                                <div className="mt-4">
                                    <button
                                        onClick={refresh}
                                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                        🔄 Reintentar Conexión
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 📊 KPIs DEL DOMINIO ACTIVO */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {loadingDominio ? (
                        <>
                            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                        </>
                    ) : (
                        <>
                            <div className="card border-l-4 border-l-indigo-500">
                                <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">CFDIs Registrados</h3>
                                <p className="text-2xl font-bold text-gray-900">{metricas?.cfdi_del_mes ?? 0}</p>
                                <p className="text-xs text-gray-400 mt-1">{periodo || 'Periodo actual'}</p>
                            </div>
                            <div className="card border-l-4 border-l-green-500">
                                <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">
                                    {tabPrincipal === 'emitidos' ? (subTab === 'nomina' ? 'Sueldos Pagados' : 'Facturación Total') : 'Gasto Total'}
                                </h3>
                                <p className="text-2xl font-bold text-green-700 font-mono tracking-tight">
                                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(metricas?.importe_total_mes ?? 0)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">Acumulado en periodo</p>
                            </div>
                            <div className="card border-l-4 border-l-blue-500">
                                <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">
                                    {subTab === 'nomina' ? 'Empleados' : 'Receptores Únicos'}
                                </h3>
                                <p className="text-2xl font-bold text-blue-600">{metricas?.clientes_activos ?? 0}</p>
                                <p className="text-xs text-gray-400 mt-1">Entidades distintas</p>
                            </div>
                            <div className="card border-l-4 border-l-gray-400">
                                <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">Ultima Carga</h3>
                                <p className="text-2xl font-bold text-gray-900">{metricas?.cargados_hoy ?? 0}</p>
                                <p className="text-xs text-gray-400 mt-1">XMLs procesados hoy</p>
                            </div>
                        </>
                    )}
                </div>

                {/* ✨ SECCIÓN CENTRAL: TABLA DETALLE + IMPORTADOR */}
                {empresaSeleccionada ? (
                    <div className="mb-8 space-y-6">

                        {/* 📋 TABLA DE CONTROL MENSUAL (Por Dominio) */}
                        <TablaControlMensualDominio
                            resumen={resumen}
                            dominio={dominio || subTab.toUpperCase()}
                            loading={loadingDominio}
                            periodoLabel={periodo || ''}
                            totalHistorico={metricas?.total_general}
                            onLimpiarFiltros={handleLimpiarFiltros}
                        />

                        {/* 📤 IMPORTADOR INTELIGENTE */}
                        <div className="card border border-dashed border-gray-300 bg-gray-50 hover:bg-white transition-colors">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-sm font-bold text-gray-700">Carga de Archivos XML</h2>
                                    <p className="text-xs text-gray-500">El sistema clasificará automáticamente por ROL y TIPO (SAT-Grade)</p>
                                </div>
                            </div>
                            <BotonCargarXml
                                onSuccess={() => {
                                    refresh(); // Refrescar dominio actual
                                    setRefreshKey(prev => prev + 1); // Refrescar lista general
                                }}
                            />
                        </div>

                        {/* Listado Reciente */}
                        <TablaCfdiRecientes empresaId={empresaSeleccionada} key={refreshKey} onRefresh={() => setRefreshKey(prev => prev + 1)} />
                    </div>
                ) : (
                    <div className="mb-8 card text-center py-8 text-gray-500 border-2 border-dashed">
                        Selecciona una empresa para visualizar información detallada.
                    </div>
                )}

                {/* 🚨 ALERTAS Y GRÁFICAS (Contexto Global) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 card">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alertas Prioritarias</h2>
                        <div className="space-y-3">
                            {(data?.topAlertas ?? []).map((alerta) => (
                                <div key={alerta.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className={`w-2 h-2 rounded-full mt-2 ${alerta.nivel === 'alta' ? 'bg-red-500' : alerta.nivel === 'media' ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{alerta.mensaje}</p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(alerta.fecha).toLocaleDateString('es-MX')}</p>
                                    </div>
                                </div>
                            ))}
                            {(!data?.topAlertas?.length) && <p className="text-sm text-gray-500 italic">Sin alertas pendientes.</p>}
                        </div>
                    </div>

                    <div className="lg:col-span-2 card">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingresos vs Egresos (Global)</h2>
                        <GraficaIngresosEgresos data={data?.historico || []} />
                    </div>
                </div>

            </main>

            {/* ESTILOS CSS */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .tabs-container { border-bottom: 2px solid #e5e7eb; }
                .tabs { display: flex; gap: 2rem; }
                .tab {
                    padding: 12px 4px;
                    background: none;
                    border: none;
                    border-bottom: 3px solid transparent;
                    color: #6b7280;
                    font-weight: 500;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .tab:hover { color: #1a7f3e; }
                .tab.activa {
                    color: #1a7f3e;
                    border-bottom-color: #1a7f3e;
                    font-weight: 700;
                }
                
                .subtab {
                    padding: 6px 16px;
                    background: #f3f4f6;
                    border: 1px solid #e5e7eb;
                    border-radius: 9999px;
                    font-size: 0.875rem;
                    color: #4b5563;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .subtab:hover { background: #e5e7eb; }
                .subtab.activo {
                    background: #dcfce7;
                    color: #166534;
                    border-color: #86efac;
                    font-weight: 600;
                }
            `}} />
        </div>
    );
}

export default DashboardPage;
