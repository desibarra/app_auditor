import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MissionControlLayout from '../components/MissionControlLayout';
import { useEmpresa } from '../context/EmpresaContext';
import * as XLSX from 'xlsx';

interface ReporteSatRepData {
    periodo: string;
    flujo: 'COBRADO' | 'PAGADO';
    totalReps: number;
    totalEfectivo: number;
    baseIva16: number;
    iva16: number;
    baseIva8: number;
    iva8: number;
    baseIva0: number;
    isrRetenido: number;
    ivaRetenido: number;
    ieps: number;
}

const ReporteSatRepPage: React.FC = () => {
    const { empresa } = useEmpresa();
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [data, setData] = useState<ReporteSatRepData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReporte = async () => {
        if (!empresa?.id) return;

        setLoading(true);
        setError(null);

        try {
            const res = await axios.get('/api/reportes/sat-rep', {
                params: { empresaId: empresa.id, year }
            });
            setData(res.data.data || []);
        } catch (err: any) {
            console.error('Error fetching SAT-REP:', err);
            setError(err.response?.data?.message || 'Error al cargar el reporte');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReporte();
    }, [empresa?.id, year]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(data.map(row => ({
            'Periodo': row.periodo,
            'Flujo': row.flujo,
            'Total REPs': row.totalReps,
            'Total Efectivo': row.totalEfectivo,
            'Base IVA 16%': row.baseIva16,
            'IVA 16%': row.iva16,
            'Base IVA 8%': row.baseIva8,
            'IVA 8%': row.iva8,
            'Base IVA 0%': row.baseIva0,
            'ISR Retenido': row.isrRetenido,
            'IVA Retenido': row.ivaRetenido,
            'IEPS': row.ieps,
        })));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `SAT-REP ${year}`);
        XLSX.writeFile(workbook, `Reporte_SAT_REP_${empresa?.razonSocial}_${year}.xlsx`);
    };

    return (
        <MissionControlLayout title="REPORTE SAT - FLUJO DE EFECTIVO (REP)">
            <div className="space-y-8 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex justify-between items-end border-b border-slate-200 pb-8">
                    <div>
                        <h2 className="text-4xl font-black text-[#0f172a] tracking-tighter uppercase leading-none">
                            Reporte SAT - Flujo de Efectivo
                        </h2>
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            Basado en Complementos de Pago (REP 2.0)
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="bg-white border border-slate-200 rounded-2xl px-6 py-3 font-black text-[#0f172a] focus:ring-4 focus:ring-blue-500/20 focus:outline-none"
                        >
                            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                        <button
                            onClick={exportToExcel}
                            disabled={data.length === 0}
                            className="btn-success px-8 py-3 rounded-2xl shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            📊 Exportar a Excel
                        </button>
                    </div>
                </div>

                {/* Advertencia */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-2xl">
                    <div className="flex items-start gap-4">
                        <span className="text-3xl">ℹ️</span>
                        <div>
                            <p className="text-xs font-black text-blue-900 uppercase tracking-widest">
                                Flujo de Efectivo Real (REP)
                            </p>
                            <p className="text-sm text-blue-700 mt-2 font-bold">
                                Este reporte muestra el <strong>dinero realmente cobrado/pagado</strong> según los Complementos de Pago (REP).
                                <br />
                                <strong>NO representa facturación devengada.</strong> Solo refleja transacciones con REP registrado.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                {loading ? (
                    <div className="bg-white rounded-3xl border border-slate-100 p-20 text-center">
                        <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Generando reporte...</p>
                    </div>
                ) : error ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-3xl p-10 text-center">
                        <span className="text-5xl">⚠️</span>
                        <p className="text-rose-700 font-black mt-4">{error}</p>
                    </div>
                ) : data.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-20 text-center">
                        <span className="text-6xl mb-4 block">📭</span>
                        <p className="text-slate-600 font-black text-lg">Sin Complementos de Pago (REP) en {year}</p>
                        <p className="text-slate-400 text-sm mt-2">Asegúrese de haber importado los XML de tipo "P"</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#0f172a] text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Periodo</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest">Flujo</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">REPs</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">Total Efectivo</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">Base IVA 16%</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">IVA 16%</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">Base IVA 8%</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">IVA 8%</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">Base IVA 0%</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">ISR Ret.</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">IVA Ret.</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest">IEPS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-sm font-bold text-slate-900">{row.periodo}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${row.flujo === 'COBRADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                    {row.flujo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-sm font-bold text-slate-600">{row.totalReps}</td>
                                            <td className="px-6 py-4 text-right font-mono text-sm font-black text-[#0f172a]">{formatCurrency(row.totalEfectivo)}</td>
                                            <td className="px-6 py-4 text-right font-mono text-xs text-slate-600">{formatCurrency(row.baseIva16)}</td>
                                            <td className="px-6 py-4 text-right font-mono text-xs font-bold text-blue-600">{formatCurrency(row.iva16)}</td>
                                            <td className="px-6 py-4 text-right font-mono text-xs text-slate-600">{formatCurrency(row.baseIva8)}</td>
                                            <td className="px-6 py-4 text-right font-mono text-xs font-bold text-blue-600">{formatCurrency(row.iva8)}</td>
                                            <td className="px-6 py-4 text-right font-mono text-xs text-slate-600">{formatCurrency(row.baseIva0)}</td>
                                            <td className="px-6 py-4 text-right font-mono text-xs text-amber-600">{formatCurrency(row.isrRetenido)}</td>
                                            <td className="px-6 py-4 text-right font-mono text-xs text-amber-600">{formatCurrency(row.ivaRetenido)}</td>
                                            <td className="px-6 py-4 text-right font-mono text-xs text-purple-600">{formatCurrency(row.ieps)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </MissionControlLayout>
    );
};

export default ReporteSatRepPage;
