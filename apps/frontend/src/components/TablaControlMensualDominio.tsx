import { useState } from 'react';
import { ResumenMes } from '../hooks/useMetricasDominio';
// import { DetalleCFDI } from '../hooks/useMetricasDominio'; // Assuming interface might be needed or local
import ModalAuditoria1x1 from './auditoria/ModalAuditoria1x1';

/* --- INTERFACES --- */


interface TablaControlMensualDominioProps {
    resumen: ResumenMes[];
    dominio: string | null;
    loading: boolean;
    periodoLabel?: string;
    totalHistorico?: number;
    onLimpiarFiltros?: () => void;
    // Props de contexto para auditoría
    empresaId: string | null;
    rol: 'EMISOR' | 'RECEPTOR' | null;
    tipo: string | null;
}

export const TablaControlMensualDominio: React.FC<TablaControlMensualDominioProps> = ({
    resumen,
    dominio,
    loading,
    periodoLabel,
    totalHistorico = 0,
    onLimpiarFiltros,
    empresaId,
    rol,
    tipo
}) => {
    // --- ESTADO LOCAL MODAL AUDITORÍA 1x1 (NUEVO) ---
    const [showModalAuditoria, setShowModalAuditoria] = useState(false);
    const [mesAuditoria, setMesAuditoria] = useState<string | null>(null);
    const [dominioAuditoria, setDominioAuditoria] = useState<'emitidos' | 'recibidos'>('recibidos');
    const [tipoAuditoria, setTipoAuditoria] = useState<'ingresos' | 'egresos' | 'nomina' | 'pagos'>('ingresos');

    // --- HANDLERS ---
    const handleAuditar = (mes: string) => {
        if (!empresaId || !rol || !tipo) return;

        // Mapear rol a dominio
        const dominio: 'emitidos' | 'recibidos' = rol === 'EMISOR' ? 'emitidos' : 'recibidos';

        // Mapear tipo a categoría
        const tipoMap: Record<string, 'ingresos' | 'egresos' | 'nomina' | 'pagos'> = {
            'I': 'ingresos',
            'E': 'egresos',
            'N': 'nomina',
            'P': 'pagos'
        };
        const tipoCategoria = tipoMap[tipo] || 'ingresos';

        setMesAuditoria(mes);
        setDominioAuditoria(dominio);
        setTipoAuditoria(tipoCategoria);
        setShowModalAuditoria(true);
    };

    // --- UTILS ---
    const formatCurrency = (amount: number, currency: string = 'MXN') => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    // --- RENDERS ---

    if (loading) {
        return (
            <div className="card border border-gray-100 bg-white p-6 animate-pulse">
                {/* Skeleton Loader */}
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
            </div>
        );
    }

    const totalCantidadVisible = resumen ? resumen.reduce((acc, curr) => acc + curr.total, 0) : 0;
    const totalImporteVisible = resumen ? resumen.reduce((acc, curr) => acc + curr.importe_total, 0) : 0;

    return (
        <>
            {/* --- TABLA PRINCIPAL (DASHBOARD) --- */}
            <div className="fiscal-card overflow-hidden relative">
                {/* Header de Auditoría SAT-Grade */}
                <div className="px-6 py-4 border-b border-gray-800 bg-[#0B0E14]/50 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                                📅 Control Mensual: <span className="text-indigo-400 font-mono tracking-tight">
                                    {rol === 'EMISOR'
                                        ? 'INGRESOS (IVA Trasladado)'
                                        : 'GASTOS (IVA Acreditable)'}
                                </span>
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                                {rol === 'EMISOR' ? 'VENTAS' : 'DEDUCCIONES'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                            {totalHistorico > 0
                                ? `Mostrando registros del periodo activo.`
                                : 'Repositorio vacío.'}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">Acumulado Visible</div>
                        <div className="text-xl font-bold text-emerald-400 font-mono tracking-tight text-shadow-sm">{formatCurrency(totalImporteVisible)}</div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-[10px] text-gray-500 uppercase bg-[#0B0E14] border-b border-gray-800">
                            <tr>
                                <th className="px-6 py-3 font-bold tracking-wider text-gray-400">Mes</th>
                                <th className="px-6 py-3 text-center font-bold tracking-wider text-gray-400">Total CFDI</th>
                                <th className="px-6 py-3 text-right font-bold tracking-wider text-gray-400">Importe</th>
                                <th className="px-6 py-3 text-center font-bold tracking-wider text-gray-400">
                                    {dominio === 'NOMINA' ? 'Empleados' : 'Entidades'}
                                </th>
                                <th className="px-6 py-3 text-center font-bold tracking-wider text-gray-400">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 bg-transparent">
                            {resumen && resumen.length > 0 ? (
                                resumen.map((row) => (
                                    <tr key={row.mes} className="bg-transparent hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-200 whitespace-nowrap font-mono text-xs">
                                            {row.mes}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-300 border border-gray-700">
                                                {row.total}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-400 font-mono text-xs">
                                            {formatCurrency(row.importe_total)}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-500 text-xs">
                                            {row.clientes} Únicos
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleAuditar(row.mes)}
                                                className="text-indigo-400 hover:text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 mx-auto border border-indigo-500/30 hover:bg-indigo-600 hover:border-indigo-500 rounded px-3 py-1.5 transition-all shadow-lg hover:shadow-indigo-500/20"
                                            >
                                                <span>🔍</span> AUDITAR 1x1
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center bg-gray-900/20">
                                        <div className="max-w-md mx-auto">
                                            {totalHistorico > 0 ? (
                                                <>
                                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-900/20 mb-4 border border-yellow-700/30">
                                                        <span className="text-xl text-yellow-500">🔍</span>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-gray-300">No hay resultados en este periodo</h3>
                                                    <p className="text-xs text-gray-600 mt-2">
                                                        El filtro <strong>{periodoLabel}</strong> no muestra datos, pero existen <strong className="text-indigo-400">{totalHistorico}</strong> históricos.
                                                    </p>
                                                    {onLimpiarFiltros && (
                                                        <button
                                                            onClick={onLimpiarFiltros}
                                                            className="mt-6 inline-flex items-center px-4 py-2 border border-indigo-500/50 text-xs font-bold uppercase tracking-wider rounded text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                                                        >
                                                            Ver Histórico Completo
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-800/50 mb-4 border border-gray-700">
                                                        <span className="text-xl opacity-50">📂</span>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-gray-400">Sin historial registrado</h3>
                                                    <p className="text-xs text-gray-600 mt-1">
                                                        No existen CFDI registrados para este dominio.
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-[#0B0E14] font-bold text-gray-300 border-t border-gray-800">
                            <tr>
                                <td className="px-6 py-4 uppercase text-[10px] tracking-widest text-gray-500">Total Visible</td>
                                <td className="px-6 py-4 text-center font-mono text-xs">{totalCantidadVisible}</td>
                                <td className="px-6 py-4 text-right font-mono text-sm text-emerald-400">{formatCurrency(totalImporteVisible)}</td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="bg-[#0B0E14] px-6 py-3 border-t border-gray-800 flex items-start gap-2">
                    <span className="text-gray-600 mt-0.5 text-xs">ℹ️</span>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-mono">
                        {totalHistorico > 0
                            ? `VISTA FILTRADA. EL SISTEMA CUSTODIA ${totalHistorico} REGISTROS HISTÓRICOS EN BÓVEDA.`
                            : 'MODO DE ESPERA. CARGUE ARCHIVOS PARA ACTIVAR LA AUDITORÍA.'}
                    </p>
                </div>
            </div>

            {/* --- MODAL AUDITORÍA 1x1 (NUEVO - DEFENSA FISCAL SAT) --- */}
            {showModalAuditoria && mesAuditoria && empresaId && (
                <ModalAuditoria1x1
                    mes={mesAuditoria}
                    empresaId={empresaId}
                    dominio={dominioAuditoria}
                    tipo={tipoAuditoria}
                    onClose={() => setShowModalAuditoria(false)}
                />
            )}
        </>
    );
};
