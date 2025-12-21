import React from 'react';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

interface HistoricoMes {
    mes: string;
    ingresos: number;
    egresos: number;
    fecha: string;
}

interface TopItem {
    id: string; // RFC
    total: number;
    nombre?: string;
}

interface FiscalChartsProps {
    historico?: HistoricoMes[];
    topConcentracion?: TopItem[];
    tipo: 'ingresos' | 'gastos';
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const FiscalCharts: React.FC<FiscalChartsProps> = ({ historico = [], topConcentracion = [], tipo }) => {

    // Preparar datos para gráficos
    const dataLinea = historico.map(h => ({
        name: h.mes,
        Ingresos: h.ingresos,
        Egresos: h.egresos,
        Neto: h.ingresos - h.egresos
    })).reverse();

    // Datos Concentración
    const dataConcentracion = topConcentracion.slice(0, 5).map(item => ({
        name: item.id,
        value: item.total
    }));

    // Custom Tooltip para Dark Mode
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-xl text-xs">
                    <p className="font-bold text-gray-300 mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

            {/* GRÁFICA 1: TENDENCIA 12 MESES (Línea) */}
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-lg p-5 shadow-lg">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Tendencia Anual (Ingresos vs Egresos)
                </h3>
                <div className="h-64 flex items-center justify-center">
                    {dataLinea.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dataLinea}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#9CA3AF"
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#9CA3AF"
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `$${value / 1000}k`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4B5563' }} />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                <Line
                                    type="monotone"
                                    dataKey="Ingresos"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    dot={{ r: 2, fill: '#10B981' }}
                                    activeDot={{ r: 4 }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Egresos"
                                    stroke="#EF4444"
                                    strokeWidth={2}
                                    dot={{ r: 2, fill: '#EF4444' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-gray-600 text-xs text-center border border-dashed border-gray-800 rounded p-4">
                            <p>Sin historial suficiente</p>
                            <p className="text-[10px] opacity-70">Requiere al menos 2 meses de datos</p>
                        </div>
                    )}
                </div>
            </div>

            {/* GRÁFICA 2: CONCENTRACIÓN (Dona) */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 shadow-lg flex flex-col">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
                    Top Concentración ({tipo === 'ingresos' ? 'Clientes' : 'Proveedores'})
                </h3>
                <div className="flex-1 min-h-[200px] relative flex items-center justify-center">
                    {dataConcentracion.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={dataConcentracion}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {dataConcentracion.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-gray-600 text-[10px] font-mono">TOP 5</span>
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-600 text-xs text-center border-2 border-dashed border-gray-800 rounded-full w-32 h-32 flex items-center justify-center">
                            Sin datos
                        </div>
                    )}
                </div>

                {/* Lista Leyenda Custom */}
                <div className="mt-4 space-y-2">
                    {dataConcentracion.length > 0 ? dataConcentracion.map((item, idx) => (
                        <div key={item.name} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                <span className="text-gray-300 font-mono truncate max-w-[100px]" title={item.name}>{item.name}</span>
                            </div>
                            <span className="text-gray-400 font-mono">
                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(item.value)}
                            </span>
                        </div>
                    )) : (
                        <p className="text-center text-[10px] text-gray-700 italic">No hay operaciones registradas en este periodo.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FiscalCharts;
