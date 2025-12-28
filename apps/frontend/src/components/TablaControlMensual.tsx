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
            <div className="tabla-control-loading">
                <div className="spinner"></div>
                <p>Cargando resumen {modo === 'EMITIDO' ? 'emitidos' : 'recibidos'}...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tabla-control-error">
                <p>⚠️ {error}</p>
            </div>
        );
    }

    const handleCeldaClick = (mes: string, tipo?: string) => {
        if (onMesClick) {
            onMesClick(mes, tipo);
        }
    };

    return (

        <div className="fiscal-card overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-[#0B0E14]/50 backdrop-blur-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                        {modo === 'EMITIDO'
                            ? '📊 Control Mensual: INGRESOS (IVA Trasladado)'
                            : '📊 Control Mensual: GASTOS (IVA Acreditable)'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                        {modo === 'EMITIDO'
                            ? 'Auditoría de Facturas Emitidas (Ventas)'
                            : 'Auditoría de Facturas Recibidas (Deducciones)'}
                    </p>
                </div>

                {/* 🆕 SELECTOR DE MODO */}
                <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                    <button
                        onClick={() => setModo('EMITIDO')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${modo === 'EMITIDO'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        📤 Emitidos
                    </button>
                    <button
                        onClick={() => setModo('RECIBIDO')}
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${modo === 'RECIBIDO'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-gray-400 hover:text-gray-200'}`}
                    >
                        📥 Recibidos
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-[#0B0E14] border-b border-gray-800">
                            <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-wider text-xs">Mes</th>
                            <th className="px-4 py-4 text-center font-bold text-emerald-500 uppercase tracking-wider text-xs" title="Ingreso">
                                {modo === 'EMITIDO' ? 'Venta (I)' : 'Gasto (I)'}
                            </th>
                            <th className="px-4 py-4 text-center font-bold text-rose-500 uppercase tracking-wider text-xs" title="Egreso">
                                {modo === 'EMITIDO' ? 'Nota C. (E)' : 'Devol. (E)'}
                            </th>
                            <th className="px-4 py-4 text-center font-bold text-blue-500 uppercase tracking-wider text-xs" title="Pago">
                                {modo === 'EMITIDO' ? 'Cobro (P)' : 'Pago (P)'}
                            </th>
                            <th className="px-4 py-4 text-center font-bold text-purple-500 uppercase tracking-wider text-xs" title="Nómina">N</th>
                            <th className="px-4 py-4 text-center font-bold text-orange-500 uppercase tracking-wider text-xs" title="Traslado">T</th>
                            <th className="px-6 py-4 text-center font-bold text-indigo-400 uppercase tracking-wider text-xs bg-gray-900/50">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {resumen.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-8 text-gray-500 font-mono text-xs">
                                    No hay registros {modo === 'EMITIDO' ? 'emitidos' : 'recibidos'}
                                </td>
                            </tr>
                        ) : resumen.map((row) => {
                            let alertClass = 'hover:bg-gray-800/30 transition-colors';
                            let alertTooltip = '';
                            let badge = null;

                            if (row.mesIncompleto) {
                                alertClass = row.nivelAlerta === 'high'
                                    ? 'bg-red-900/10 hover:bg-red-900/20 transition-colors'
                                    : 'bg-yellow-900/10 hover:bg-yellow-900/20 transition-colors';

                                const tiposNombres = {
                                    'I': modo === 'EMITIDO' ? 'Ingreso' : 'Gasto',
                                    'E': 'Egreso',
                                    'P': 'Pago',
                                    'N': 'Nómina',
                                    'T': 'Traslado'
                                };
                                const faltantesText = row.faltantes.map(t => tiposNombres[t as keyof typeof tiposNombres]).join(', ');
                                alertTooltip = `⚠️ Falta CFDI tipo: ${faltantesText}`;
                                badge = (
                                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                                        ⚠️
                                    </span>
                                );
                            }

                            return (
                                <tr key={row.mes} className={alertClass} title={alertTooltip}>
                                    <td
                                        className="px-6 py-4 text-sm font-medium text-gray-300 font-mono cursor-pointer hover:text-indigo-400 transition-colors"
                                        onClick={() => handleCeldaClick(row.mes)}
                                    >
                                        <div className="flex items-center">
                                            {formatMes(row.mes)}
                                            {badge}
                                        </div>
                                    </td>
                                    <td
                                        className={`px-4 py-4 text-center font-mono ${row.I > 0 ? 'text-emerald-400 font-bold cursor-pointer hover:bg-emerald-900/20 hover:scale-105 transition-all' : 'text-gray-700'}`}
                                        onClick={() => row.I > 0 && handleCeldaClick(row.mes, 'I')}
                                    >
                                        {row.I || '—'}
                                    </td>
                                    <td
                                        className={`px-4 py-4 text-center font-mono ${row.E > 0 ? 'text-rose-400 font-bold cursor-pointer hover:bg-rose-900/20 hover:scale-105 transition-all' : 'text-gray-700'}`}
                                        onClick={() => row.E > 0 && handleCeldaClick(row.mes, 'E')}
                                    >
                                        {row.E || '—'}
                                    </td>
                                    <td
                                        className={`px-4 py-4 text-center font-mono ${row.P > 0 ? 'text-blue-400 font-bold cursor-pointer hover:bg-blue-900/20 hover:scale-105 transition-all' : 'text-gray-700'}`}
                                        onClick={() => row.P > 0 && handleCeldaClick(row.mes, 'P')}
                                    >
                                        {row.P || '—'}
                                    </td>
                                    <td
                                        className={`px-4 py-4 text-center font-mono ${row.N > 0 ? 'text-purple-400 font-bold cursor-pointer hover:bg-purple-900/20 hover:scale-105 transition-all' : 'text-gray-700'}`}
                                        onClick={() => row.N > 0 && handleCeldaClick(row.mes, 'N')}
                                    >
                                        {row.N || '—'}
                                    </td>
                                    <td
                                        className={`px-4 py-4 text-center font-mono ${row.T > 0 ? 'text-orange-400 font-bold cursor-pointer hover:bg-orange-900/20 hover:scale-105 transition-all' : 'text-gray-700'}`}
                                        onClick={() => row.T > 0 && handleCeldaClick(row.mes, 'T')}
                                    >
                                        {row.T || '—'}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-indigo-400 font-mono bg-gray-900/30">
                                        {row.total}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-[#0B0E14] border-t border-gray-800">
                            <td className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">TOTAL</td>
                            <td className="px-4 py-4 text-center font-bold text-emerald-500 font-mono">{resumen.reduce((sum, r) => sum + r.I, 0)}</td>
                            <td className="px-4 py-4 text-center font-bold text-rose-500 font-mono">{resumen.reduce((sum, r) => sum + r.E, 0)}</td>
                            <td className="px-4 py-4 text-center font-bold text-blue-500 font-mono">{resumen.reduce((sum, r) => sum + r.P, 0)}</td>
                            <td className="px-4 py-4 text-center font-bold text-purple-500 font-mono">{resumen.reduce((sum, r) => sum + r.N, 0)}</td>
                            <td className="px-4 py-4 text-center font-bold text-orange-500 font-mono">{resumen.reduce((sum, r) => sum + r.T, 0)}</td>
                            <td className="px-6 py-4 text-center font-bold text-indigo-400 font-mono bg-gray-900/50 shadow-inner">
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
