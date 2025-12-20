import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ResumenMes } from '../hooks/useMetricasDominio';

/* --- INTERFACES --- */

interface DetalleCFDI {
    uuid: string;
    fecha: string;
    serie: string;
    folio: string;
    emisor_rfc: string;
    emisor_nombre: string;
    receptor_rfc: string;
    receptor_nombre: string;
    moneda: string;
    tipo_cambio: number;
    subtotal: number;
    total: number;
    tipo_comprobante: string;
    estado_sat: string;
}

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
    // --- ESTADO LOCAL MODAL AUDITORÍA ---
    const [showModal, setShowModal] = useState(false);
    const [detalleMes, setDetalleMes] = useState<string | null>(null);
    const [listaDetalle, setListaDetalle] = useState<DetalleCFDI[]>([]);
    const [loadingDetalle, setLoadingDetalle] = useState(false);
    const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

    // --- UTILS ---
    const formatCurrency = (amount: number, currency: string = 'MXN') => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Podríamos mostrar un toast aquí
    };

    // --- HANDLERS ---
    const handleAuditar = async (mes: string) => {
        if (!empresaId || !rol || !tipo) return;

        setDetalleMes(mes);
        setShowModal(true);
        setLoadingDetalle(true);
        setErrorDetalle(null);
        setListaDetalle([]); // Limpiar previo

        try {
            const res = await axios.get('/api/cfdi/auditoria/detalle', {
                params: {
                    empresaId,
                    rol,
                    tipo,
                    mes
                }
            });
            setListaDetalle(res.data);
        } catch (error) {
            console.error('Error cargando detalle:', error);
            setErrorDetalle('No se pudo recuperar el listado de comprobantes. Verifique su conexión.');
        } finally {
            setLoadingDetalle(false);
        }
    };

    const handleExportarExcel = () => {
        if (listaDetalle.length === 0) return;

        // Mapeo robusto y limpio para reporte profesional
        const dataExport = listaDetalle.map(item => {
            const tc = item.tipo_cambio && item.tipo_cambio > 0 ? item.tipo_cambio : 1;
            const isForeign = item.moneda && item.moneda !== 'MXN' && item.moneda !== 'XXX';

            return {
                "Fecha": item.fecha ? item.fecha.split('T')[0] : '', // YYYY-MM-DD
                "RFC Emisor": item.emisor_rfc,
                "RFC Receptor": item.receptor_rfc,
                "UUID": item.uuid,
                "Tipo": item.tipo_comprobante,
                "Importe MXN": isForeign ? (item.total * tc) : item.total, // Siempre valor en pesos
                "Importe USD/Ext": isForeign ? item.total : 0, // Solo valor original si es extranjero
                "Moneda": item.moneda || 'MXN',
                "Tipo Cambio": tc,
                "Estatus SAT": item.estado_sat || 'Vigente'
            };
        });

        // 1. Crear Hoja y Libro
        const ws = XLSX.utils.json_to_sheet(dataExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Auditoria_1x1");

        // 2. Agregar Notas Forenses (al final)
        XLSX.utils.sheet_add_aoa(ws, [
            [],
            ["--- REPORTE DE AUDITORÍA FORENSE 1x1 ---"],
            ["Generado por: Kontify Sentinel"],
            ["Los importes en moneda extranjera se muestran en su columna específica."],
            ["La conversión a MXN es referencial basada en el TC del documento."],
            ["Los XML originales permanecen intactos en la bóveda digital."]
        ], { origin: -1 });

        // 3. Generar Buffer Binario (ArrayBuffer) con tipo correcto
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

        // 4. Crear Blob con MIME Type de Excel Oficial
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // 5. Forzar Descarga con Nombre Humano
        const cleanEmpresa = empresaId ? empresaId.replace('empresa-', '') : 'Empresa';
        const cleanMes = detalleMes || 'Periodo';
        const fileName = `Auditoria_1x1_${cleanEmpresa.toUpperCase()}_${cleanMes}.xlsx`;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName; // <--- ESTO ASEGURA EL NOMBRE Y EXTENSIÓN
        document.body.appendChild(a);
        a.click();

        // 6. Limpieza
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">
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
                                <th className="px-6 py-3 text-center font-bold text-gray-700">Acciones</th>
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
                                            <button
                                                onClick={() => handleAuditar(row.mes)}
                                                className="text-blue-600 hover:text-blue-900 text-xs font-bold flex items-center justify-center gap-1 mx-auto border border-blue-200 hover:border-blue-400 hover:bg-white rounded px-3 py-1.5 transition-all shadow-sm"
                                            >
                                                <span>🔍</span> AUDITAR 1x1
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center bg-gray-50/30">
                                        <div className="max-w-md mx-auto">
                                            {totalHistorico > 0 ? (
                                                <>
                                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                                                        <span className="text-2xl">🔍</span>
                                                    </div>
                                                    <h3 className="text-lg font-bold text-gray-900">No hay resultados en este periodo</h3>
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        El filtro <strong>{periodoLabel}</strong> no muestra datos, pero existen <strong className="text-indigo-600">{totalHistorico}</strong> históricos.
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
                                                <>
                                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-200 mb-4">
                                                        <span className="text-2xl">📂</span>
                                                    </div>
                                                    <h3 className="text-lg font-medium text-gray-900">Sin historial registrado</h3>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        No existen CFDI registrados para este dominio.
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
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="bg-indigo-50 px-6 py-3 border-t border-indigo-100 flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">ℹ️</span>
                    <p className="text-xs text-indigo-800 leading-relaxed">
                        {totalHistorico > 0
                            ? `Vista filtrada. El sistema custodia ${totalHistorico} registros históricos.`
                            : 'Modo de espera. Cargue archivos para activar la auditoría.'}
                    </p>
                </div>
            </div>

            {/* --- MODAL DETALLE 1x1 V2 (COMPACTO & FORENSE) --- */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">

                            {/* Header */}
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-200 flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg leading-6 font-bold text-gray-900">
                                        Auditoría Forense 1x1: <span className="text-indigo-600">{detalleMes}</span>
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Dominio: <strong>{dominio}</strong> ({tipo}) | Rol: <strong>{rol}</strong> | Total Registros: <strong>{listaDetalle.length}</strong>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleExportarExcel}
                                        disabled={loadingDetalle || listaDetalle.length === 0}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        ⬇️ Exportar Excel
                                    </button>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-gray-400 hover:text-gray-500"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Body (Tabla Compacta) */}
                            <div className="bg-gray-50 px-4 py-4 sm:p-6 h-[65vh] overflow-y-auto">
                                {loadingDetalle ? (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                                        <p className="mt-4 text-gray-600">Recuperando evidencia XML...</p>
                                    </div>
                                ) : errorDetalle ? (
                                    <div className="flex flex-col items-center justify-center h-full text-red-600">
                                        <span className="text-4xl">⚠️</span>
                                        <p className="mt-2 font-bold">{errorDetalle}</p>
                                    </div>
                                ) : listaDetalle.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <p>No se encontraron registros indexados para este periodo.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white shadow overflow-auto border-b border-gray-200 sm:rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200 relative">
                                            <thead className="bg-gray-100 sticky top-0 z-10">
                                                <tr className="shadow-sm">
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Fecha</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">UUID (Folio)</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Emisor</th>
                                                    <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">Receptor</th>
                                                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Tipo</th>
                                                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Moneda</th>
                                                    <th className="px-3 py-2 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Importe Original</th>
                                                    <th className="px-3 py-2 text-right text-xs font-bold text-gray-700 uppercase tracking-wider text-gray-400">TC</th>
                                                    <th className="px-3 py-2 text-right text-xs font-bold text-gray-700 uppercase tracking-wider text-indigo-600">Importe MXN (Ref)</th>
                                                    <th className="px-3 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">SAT</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {listaDetalle.map((cfdi) => {
                                                    const tc = cfdi.tipo_cambio || 1;
                                                    const totalMXN = cfdi.total * tc;
                                                    return (
                                                        <tr key={cfdi.uuid} className="hover:bg-blue-50 transition-colors text-xs">
                                                            <td className="px-3 py-2 whitespace-nowrap text-gray-900 font-mono">
                                                                {cfdi.fecha ? cfdi.fecha.split('T')[0] : 'N/D'}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-gray-500 font-mono cursor-pointer hover:text-indigo-600" onClick={() => copyToClipboard(cfdi.uuid)} title="Copiar UUID">
                                                                {cfdi.uuid.split('-')[0]}...
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 font-mono truncate max-w-[120px]" title={cfdi.emisor_rfc}>
                                                                {cfdi.emisor_rfc}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-gray-600 font-mono truncate max-w-[120px]" title={cfdi.receptor_rfc}>
                                                                {cfdi.receptor_rfc}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-center">
                                                                <span className={`px-2 inline-flex text-[10px] leading-4 font-semibold rounded-full ${cfdi.tipo_comprobante === 'I' ? 'bg-green-100 text-green-800' :
                                                                    cfdi.tipo_comprobante === 'E' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {cfdi.tipo_comprobante}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-center font-bold text-gray-700">
                                                                {cfdi.moneda || 'MXN'}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-right font-mono font-medium text-gray-900">
                                                                {formatCurrency(cfdi.total, cfdi.moneda || 'MXN')}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-gray-400 text-[10px]">
                                                                {cfdi.moneda !== 'MXN' && tc !== 1 ? tc.toFixed(4) : '-'}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-right font-mono font-bold text-indigo-700 bg-indigo-50/50">
                                                                {formatCurrency(totalMXN, 'MXN')}
                                                            </td>
                                                            <td className="px-3 py-2 whitespace-nowrap text-center">
                                                                {cfdi.estado_sat === 'Vigente' || !cfdi.estado_sat ? (
                                                                    <span className="text-green-600 font-bold text-[10px]">VIGENTE</span>
                                                                ) : (
                                                                    <span className="text-red-600 font-bold text-[10px]">{cfdi.estado_sat.toUpperCase()}</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Footer informativo */}
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 border-t border-gray-200">
                                <p className="text-xs text-gray-400 text-center">
                                    Los XML originales permanecen intactos. La plataforma solo interpreta y presenta información. No existe alteración fiscal de los comprobantes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
