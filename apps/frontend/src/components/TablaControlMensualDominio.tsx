import { useState } from 'react';
import axios from 'axios';
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
    // Props de contexto para auditoría
    empresaId: string | null;
    rol: 'EMISOR' | 'RECEPTOR' | null;
    tipo: string | null;
    onSyncComplete?: () => void;
}

export const TablaControlMensualDominio: React.FC<TablaControlMensualDominioProps> = ({
    resumen,
    dominio,
    loading,
    periodoLabel,
    totalHistorico = 0,
    empresaId,
    rol,
    tipo,
    onSyncComplete
}) => {
    // --- ESTADO LOCAL MODAL AUDITORÍA 1x1 (NUEVO) ---
    const [showModalAuditoria, setShowModalAuditoria] = useState(false);
    const [mesAuditoria, setMesAuditoria] = useState<string | null>(null);
    const [dominioAuditoria, setDominioAuditoria] = useState<'emitidos' | 'recibidos'>('recibidos');
    const [tipoAuditoria, setTipoAuditoria] = useState<'ingresos' | 'egresos' | 'nomina' | 'pagos'>('ingresos');
    const [syncingMes, setSyncingMes] = useState<string | null>(null);

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

    const handleSyncMes = async (mesLabel: string) => {
        if (!empresaId) return;

        // El mesLabel viene como "MM/YYYY" o "YYYY-MM"
        // Intentar normalizar a YYYY-MM para el SAT
        let periodoSync = mesLabel;
        if (mesLabel.includes('/')) {
            const [m, a] = mesLabel.split('/');
            periodoSync = `${a}-${m.padStart(2, '0')}`;
        }

        try {
            setSyncingMes(mesLabel);
            const res = await axios.post('/api/cfdi/sincronizar-sat', {
                empresaId,
                periodo: periodoSync
            });

            const { resumen } = res.data;
            alert(`✅ Mes ${mesLabel} sincronizado.\n\nProcesados: ${resumen.procesados}\nCambios detectados: ${resumen.totalCambios}`);

            // Disparar actualización y abrir bitácora
            if (onSyncComplete) onSyncComplete();
        } catch (e: any) {
            console.error('Error Sync Mes:', e);
            alert('Error al sincronizar el mes seleccionado.');
        } finally {
            setSyncingMes(null);
        }
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
            <div className="overflow-hidden">
                {/* Header de Auditoría SAT-Grade */}
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                                <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">📊</span>
                                Control Mensual: <span className="text-indigo-600 font-mono">
                                    {rol === 'EMISOR'
                                        ? 'INGRESOS (IVA Trasladado)'
                                        : 'GASTOS (IVA Acreditable)'}
                                </span>
                            </h3>
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] bg-indigo-50 text-indigo-600 border border-indigo-100">
                                {rol === 'EMISOR' ? 'Ventas' : 'Deducciones'}
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-widest font-black">
                            {totalHistorico > 0
                                ? `Mostrando registros del periodo activo fiscal`
                                : 'Repositorio en espera de documentos'}
                        </p>
                    </div>
                    <div className="text-right bg-white p-4 rounded-2xl border border-slate-100 shadow-sm min-w-[200px]">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acumulado Visible</div>
                        <div className="text-2xl font-black text-emerald-600 font-mono tracking-tighter">{formatCurrency(totalImporteVisible)}</div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-slate-400 uppercase bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-4 font-black tracking-widest">Periodo Mes</th>
                                <th className="px-8 py-4 text-center font-black tracking-widest">Volumen CFDI</th>
                                <th className="px-8 py-4 text-right font-black tracking-widest">Importe Fiscal</th>
                                <th className="px-8 py-4 text-center font-black tracking-widest">
                                    {dominio === 'NOMINA' ? 'Empleados' : 'Entidades'}
                                </th>
                                <th className="px-8 py-4 text-center font-black tracking-widest">Estatus Gestión</th>
                                <th className="px-8 py-4 text-center font-black tracking-widest">Acciones Auditoría</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {resumen && resumen.length > 0 ? (
                                resumen.map((row) => {
                                    const tieneDatos = row.total > 0;
                                    const esMesActivo = periodoLabel && (row.mes === periodoLabel || row.mes.includes(periodoLabel.split('/').reverse().join('-')));

                                    return (
                                        <tr
                                            key={row.mes}
                                            className={`transition-all duration-200 ${esMesActivo ? 'bg-indigo-50/30' : 'bg-transparent'
                                                } ${tieneDatos ? 'hover:bg-slate-50/80 cursor-default' : 'opacity-50'}`}
                                        >
                                            <td className="px-8 py-5 font-black text-slate-700 whitespace-nowrap font-mono text-xs">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${esMesActivo ? 'bg-indigo-500 animate-pulse' : 'bg-slate-200'}`}></div>
                                                    {row.mes}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black border ${tieneDatos
                                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                                    : 'bg-transparent text-slate-300 border-slate-100'
                                                    }`}>
                                                    {row.total} XML
                                                </span>
                                            </td>
                                            <td className={`px-8 py-5 text-right font-black font-mono text-sm ${tieneDatos ? 'text-emerald-600' : 'text-slate-300'
                                                }`}>
                                                {formatCurrency(row.importe_total)}
                                            </td>
                                            <td className={`px-8 py-5 text-center text-[11px] font-bold ${tieneDatos ? 'text-slate-500' : 'text-slate-300'
                                                }`}>
                                                {tieneDatos ? `${row.clientes} Únicos` : '---'}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                {tieneDatos ? (
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <span title="Vigentes" className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[9px] font-black border border-emerald-100">V: {row.count_vigentes}</span>
                                                        <span title="Cancelados" className={`px-2 py-1 rounded-md text-[9px] font-black border ${row.count_cancelados > 0 ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : 'bg-slate-50 text-slate-300 border-transparent'}`}>C: {row.count_cancelados}</span>
                                                        <span title="Pendientes" className={`px-2 py-1 rounded-md text-[9px] font-black border ${row.count_pendientes > 0 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-300 border-transparent'}`}>P: {row.count_pendientes}</span>
                                                    </div>
                                                ) : '---'}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={() => tieneDatos && handleAuditar(row.mes)}
                                                        disabled={!tieneDatos}
                                                        className={`text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto border rounded-xl px-5 py-2 transition-all ${tieneDatos
                                                            ? 'text-indigo-600 border-indigo-200 bg-white hover:bg-indigo-600 hover:text-white hover:border-indigo-600 shadow-sm hover:shadow-indigo-500/20'
                                                            : 'text-slate-300 border-slate-100 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        <span>🔍</span> Auditar
                                                    </button>
                                                    <button
                                                        onClick={() => tieneDatos && handleSyncMes(row.mes)}
                                                        disabled={!tieneDatos || syncingMes === row.mes}
                                                        className={`text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 mx-auto border rounded-xl px-5 py-2 transition-all ${tieneDatos
                                                            ? 'text-emerald-600 border-emerald-200 bg-white hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                                                            : 'text-slate-300 border-slate-100 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        {syncingMes === row.mes ? (
                                                            <span className="animate-spin">⏳</span>
                                                        ) : (
                                                            <span>📡</span>
                                                        )}
                                                        Validar SAT
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center bg-slate-50/20">
                                        <div className="max-w-md mx-auto">
                                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-3xl bg-white shadow-xl shadow-slate-200/50 mb-6 border border-slate-100">
                                                <span className="text-2xl">📂</span>
                                            </div>
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Sin registros detectados</h3>
                                            <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
                                                No se encontraron documentos CFDI procesados para esta combinación de parámetros en la bóveda.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-slate-50/50 font-bold text-slate-600 border-t border-slate-100">
                            <tr>
                                <td className="px-8 py-5 uppercase text-[10px] font-black tracking-[0.2em] text-slate-400">Total Analizado</td>
                                <td className="px-8 py-5 text-center font-mono text-sm font-black">{totalCantidadVisible}</td>
                                <td className="px-8 py-5 text-right font-mono text-lg font-black text-emerald-600">{formatCurrency(totalImporteVisible)}</td>
                                <td colSpan={3}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="bg-indigo-50/30 px-8 py-4 border-t border-slate-100 flex items-center gap-3">
                    <span className="text-indigo-400 text-sm">🛡️</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-mono uppercase tracking-tight font-black">
                        {totalHistorico > 0
                            ? `Protocolo de seguridad activo: El sistema custodia ${totalHistorico} registros históricos bajo encriptación forense.`
                            : 'Protocolo en espera: Cargue archivos XML para iniciar el análisis automático de riesgos.'}
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
