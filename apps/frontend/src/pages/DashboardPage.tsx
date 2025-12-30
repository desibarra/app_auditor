import { useEffect, useState } from 'react';
import axios from 'axios';
import MissionControlLayout from '../components/MissionControlLayout'; // Usar el layout actualizado con Context
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
    topAlertas: Array<{
        id: string | number;
        mensaje: string;
        nivel: 'alta' | 'media' | 'baja';
        fecha: string;
        tipo?: string;
    }>;
}

// Formateador de moneda MXN compacto
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// Formateador de fecha técnico
const formatDate = (dateString: string) => {
    if (!dateString) return '--/--/----';
    return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

function DashboardPage() {
    const { empresa, loading: loadingContext } = useEmpresa();

    // Estado local para los datos del dashboard real
    const [data, setData] = useState<DashboardData | null>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado del filtro de periodo (local del dashboard por ahora)
    const [periodo, setPeriodo] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => {
        if (!empresa) return;

        const fetchData = async () => {
            setLoadingData(true);
            setError(null);
            try {
                // CONSUMO DE DATOS REALES DEL SENTINEL ENGINE
                // Se solicita flujo 'RECIBIDOS' como default para vista general
                const res = await axios.get('/api/stats/sentinel-summary', {
                    params: {
                        empresaId: empresa.id,
                        periodo: periodo,
                        flujo: 'RECIBIDOS'
                    }
                });

                const apiData = res.data;

                // ADAPTADOR: Transformar respuesta real a la estructura visual del Dashboard
                const kpis = apiData.kpis || {};
                const alertas = apiData.alertas || [];

                const adaptedData: DashboardData = {
                    totalCfdiMes: {
                        ingresos: Number(kpis.ingresos || 0),
                        egresos: Number(kpis.egresos || 0)
                    },
                    alertasActivas: {
                        alta: alertas.filter((a: any) => a.tipo === 'ROJA' || a.tipo === 'ALTA').length,
                        media: alertas.filter((a: any) => a.tipo === 'AMARILLA' || a.tipo === 'MEDIA').length
                    },
                    // Simulación de cálculo de riesgo basado en alertas (ej. 5% base + 2% por alerta)
                    gastoProveedoresRiesgo: alertas.length > 0 ? (5 + alertas.length * 2) : 0,
                    expedientesIncompletos: 0, // Dato placeholder pendiente de endpoint real o cálculo
                    topAlertas: alertas.map((a: any, index: number) => ({
                        id: index + 1,
                        mensaje: a.titulo || a.desc,
                        nivel: (a.tipo === 'ROJA' ? 'alta' : 'media') as 'alta' | 'media',
                        fecha: new Date().toISOString(), // Las alertas del summary a veces no traen fecha individual
                        tipo: a.tipo
                    }))
                };

                setData(adaptedData);

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                // No mostrar error crítico bloqueante, sino un estado vacío controlado
                // setError('No se pudieron cargar los datos fiscales.');
                // Fallback a datos en cero
                setData({
                    totalCfdiMes: { ingresos: 0, egresos: 0 },
                    alertasActivas: { alta: 0, media: 0 },
                    gastoProveedoresRiesgo: 0,
                    expedientesIncompletos: 0,
                    topAlertas: []
                });
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [empresa, periodo]);

    // Helpers
    const changePeriodo = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPeriodo(e.target.value);
    };

    // Render Logic
    if (loadingContext || (!data && loadingData)) {
        return (
            <MissionControlLayout title="DASHBOARD">
                <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center font-mono text-xs text-zinc-400">
                    <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin mb-4"></div>
                    CONECTANDO CON SAT-LINK...
                </div>
            </MissionControlLayout>
        );
    }

    if (!empresa) {
        return (
            <MissionControlLayout title="DASHBOARD">
                <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center font-mono text-zinc-500">
                    <div className="mb-4 p-4 bg-zinc-100 rounded-full border border-zinc-200">
                        <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    </div>
                    NO HAY EMPRESA SELECCIONADA
                    <span className="text-[10px] mt-2 text-zinc-400">Seleccione una empresa en el menú superior para comenzar el análisis.</span>
                </div>
            </MissionControlLayout>
        );
    }

    return (
        <MissionControlLayout title="DASHBOARD">
            {/* Toolbar de Filtros */}
            <div className="flex items-center justify-between mb-6 bg-white p-2 border border-zinc-200 rounded-sm">
                <div className="flex gap-2 items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2">Periodo Fiscal:</span>
                    <select
                        value={periodo}
                        onChange={changePeriodo}
                        className="bg-zinc-50 border border-zinc-300 text-xs px-3 py-1.5 rounded-sm focus:border-zinc-500 focus:outline-none font-mono"
                    >
                        <option value="2024-11">NOVIEMBRE 2024</option>
                        <option value="2024-12">DICIEMBRE 2024</option>
                        <option value="2025-01">ENERO 2025</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    {loadingData && <span className="text-[10px] text-zinc-400 animate-pulse">Actualizando...</span>}
                    <button className="text-xs font-medium bg-zinc-800 text-white px-4 py-1.5 rounded-sm hover:bg-zinc-700 transition-colors">
                        Sincronizar SAT
                    </button>
                </div>
            </div>

            {data ? (
                <>
                    {/* KPIs de Alta Densidad */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {/* Card 1 */}
                        <div className="bg-white border border-zinc-200 p-4 rounded-sm hover:border-zinc-300 transition-colors">
                            <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Ingreso Facturado</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-zinc-900 tracking-tight">
                                    {formatCurrency(data.totalCfdiMes.ingresos)}
                                </span>
                            </div>
                            <div className="mt-3 text-[10px] text-zinc-400 border-t border-zinc-100 pt-2 flex justify-between">
                                <span>Periodo Actual</span>
                                <span className="font-medium text-emerald-600">INGRESOS</span>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-white border border-zinc-200 p-4 rounded-sm hover:border-zinc-300 transition-colors">
                            <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Egresos Totales</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-zinc-900 tracking-tight">
                                    {formatCurrency(data.totalCfdiMes.egresos)}
                                </span>
                            </div>
                            <div className="mt-3 text-[10px] text-zinc-400 border-t border-zinc-100 pt-2 flex justify-between">
                                <span>Periodo Actual</span>
                                <span className="font-medium text-zinc-600">DEDUCIBILIDAD</span>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-white border border-zinc-200 p-4 rounded-sm hover:border-zinc-300 transition-colors">
                            <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Hallazgos Activos</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-zinc-900 tracking-tight">
                                    {data.alertasActivas.alta + data.alertasActivas.media}
                                </span>
                                <span className="text-xs text-zinc-500">detectados</span>
                            </div>
                            <div className="mt-3 flex gap-1 pt-2 border-t border-zinc-100">
                                <div className="flex-1 h-1.5 bg-red-500 rounded-sm opacity-80" title="Alta" style={{ flexGrow: data.alertasActivas.alta || 1 }}></div>
                                <div className="flex-1 h-1.5 bg-amber-400 rounded-sm opacity-80" title="Media" style={{ flexGrow: data.alertasActivas.media || 1 }}></div>
                            </div>
                        </div>

                        {/* Card 4 */}
                        <div className="bg-white border border-zinc-200 p-4 rounded-sm hover:border-zinc-300 transition-colors">
                            <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-2">Riesgo Fiscal</h3>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-zinc-900 tracking-tight">
                                    {data.gastoProveedoresRiesgo > 0 ? 'MEDIO' : 'BAJO'}
                                </span>
                            </div>
                            <div className="mt-3 text-[10px] text-zinc-400 border-t border-zinc-100 pt-2 flex justify-between">
                                <span>Score Preliminar</span>
                                <span className="font-medium text-zinc-600">AUDITORÍA</span>
                            </div>
                        </div>
                    </div>

                    {/* Layout Principal Dividido */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                        {/* Panel Principal: Hallazgos Fiscales */}
                        <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-sm min-h-[400px]">
                            <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
                                <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Bitácora de Hallazgos Fiscales</h4>
                                <span className="text-[10px] font-mono text-zinc-400">LOG ACTIVIDAD</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-zinc-200 text-[11px] text-zinc-500 bg-white">
                                            <th className="px-4 py-2 font-semibold">ID REF.</th>
                                            <th className="px-4 py-2 font-semibold">SEVERIDAD</th>
                                            <th className="px-4 py-2 font-semibold w-1/2">DESCRIPCIÓN DEL HALLAZGO</th>
                                            <th className="px-4 py-2 font-semibold">FECHA DETECCIÓN</th>
                                            <th className="px-4 py-2 font-semibold text-right">ESTADO</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-xs">
                                        {data.topAlertas.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-10 text-center text-zinc-400 italic">
                                                    No hay hallazgos críticos detectados en este periodo.
                                                </td>
                                            </tr>
                                        ) : (
                                            data.topAlertas.map((alerta, idx) => (
                                                <tr key={alerta.id} className={`border-b border-zinc-100 hover:bg-zinc-50 group`}>
                                                    <td className="px-4 py-3 font-mono text-zinc-500">
                                                        REF-{String(idx + 1).padStart(4, '0')}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border ${alerta.nivel === 'alta'
                                                            ? 'bg-red-50 text-red-800 border-red-200'
                                                            : 'bg-amber-50 text-amber-800 border-amber-200'
                                                            }`}>
                                                            {alerta.nivel === 'alta' ? 'CRÍTICO' : 'REVISIÓN'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-zinc-800">
                                                        {alerta.mensaje}
                                                        <div className="text-[10px] text-zinc-400 mt-0.5 group-hover:text-zinc-500">
                                                            {alerta.tipo === 'ROJA' ? 'CFF Art. 69-B' : 'Validación Automática'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-zinc-600 font-mono text-[11px]">
                                                        {formatDate(alerta.fecha)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-[10px] text-zinc-400">PENDIENTE</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Panel Lateral: Métricas Secundarias */}
                        <div className="space-y-4">
                            <div className="bg-white border border-zinc-200 rounded-sm p-4">
                                <h4 className="text-[11px] font-bold text-zinc-500 uppercase mb-3">Conformidad Normativa</h4>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-zinc-700">EFOS (Listas Negras)</span>
                                            <span className="text-zinc-900 font-mono">100%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-100 rounded-sm overflow-hidden">
                                            <div className="h-full bg-emerald-600 w-full"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-zinc-700">Estructura CFDI 4.0</span>
                                            <span className="text-zinc-900 font-mono">98%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-zinc-100 rounded-sm overflow-hidden">
                                            <div className="h-full bg-zinc-600 w-[98%]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-zinc-200 rounded-sm">
                    <span className="text-zinc-400 text-sm">Esperando sincronización de datos...</span>
                </div>
            )}
        </MissionControlLayout>
    );
}

export default DashboardPage;
