/**
 * 📊 TABLA DE CONTROL MENSUAL - CFDI EMITIDOS
 * ============================================
 * 
 * Muestra resumen mensual de CFDIs EMITIDOS por la empresa
 * - Independiente de filtros
 * - Columnas: Mes | Ingresos (I) | Total $ | Clientes
 * - Query base: emisor_rfc = empresa.rfc
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ResumenMensualEmitido {
    mes: string;
    I: number;
    E: number;
    P: number;
    N: number;
    T: number;
    total: number;
    importe_total: number;
    clientes: number;
}

interface TablaControlEmitidosProps {
    empresaId: string | null;
    refreshTrigger?: number;
}

export const TablaControlEmitidos: React.FC<TablaControlEmitidosProps> = ({
    empresaId,
    refreshTrigger = 0
}) => {
    const [resumen, setResumen] = useState<ResumenMensualEmitido[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResumen = async () => {
            if (!empresaId) {
                setResumen([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const response = await axios.get('/api/cfdi/emitidos/resumen-mensual', {
                    params: { empresaId }
                });

                if (response.data.success) {
                    setResumen(response.data.resumen);
                } else {
                    setError('Error al cargar resumen de emitidos');
                }
            } catch (err: any) {
                console.error('[TablaControlEmitidos] Error:', err);
                setError('Error al cargar resumen mensual de emitidos');
            } finally {
                setLoading(false);
            }
        };

        fetchResumen();
    }, [empresaId, refreshTrigger]);

    const formatMes = (mes: string) => {
        const [year, month] = mes.split('-');
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return `${meses[parseInt(month) - 1]} ${year}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="tabla-control-emitidos">
                <h3 className="titulo">📊 Control Mensual de CFDI EMITIDOS</h3>
                <div className="tabla-control-loading">
                    <div className="spinner"></div>
                    <p>Cargando resumen mensual...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tabla-control-emitidos">
                <h3 className="titulo">📊 Control Mensual de CFDI EMITIDOS</h3>
                <div className="tabla-control-error">
                    <p>⚠️ {error}</p>
                </div>
            </div>
        );
    }

    if (!empresaId || resumen.length === 0) {
        return (
            <div className="tabla-control-emitidos">
                <h3 className="titulo">📊 Control Mensual de CFDI EMITIDOS</h3>
                <div className="tabla-control-vacia">
                    <p>📂 Sin CFDIs emitidos registrados</p>
                    <p className="text-sm">Sube XMLs emitidos para ver el resumen aquí</p>
                </div>
            </div>
        );
    }

    // Calcular totales generales
    const totales = resumen.reduce((acc, row) => ({
        total: acc.total + row.total,
        importe: acc.importe + row.importe_total,
    }), { total: 0, importe: 0 });

    return (

        <div className="fiscal-card overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-800 bg-[#0B0E14]/50 backdrop-blur-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                            📊 Control Mensual de CFDI EMITIDOS
                        </h3>
                        <p className="text-sm text-gray-400 mt-1 font-mono">
                            {resumen.length} meses • {totales.total} CFDIs • <span className="text-emerald-400 font-bold">{formatCurrency(totales.importe)}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-900/50">
                            Ingresos
                        </span>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-[#0B0E14] border-b border-gray-800">
                            <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-wider text-xs">Mes</th>
                            <th className="px-4 py-4 text-center font-bold text-emerald-500 uppercase tracking-wider text-xs" title="Ingresos">I</th>
                            <th className="px-4 py-4 text-right font-bold text-emerald-400 uppercase tracking-wider text-xs">Total $</th>
                            <th className="px-4 py-4 text-center font-bold text-indigo-500 uppercase tracking-wider text-xs">Clientes</th>
                            <th className="px-6 py-4 text-center font-bold text-gray-400 uppercase tracking-wider text-xs bg-gray-900/50">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {resumen.map((row) => (
                            <tr key={row.mes} className="hover:bg-gray-800/30 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-gray-300 font-mono">
                                    {formatMes(row.mes)}
                                </td>
                                <td className={`px-4 py-4 text-center font-mono ${row.I > 0 ? 'text-emerald-400 font-bold' : 'text-gray-700'}`}>
                                    {row.I || '—'}
                                </td>
                                <td className="px-4 py-4 text-right font-bold text-emerald-400 font-mono tracking-tight">
                                    {formatCurrency(row.importe_total)}
                                </td>
                                <td className="px-4 py-4 text-center font-bold text-indigo-400 font-mono">
                                    {row.clientes}
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-gray-300 font-mono bg-gray-900/30">
                                    {row.total}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-[#0B0E14] border-t border-gray-800">
                            <td className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">TOTAL ANUAL</td>
                            <td className="px-4 py-4 text-center font-bold text-emerald-500 font-mono">
                                {totales.total}
                            </td>
                            <td className="px-4 py-4 text-right font-bold text-emerald-500 font-mono text-base border-t border-emerald-900/30 shadow-[0_-2px_10px_rgba(16,185,129,0.1)]">
                                {formatCurrency(totales.importe)}
                            </td>
                            <td className="px-4 py-4 text-center text-gray-600 font-mono">—</td>
                            <td className="px-6 py-4 text-center font-bold text-gray-300 font-mono bg-gray-900/50 shadow-inner">
                                {totales.total}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default TablaControlEmitidos;
