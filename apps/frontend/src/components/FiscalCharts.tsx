import React from 'react';
import {
    LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

interface TendenciaData {
    status: 'OK' | 'INSUFICIENTE';
    mesesDisponibles: number;
    data: { mes: string; ingresos: number; egresos: number }[];
}

interface TopItem {
    id: string;
    total: number;
    nombre?: string;
}

interface FiscalChartsProps {
    tendencia?: TendenciaData;
    topConcentracion?: TopItem[];
    tipo: 'ingresos' | 'gastos';
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const FiscalCharts: React.FC<FiscalChartsProps> = ({ tendencia, topConcentracion = [], tipo }) => {

    // Sanitización de datos para LineChart (Garantizar números para Recharts)
    const dataLinea = tendencia?.data?.map(h => ({
        name: h.mes,
        Ingresos: Number(h.ingresos || 0),
        Egresos: Number(h.egresos || 0),
    })) || [];

    // Datos Concentración
    const dataConcentracion = topConcentracion?.slice(0, 5).map(item => ({
        name: item.nombre || item.id,
        value: Number(item.total || 0)
    })) || [];

    // Custom Tooltip Premium
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0B0E14] border border-gray-800 p-3 rounded shadow-2xl text-[10px] backdrop-blur-md ring-1 ring-white/5">
                    <p className="font-black text-gray-500 mb-2 uppercase tracking-[0.2em] border-b border-white/5 pb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex justify-between gap-6 mb-1">
                            <span className="font-bold uppercase tracking-wider" style={{ color: entry.color }}>{entry.name}:</span>
                            <span className="font-mono text-white">
                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(entry.value)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

            {/* GRÁFICA 1: TENDENCIA 12 MESES (Línea) */}
            <div className="lg:col-span-8 fiscal-card p-6 min-h-[400px]">
                <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <span className="w-1.5 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.4)]"></span>
                    Tendencia Operativa Histórica (Ingresos vs Egresos)
                </h3>

                <div className="h-[300px] w-full mt-4">
                    {tendencia?.status === 'OK' && dataLinea.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dataLinea} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} strokeOpacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#4B5563"
                                    tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 'black' }}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={15}
                                />
                                <YAxis
                                    stroke="#4B5563"
                                    tick={{ fontSize: 9, fill: '#6B7280', fontWeight: 'black' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Legend
                                    wrapperStyle={{ fontSize: '9px', fontWeight: 'black', paddingTop: '30px', textTransform: 'uppercase', letterSpacing: '2px' }}
                                    iconType="circle"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Ingresos"
                                    stroke="#10B981"
                                    strokeWidth={4}
                                    dot={{ r: 3, fill: '#0B0E14', stroke: '#10B981', strokeWidth: 3 }}
                                    activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }}
                                    animationDuration={1500}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="Egresos"
                                    stroke="#F43F5E"
                                    strokeWidth={4}
                                    dot={{ r: 3, fill: '#0B0E14', stroke: '#F43F5E', strokeWidth: 3 }}
                                    activeDot={{ r: 6, fill: '#F43F5E', stroke: '#fff', strokeWidth: 2 }}
                                    animationDuration={1500}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center bg-black/20 rounded-2xl border-2 border-dashed border-gray-800/50 p-8">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.3em] mb-2">
                                {tendencia?.status === 'INSUFICIENTE' ? 'Historial Insuficiente' : 'Audit Engine — Sin Análisis'}
                            </p>
                            <p className="text-gray-600 text-[11px] max-w-[280px] mx-auto leading-relaxed font-medium">
                                {tendencia?.status === 'INSUFICIENTE'
                                    ? `Se requiere una profundidad de al menos 2 periodos fiscales para proyectar tendencia (Actual: ${tendencia.mesesDisponibles}).`
                                    : 'No existe historial transaccional validado para la identidad seleccionada en este flujo.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* GRÁFICA 2: CONCENTRACIÓN (Dona) */}
            <div className="lg:col-span-4 fiscal-card p-6 flex flex-col min-h-[400px]">
                <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <span className="w-1.5 h-4 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.4)]"></span>
                    Concentración (Top 5 Operadores)
                </h3>

                <div className="flex-1 relative flex flex-col items-center justify-center min-h-[200px]">
                    {dataConcentracion.length > 0 ? (
                        <>
                            <div className="w-full h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={dataConcentracion}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={65}
                                            outerRadius={85}
                                            paddingAngle={8}
                                            dataKey="value"
                                            animationDuration={1500}
                                        >
                                            {dataConcentracion.map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    stroke="rgba(0,0,0,0.5)"
                                                    strokeWidth={2}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="absolute top-[110px] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">TOP 5</span>
                                <span className="text-[8px] font-bold text-gray-800 uppercase tracking-widest">Distribución</span>
                            </div>

                            {/* Detalle de Leyenda con nombres */}
                            <div className="mt-8 w-full space-y-3">
                                {dataConcentracion.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-[10px]">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <span className="w-2.5 h-2.5 rounded-full ring-2 ring-black/20" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                                            <span className="text-gray-400 font-bold truncate uppercase tracking-tight" title={item.name}>{item.name}</span>
                                        </div>
                                        <span className="text-gray-200 font-black font-mono ml-4">
                                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(item.value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-800 flex items-center justify-center text-gray-700 text-xs mb-4">ø</div>
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em]">Sin Concentración</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FiscalCharts;
