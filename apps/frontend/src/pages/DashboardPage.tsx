import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TablaCfdiRecientes from '../components/TablaCfdiRecientes';
import BotonCargarXml from '../components/BotonCargarXml';
import SelectorEmpresa from '../components/SelectorEmpresa';
import GraficaIngresosEgresos from '../components/GraficaIngresosEgresos';
import SkeletonCard from '../components/SkeletonCard';

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
        countIngresos?: number;
        countEgresos?: number;
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
    const [refreshKey, setRefreshKey] = useState(0); // Para refrescar tabla de CFDIs
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Verificar health del backend
                const healthRes = await axios.get('/api/dashboard/health');
                setHealth(healthRes.data);

                // Si hay empresa seleccionada, obtener estadísticas reales
                if (empresaSeleccionada) {
                    const statsRes = await axios.get(`/api/stats/dashboard?empresaId=${empresaSeleccionada}`);
                    setData(statsRes.data);
                } else {
                    // Sin empresa seleccionada, mostrar datos vacíos
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
    }, [empresaSeleccionada, refreshKey]); // Recargar cuando cambie la empresa

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Cargando...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-red-500 text-lg">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Dashboard - SaaS Fiscal PyMEs
                            </h1>
                            {health && (
                                <p className="text-sm text-green-600 mt-1">
                                    ✓ Backend conectado - {health.service}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Botón Mis Expedientes */}
                            <button
                                onClick={() => navigate('/expedientes')}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            >
                                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                📁 Mis Expedientes
                            </button>
                            {/* Selector de Empresa */}
                            <SelectorEmpresa
                                empresaSeleccionada={empresaSeleccionada}
                                onSeleccionar={(id) => {
                                    setEmpresaSeleccionada(id);
                                    localStorage.setItem('empresaActiva', id); // Persistencia crítica
                                    setRefreshKey(prev => prev + 1);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {loading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : (
                        <>
                            <div className="card">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">
                                    CFDI del Mes
                                </h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {(data?.totalCfdiMes?.countIngresos ?? 0) + (data?.totalCfdiMes?.countEgresos ?? 0)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data?.totalCfdiMes?.ingresos ?? 0)} ingresos
                                </p>
                                <p className="text-sm text-gray-500">
                                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data?.totalCfdiMes?.egresos ?? 0)} egresos
                                </p>
                            </div>

                            <div className="card">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">
                                    Alertas Activas
                                </h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {(data?.alertasActivas?.alta ?? 0) + (data?.alertasActivas?.media ?? 0)}
                                </p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                                        {data?.alertasActivas?.alta ?? 0} alta
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                                        {data?.alertasActivas?.media ?? 0} media
                                    </span>
                                </div>
                            </div>

                            <div className="card">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">
                                    Gasto Proveedores de Riesgo
                                </h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {(data?.gastoProveedoresRiesgo ?? 0).toFixed(1)}%
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Del total de egresos
                                </p>
                            </div>

                            <div className="card">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">
                                    Expedientes Incompletos
                                </h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {data?.expedientesIncompletos ?? 0}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Requieren atención
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Top Alertas */}
                <div className="card mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Alertas Prioritarias
                    </h2>
                    <div className="space-y-3">
                        {(data?.topAlertas ?? []).map((alerta) => (
                            <div
                                key={alerta.id}
                                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                                <div
                                    className={`w-2 h-2 rounded-full mt-2 ${alerta.nivel === 'alta'
                                        ? 'bg-red-500'
                                        : alerta.nivel === 'media'
                                            ? 'bg-yellow-500'
                                            : 'bg-blue-500'
                                        }`}
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {alerta.mensaje}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(alerta.fecha).toLocaleDateString('es-MX')}
                                    </p>
                                </div>
                                <button className="text-sm text-primary-600 hover:text-primary-700">
                                    Ver detalle →
                                </button>
                            </div>
                        ))}

                        {(!data?.topAlertas || data.topAlertas.length === 0) && (
                            <p className="text-sm text-gray-500 italic">
                                No hay alertas prioritarias en este momento.
                            </p>
                        )}
                    </div>
                </div>

                {/* ✨ NUEVA SECCIÓN: CFDIs Recientes */}
                {empresaSeleccionada ? (
                    <div className="mb-8 space-y-4">
                        {/* Botón de Carga */}
                        <div className="card">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Importar CFDI
                            </h2>
                            <p className="text-sm text-gray-600 mb-3">
                                El sistema detectará automáticamente la empresa basándose en el RFC del XML
                            </p>
                            <BotonCargarXml
                                onSuccess={() => setRefreshKey(prev => prev + 1)}
                            />
                        </div>

                        {/* Tabla de CFDIs Recientes */}
                        <TablaCfdiRecientes
                            empresaId={empresaSeleccionada}
                            key={refreshKey}
                            onRefresh={() => setRefreshKey(prev => prev + 1)}
                        />
                    </div>
                ) : (
                    <div className="mb-8">
                        <div className="card">
                            <p className="text-center text-gray-500 py-8">
                                Selecciona una empresa para ver los CFDIs
                            </p>
                        </div>
                    </div>
                )}

                {/* Gráfica de Ingresos vs Egresos */}
                <div className="card">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Ingresos vs Egresos (últimos 6 meses)
                    </h2>
                    <GraficaIngresosEgresos data={data?.historico || []} />
                </div>
            </main>
        </div>
    );
}

export default DashboardPage;
