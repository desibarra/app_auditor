import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import MissionControlLayout from '../components/MissionControlLayout';
import { useEmpresa } from '../context/EmpresaContext';

const DashboardPage: React.FC = () => {
    const { empresa, loading: loadingContext } = useEmpresa();

    // FILTROS CENTRALIZADOS
    const [periodo, setPeriodo] = useState<{ mes: string; anio: string }>({
        mes: new Date().toISOString().substring(5, 7),
        anio: new Date().getFullYear().toString()
    });

    const [summary, setSummary] = useState<any>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);

    // UTILS INLINE PARA GARANTIZAR FUNCIONAMIENTO
    const fCurrency = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

    const tryShowPicker = () => {
        if (dateInputRef.current && 'showPicker' in dateInputRef.current) {
            try { dateInputRef.current.showPicker(); } catch (e) { console.warn(e); }
        }
    };

    const fetchData = async () => {
        if (!empresa) return;
        try {
            const res = await axios.get('/api/stats/sentinel-summary', {
                params: {
                    empresaId: empresa.id,
                    periodo: `${periodo.anio}-${periodo.mes}`,
                    anio: periodo.anio,
                    flujo: 'EMITIDOS'
                }
            });
            setSummary(res.data);
        } catch (err) {
            console.error('[SENTINEL] Dashboard load error:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [empresa, periodo.mes, periodo.anio]);

    if (loadingContext) return <div className="h-screen bg-[#0B0E14] flex items-center justify-center text-gray-400 font-mono">INICIALIZANDO SENTINEL...</div>;

    const kpis = summary?.kpis || {};
    const alertas = summary?.alertas || [];

    return (
        <MissionControlLayout title="DASHBOARD">
            {/* TOOLBAR SUPERIOR */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">RESUMEN EJECUTIVO</h2>
                    <p className="text-xs text-gray-500 font-mono mt-1">Sincronizado: {new Date().toLocaleTimeString()}</p>
                </div>

                <div className="flex items-center gap-3 bg-[#151A23] p-1.5 rounded-xl border border-gray-800">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-3">Periodo:</span>
                    <div className="relative cursor-pointer" onClick={tryShowPicker}>
                        <input
                            ref={dateInputRef}
                            type="month"
                            value={`${periodo.anio}-${periodo.mes}`}
                            onChange={(e) => {
                                const [y, m] = e.target.value.split('-');
                                if (y && m) setPeriodo({ anio: y, mes: m });
                            }}
                            className="bg-transparent border-none text-white font-mono text-xs focus:ring-0 cursor-pointer uppercase"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                </div>
            </div>

            {/* GRID DE KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="fiscal-card p-6">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Ingresos Consolidados</h3>
                    <div className="text-3xl font-bold text-emerald-400 tracking-tighter">{fCurrency(kpis.ingresos || 0)}</div>
                    <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                        <span className="text-[9px] text-gray-600 font-bold uppercase">Base Gravable</span>
                        <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">VIGENTE</span>
                    </div>
                </div>

                <div className="fiscal-card p-6">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Egresos / Deducciones</h3>
                    <div className="text-3xl font-bold text-rose-400 tracking-tighter">{fCurrency(kpis.egresos || 0)}</div>
                    <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                        <span className="text-[9px] text-gray-600 font-bold uppercase">IVA Acreditable</span>
                        <span className="text-[9px] px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20">AUDITADO</span>
                    </div>
                </div>

                <div className="fiscal-card p-6">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Total XML Procesados</h3>
                    <div className="text-3xl font-bold text-indigo-400 tracking-tighter">{(kpis.totalCfdis || 0).toLocaleString()}</div>
                    <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                        <span className="text-[9px] text-gray-600 font-bold uppercase">Visión Anual</span>
                        <span className="text-[10px]">📂</span>
                    </div>
                </div>

                <div className="fiscal-card p-6">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Perfil de Riesgo</h3>
                    <div className={`text-3xl font-bold tracking-tighter ${kpis.perfilRiesgo === 'OPTIMO' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {kpis.perfilRiesgo || 'BAJO'}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                        <span className="text-[9px] text-gray-600 font-bold uppercase">Sentinel Score</span>
                        <span className="text-white font-mono text-[10px]">{summary?.perfilRiesgo || 0}%</span>
                    </div>
                </div>
            </div>

            {/* TABLA DE HALLAZGOS */}
            <div className="fiscal-card">
                <div className="px-6 py-4 border-b border-gray-800 bg-[#1A1F29]/50 flex justify-between items-center">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                        Hallazgos de Auditoría Técnica
                    </h4>
                    <button onClick={fetchData} className="text-[10px] font-bold text-indigo-400 hover:text-white transition-colors uppercase tracking-tighter">
                        Re-Análisis Inmediato
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#0B0E14] text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                            <tr>
                                <th className="px-6 py-4">Prioridad</th>
                                <th className="px-6 py-4">Hallazgo Detectado</th>
                                <th className="px-6 py-4">Afectación Fiscal</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {alertas.length > 0 ? alertas.map((a: any) => (
                                <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${a.tipo === 'ROJA' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                            a.tipo === 'AMARILLA' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                            {a.tipo === 'ROJA' ? 'CRÍTICO' : 'REVISIÓN'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-white font-bold text-xs">{a.titulo}</div>
                                        <div className="text-[10px] text-gray-500 mt-1">{a.desc}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-400">
                                        VAL-SYS-{a.id}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="text-indigo-400 hover:text-white font-black text-[10px] uppercase tracking-tighter border border-indigo-500/30 px-3 py-1 rounded-md hover:bg-indigo-600 transition-all">Ver Detalle</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center text-gray-600 font-mono text-xs uppercase tracking-widest italic">
                                        No se detectaron riesgos en el periodo seleccionado
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </MissionControlLayout>
    );
};

export default DashboardPage;
