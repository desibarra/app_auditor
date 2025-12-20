import React from 'react';
import { ResumenMes } from '../hooks/useMetricasDominio';

interface TablaControlMensualDominioProps {
    resumen: ResumenMes[];
    dominio: string | null;
    loading: boolean;
    periodoLabel?: string;
    totalHistorico?: number;
    onLimpiarFiltros?: () => void;
}

export const TablaControlMensualDominio: React.FC<TablaControlMensualDominioProps> = ({
    resumen,
    dominio,
    loading,
    periodoLabel,
    totalHistorico = 0,
    onLimpiarFiltros
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="card border border-gray-100 bg-white p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
        );
    }

    // Totales de auditoría visibles en la vista actual
    const totalCantidadVisible = resumen ? resumen.reduce((acc, curr) => acc + curr.total, 0) : 0;
    const totalImporteVisible = resumen ? resumen.reduce((acc, curr) => acc + curr.importe_total, 0) : 0;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header de Auditoría SAT-Grade */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            📅 Control Mensual: <span className="text-blue-700">{dominio || 'DETALLE'}</span>
                        </h3>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            SAT-Grade
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        {totalHistorico > 0
                            ? `Mostrando registros del periodo activo.`
                            : 'Repositorio vacío.'}
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Acumulado Visible</div>
                    <div className="text-xl font-bold text-gray-900 font-mono tracking-tight">{formatCurrency(totalImporteVisible)}</div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-bold text-gray-700">Mes</th>
                            <th className="px-6 py-3 text-center font-bold text-gray-700">Total CFDI</th>
                            <th className="px-6 py-3 text-right font-bold text-gray-700">Importe</th>
                            <th className="px-6 py-3 text-center font-bold text-gray-700">
                                {dominio === 'NOMINA' ? 'Empleados' : 'Entidades'}
                            </th>
                            <th className="px-6 py-3 text-center font-bold text-gray-700">Auditoría</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {resumen && resumen.length > 0 ? (
                            resumen.map((row) => (
                                <tr key={row.mes} className="bg-white hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4 font-semibold text-gray-900 whitespace-nowrap font-mono">
                                        {row.mes}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {row.total}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900 font-mono">
                                        {formatCurrency(row.importe_total)}
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-600">
                                        {row.clientes} Únicos
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="text-blue-600 hover:text-blue-900 text-xs font-medium flex items-center justify-center gap-1 mx-auto border border-transparent hover:border-blue-200 rounded px-2 py-1 transition-all">
                                            <span>🔍</span> Auditar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="py-16 text-center bg-gray-50/30">
                                    <div className="max-w-md mx-auto">
                                        {totalHistorico > 0 ? (
                                            // CASO A: HAY DATOS HISTÓRICOS, PERO FILTRO LOS OCULTA
                                            <>
                                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                                                    <span className="text-2xl">🔍</span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-900">No hay resultados en este periodo</h3>
                                                <p className="text-sm text-gray-600 mt-2">
                                                    El filtro <strong>{periodoLabel}</strong> no coincide con ningún registro, pero existen <strong className="text-indigo-600">{totalHistorico} Comprobantes</strong> históricos en {dominio}.
                                                </p>
                                                {onLimpiarFiltros && (
                                                    <button
                                                        onClick={onLimpiarFiltros}
                                                        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                    >
                                                        Ver Histórico Completo
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            // CASO B: REALMENTE NO HAY DATOS
                                            <>
                                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-200 mb-4">
                                                    <span className="text-2xl">📂</span>
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900">Sin historial registrado</h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    No se han encontrado CFDI de tipo <strong>{dominio}</strong> en toda la base de datos de esta empresa.
                                                </p>
                                                <p className="text-xs text-gray-400 mt-4">
                                                    Sube tus archivos XML para comenzar.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold text-gray-900 border-t-2 border-gray-200">
                        <tr>
                            <td className="px-6 py-4 uppercase text-xs">Total Visible</td>
                            <td className="px-6 py-4 text-center">{totalCantidadVisible}</td>
                            <td className="px-6 py-4 text-right font-mono text-lg">{formatCurrency(totalImporteVisible)}</td>
                            <td className="px-6 py-4"></td>
                            <td className="px-6 py-4"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="bg-indigo-50 px-6 py-3 border-t border-indigo-100 flex items-start gap-2">
                <span className="text-indigo-600 mt-0.5">ℹ️</span>
                <p className="text-xs text-indigo-800 leading-relaxed">
                    {totalHistorico > 0
                        ? `Vista filtrada. El sistema custodia un total de ${totalHistorico} registros históricos para este dominio.`
                        : 'Modo de espera. Cargue archivos para activar la auditoría.'}
                </p>
            </div>
        </div>
    );
};
