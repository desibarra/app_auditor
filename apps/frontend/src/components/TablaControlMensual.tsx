/**
 * 📊 TABLA DE CONTROL MENSUAL DE CFDIS
 * ======================================
 * 
 * Componente INDEPENDIENTE de filtros
 * Muestra resumen por mes y tipo de comprobante
 * Permite detectar faltantes en segundos
 * 
 * Características:
 * - NO depende de filtros de fecha
 * - NO depende de búsquedas
 * - Clickable para filtrar listado inferior
 * - Se actualiza automáticamente al cargar XML
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ResumenMensual {
    mes: string;
    I: number; // Ingreso
    E: number; // Egreso
    P: number; // Pago
    N: number; // Nómina
    T: number; // Traslado
    total: number;
    mesIncompleto: boolean;  // 🆕 Si faltan tipos esperados
    faltantes: string[];     // 🆕 Tipos que faltan ['I', 'P']
    nivelAlerta: 'ok' | 'medium' | 'high';  // 🆕 Nivel de alerta
}

interface TablaControlMensualProps {
    empresaId: string | null;
    onMesClick?: (mes: string, tipo?: string) => void;
    refreshTrigger?: number; // Para forzar actualización
}

export const TablaControlMensual: React.FC<TablaControlMensualProps> = ({
    empresaId,
    onMesClick,
    refreshTrigger = 0,
}) => {
    const [resumen, setResumen] = useState<ResumenMensual[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [modo, setModo] = useState<'EMITIDO' | 'RECIBIDO'>('EMITIDO'); // 🆕 Selector de Modo

    const cargarResumen = async () => {
        if (!empresaId) {
            setResumen([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get('/api/cfdi/resumen-mensual', {
                params: {
                    empresaId,
                    rol: modo // 🆕 Enviar rol al backend
                },
            });

            if (response.data.success) {
                setResumen(response.data.resumen);
            }
        } catch (err: any) {
            console.error('Error cargando resumen mensual:', err);
            setError('Error al cargar resumen mensual');
        } finally {
            setLoading(false);
        }
    };

    // Cargar al montar y cuando cambia empresa, refreshTrigger o MODO
    useEffect(() => {
        cargarResumen();
    }, [empresaId, refreshTrigger, modo]);

    if (!empresaId) {
        return null;
    }

    if (loading && resumen.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-x-4 border-slate-100 border-t-4 border-t-[#0f172a] rounded-xl animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analizando registros {modo.toLowerCase()}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-rose-50 border border-rose-100 rounded-[2rem] animate-in shake duration-500">
                <p className="text-[11px] text-rose-600 font-bold uppercase tracking-widest">⚠️ {error}</p>
            </div>
        );
    }

    const handleCeldaClick = (mes: string, tipo?: string) => {
        if (onMesClick) {
            onMesClick(mes, tipo);
        }
    };

    return (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/40">
            <div className="p-8 border-b border-slate-100 bg-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                        <span className="text-2xl">📊</span>
                        {modo === 'EMITIDO'
                            ? 'Control Mensual: Ingresos'
                            : 'Control Mensual: Deducciones'}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {modo === 'EMITIDO'
                            ? 'Auditoría de Facturación Emitida (IVA Trasladado)'
                            : 'Auditoría de Gastos Recibidos (IVA Acreditable)'}
                    </p>
                </div>

                {/* SELECTOR DE MODO */}
                <div className="flex bg-slate-50 rounded-[1.8rem] p-1.5 border border-slate-100 shadow-inner">
                    <button
                        onClick={() => setModo('EMITIDO')}
                        className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-[1.2rem] transition-all duration-500 ${modo === 'EMITIDO'
                            ? 'bg-[#0f172a] text-white shadow-lg shadow-slate-900/20 active:scale-95'
                            : 'text-slate-400 hover:text-slate-900'}`}
                    >
                        📤 Emitidos
                    </button>
                    <button
                        onClick={() => setModo('RECIBIDO')}
                        className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-[1.2rem] transition-all duration-500 ${modo === 'RECIBIDO'
                            ? 'bg-[#0f172a] text-white shadow-lg shadow-slate-900/20 active:scale-95'
                            : 'text-slate-400 hover:text-slate-900'}`}
                    >
                        📥 Recibidos
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Mes de Auditoría</th>
                            <th className="px-6 py-6 text-center text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">
                                {modo === 'EMITIDO' ? 'Venta (I)' : 'Gasto (I)'}
                            </th>
                            <th className="px-6 py-6 text-center text-[10px] font-black text-rose-600 uppercase tracking-[0.3em]">
                                {modo === 'EMITIDO' ? 'Notas (E)' : 'Devol. (E)'}
                            </th>
                            <th className="px-6 py-6 text-center text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
                                {modo === 'EMITIDO' ? 'Cobro (P)' : 'Pago (P)'}
                            </th>
                            <th className="px-6 py-6 text-center text-[10px] font-black text-purple-600 uppercase tracking-[0.3em]">Nómina (N)</th>
                            <th className="px-6 py-6 text-center text-[10px] font-black text-orange-600 uppercase tracking-[0.3em]">Traslado (T)</th>
                            <th className="px-10 py-6 text-center text-[10px] font-black text-[#0f172a] uppercase tracking-[0.3em] bg-[#0f172a]/5">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {resumen.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-[10px]">
                                    No se identificaron registros en el repositorio fiscal
                                </td>
                            </tr>
                        ) : resumen.map((row) => {
                            let trClass = 'hover:bg-slate-50/80 transition-all group';
                            let badge = null;

                            if (row.mesIncompleto) {
                                trClass = 'bg-amber-50/40 hover:bg-amber-50/60 transition-all group border-l-4 border-l-amber-400';
                                badge = (
                                    <div className="ml-3 px-2 py-0.5 bg-amber-400 text-white rounded-lg text-[8px] font-black shadow-sm animate-pulse">
                                        ANOMALÍA
                                    </div>
                                );
                            }

                            return (
                                <tr key={row.mes} className={trClass}>
                                    <td
                                        className="px-10 py-6 text-[11px] font-black text-slate-900 uppercase tracking-tighter cursor-pointer group-hover:text-[#0f172a] transition-colors"
                                        onClick={() => handleCeldaClick(row.mes)}
                                    >
                                        <div className="flex items-center">
                                            {formatMes(row.mes)}
                                            {badge}
                                        </div>
                                    </td>
                                    <td
                                        className={`px-6 py-6 text-center font-mono text-[12px] ${row.I > 0 ? 'text-emerald-600 font-black cursor-pointer hover:bg-emerald-50 hover:scale-110 rounded-xl transition-all' : 'text-slate-200'}`}
                                        onClick={() => row.I > 0 && handleCeldaClick(row.mes, 'I')}
                                    >
                                        {row.I || '—'}
                                    </td>
                                    <td
                                        className={`px-6 py-6 text-center font-mono text-[12px] ${row.E > 0 ? 'text-rose-600 font-black cursor-pointer hover:bg-rose-50 hover:scale-110 rounded-xl transition-all' : 'text-slate-200'}`}
                                        onClick={() => row.E > 0 && handleCeldaClick(row.mes, 'E')}
                                    >
                                        {row.E || '—'}
                                    </td>
                                    <td
                                        className={`px-6 py-6 text-center font-mono text-[12px] ${row.P > 0 ? 'text-blue-600 font-black cursor-pointer hover:bg-blue-50 hover:scale-110 rounded-xl transition-all' : 'text-slate-200'}`}
                                        onClick={() => row.P > 0 && handleCeldaClick(row.mes, 'P')}
                                    >
                                        {row.P || '—'}
                                    </td>
                                    <td
                                        className={`px-6 py-6 text-center font-mono text-[12px] ${row.N > 0 ? 'text-purple-600 font-black cursor-pointer hover:bg-purple-50 hover:scale-110 rounded-xl transition-all' : 'text-slate-200'}`}
                                        onClick={() => row.N > 0 && handleCeldaClick(row.mes, 'N')}
                                    >
                                        {row.N || '—'}
                                    </td>
                                    <td
                                        className={`px-6 py-6 text-center font-mono text-[12px] ${row.T > 0 ? 'text-orange-600 font-black cursor-pointer hover:bg-orange-50 hover:scale-110 rounded-xl transition-all' : 'text-slate-200'}`}
                                        onClick={() => row.T > 0 && handleCeldaClick(row.mes, 'T')}
                                    >
                                        {row.T || '—'}
                                    </td>
                                    <td className="px-10 py-6 text-center font-black text-[#0f172a] font-mono text-[13px] bg-[#0f172a]/5 group-hover:bg-[#0f172a]/10 transition-colors">
                                        {row.total}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-50/80 border-t border-slate-100">
                            <td className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Consolidado Anual</td>
                            <td className="px-6 py-6 text-center font-black text-emerald-600 font-mono text-[14px]">{resumen.reduce((sum, r) => sum + r.I, 0)}</td>
                            <td className="px-6 py-6 text-center font-black text-rose-600 font-mono text-[14px]">{resumen.reduce((sum, r) => sum + r.E, 0)}</td>
                            <td className="px-6 py-6 text-center font-black text-blue-600 font-mono text-[14px]">{resumen.reduce((sum, r) => sum + r.P, 0)}</td>
                            <td className="px-6 py-6 text-center font-black text-purple-600 font-mono text-[14px]">{resumen.reduce((sum, r) => sum + r.N, 0)}</td>
                            <td className="px-6 py-6 text-center font-black text-orange-600 font-mono text-[14px]">{resumen.reduce((sum, r) => sum + r.T, 0)}</td>
                            <td className="px-10 py-6 text-center font-black text-[#0f172a] font-mono text-[16px] bg-[#0f172a]/10 shadow-inner">
                                {resumen.reduce((sum, r) => sum + r.total, 0)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

function formatMes(mes: string): string {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const [year, month] = mes.split('-');
    const monthIndex = parseInt(month, 10) - 1;

    return `${meses[monthIndex]} ${year}`;
}

export default TablaControlMensual;
