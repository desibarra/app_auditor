import { useEffect, useState } from 'react';
import axios from 'axios';

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
}

function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Verificar health del backend
                const healthRes = await axios.get('/api/dashboard/health');
                setHealth(healthRes.data);

                // Obtener datos del dashboard (usando empresa dummy)
                const dashboardRes = await axios.get('/api/dashboard/overview/demo-empresa');
                setData(dashboardRes.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('No se pudo cargar los datos del dashboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
                    <h1 className="text-2xl font-bold text-gray-900">
                        Dashboard - SaaS Fiscal PyMEs
                    </h1>
                    {health && (
                        <p className="text-sm text-green-600 mt-1">
                            ✓ Backend conectado - {health.service}
                        </p>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {data ? (
                    <>
                        {/* KPIs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <div className="card">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">
                                    CFDI del Mes
                                </h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {data.totalCfdiMes.ingresos}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {data.totalCfdiMes.ingresos} ingresos, {data.totalCfdiMes.egresos} egresos
                                </p>
                            </div>

                            <div className="card">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">
                                    Alertas Activas
                                </h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {data.alertasActivas.alta + data.alertasActivas.media}
                                </p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                                        {data.alertasActivas.alta} alta
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                                        {data.alertasActivas.media} media
                                    </span>
                                </div>
                            </div>

                            <div className="card">
                                <h3 className="text-sm font-medium text-gray-600 mb-2">
                                    Gasto Proveedores de Riesgo
                                </h3>
                                <p className="text-3xl font-bold text-gray-900">
                                    {data.gastoProveedoresRiesgo}%
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
                                    {data.expedientesIncompletos}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Requieren atención
                                </p>
                            </div>
                        </div>

                        {/* Top Alertas */}
                        <div className="card mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                Alertas Prioritarias
                            </h2>
                            <div className="space-y-3">
                                {data.topAlertas.length > 0 ? (
                                    data.topAlertas.map((alerta) => (
                                        <div
                                            key={alerta.id}
                                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div
                                                className={`w-2 h-2 rounded-full mt-2 ${
                                                    alerta.nivel === 'alta'
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
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic">
                                        No hay alertas prioritarias en este momento.
                                    </p>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-gray-500">
                        <p>No hay datos disponibles para mostrar.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default DashboardPage;
