import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

interface HistoricoMes {
    mes: string;
    ingresos: number;
    egresos: number;
    fecha: string;
}

interface GraficaIngresosEgresosProps {
    data: HistoricoMes[];
}

function GraficaIngresosEgresos({ data }: GraficaIngresosEgresosProps) {
    // Formatear valores para el tooltip
    const formatearMoneda = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Tooltip personalizado
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                        {payload[0].payload.mes}
                    </p>
                    <p className="text-sm text-green-600">
                        <span className="font-medium">Ingresos:</span>{' '}
                        {formatearMoneda(payload[0].value)}
                    </p>
                    <p className="text-sm text-blue-600">
                        <span className="font-medium">Egresos:</span>{' '}
                        {formatearMoneda(payload[1].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                    No hay datos disponibles para mostrar la gráfica
                </p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                    dataKey="mes"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#d1d5db' }}
                />
                <YAxis
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickFormatter={(value) => {
                        if (value >= 1000000) {
                            return `$${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                            return `$${(value / 1000).toFixed(0)}K`;
                        }
                        return `$${value}`;
                    }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    wrapperStyle={{
                        paddingTop: '20px',
                    }}
                    iconType="square"
                />
                <Bar
                    dataKey="ingresos"
                    fill="#10b981"
                    name="Ingresos"
                    radius={[4, 4, 0, 0]}
                />
                <Bar
                    dataKey="egresos"
                    fill="#3b82f6"
                    name="Egresos"
                    radius={[4, 4, 0, 0]}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

export default GraficaIngresosEgresos;
