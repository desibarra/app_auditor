import React, { useState, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ResumenMes } from '../hooks/useMetricasDominio';
import ListaEvidencias from './ListaEvidencias';
import UploadEvidencia from './UploadEvidencia';
import XmlVisorModal from './XmlVisorModal';
import { DEMO_CFDI_LIST } from '../data/demoData';

const USE_DEMO_MODE = false; // ACTIVAR MODO DEMO - SENTINEL

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

    // --- FORENSIC STATE ---
    const [filters, setFilters] = useState({
        fechaInicio: '',
        fechaFin: '',
        emisor: '',
        receptor: '',
        moneda: 'Todas',
        montoMin: '',
        montoMax: '',
        estatus: 'Todos'
    });
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'fecha', direction: 'desc' });
    const [pagination, setPagination] = useState({ currentPage: 1, itemsPerPage: 10 });

    // --- ESTADO MODAL EVIDENCIAS (Materialidad) ---
    const [auditandoUuid, setAuditandoUuid] = useState<string | null>(null);
    const [auditandoTipo, setAuditandoTipo] = useState<string | null>(null);
    const [showEvidenciaModal, setShowEvidenciaModal] = useState(false);

    // Visor XML State
    const [selectedXmlUuid, setSelectedXmlUuid] = useState<string | null>(null);

    // --- LOGIC: FILTER & SORT ---
    const processedData = useMemo(() => {
        let data = [...listaDetalle];

        // 1. Filtering
        if (filters.fechaInicio) data = data.filter(i => i.fecha >= filters.fechaInicio);
        if (filters.fechaFin) data = data.filter(i => i.fecha <= filters.fechaFin);
        if (filters.emisor) data = data.filter(i => (i.emisor_nombre || '').toLowerCase().includes(filters.emisor.toLowerCase()) || i.emisor_rfc.toLowerCase().includes(filters.emisor.toLowerCase()));
        if (filters.receptor) data = data.filter(i => (i.receptor_nombre || '').toLowerCase().includes(filters.receptor.toLowerCase()) || i.receptor_rfc.toLowerCase().includes(filters.receptor.toLowerCase()));
        if (filters.moneda !== 'Todas') data = data.filter(i => (i.moneda || 'MXN') === filters.moneda);
        if (filters.estatus !== 'Todos') data = data.filter(i => (i.estado_sat || 'Vigente') === filters.estatus);

        if (filters.montoMin || filters.montoMax) {
            data = data.filter(i => {
                const tc = i.tipo_cambio > 0 ? Number(i.tipo_cambio) : 1;
                const isForeign = i.moneda && i.moneda !== 'MXN' && i.moneda !== 'XXX';
                // Calculamos valor MXN asegurando tipos numéricos
                const val = Number(isForeign ? (Number(i.total) * tc) : Number(i.total));

                if (filters.montoMin && val < Number(filters.montoMin)) return false;
                if (filters.montoMax && val > Number(filters.montoMax)) return false;
                return true;
            });
        }

        // 2. Sorting
        if (sortConfig) {
            data.sort((a, b) => {
                let valA: any = a[sortConfig.key as keyof DetalleCFDI];
                let valB: any = b[sortConfig.key as keyof DetalleCFDI];

                if (sortConfig.key === 'fecha') {
                    valA = new Date(valA || 0).getTime();
                    valB = new Date(valB || 0).getTime();
                }
                if (sortConfig.key === 'total_mxn') {
                    const tcA = a.tipo_cambio > 0 ? Number(a.tipo_cambio) : 1;
                    const isForeignA = a.moneda && a.moneda !== 'MXN' && a.moneda !== 'XXX';
                    valA = Number(isForeignA ? Number(a.total) * tcA : Number(a.total));

                    const tcB = b.tipo_cambio > 0 ? Number(b.tipo_cambio) : 1;
                    const isForeignB = b.moneda && b.moneda !== 'MXN' && b.moneda !== 'XXX';
                    valB = Number(isForeignB ? Number(b.total) * tcB : Number(b.total));
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return data;
    }, [listaDetalle, filters, sortConfig]);

    // --- LOGIC: PAGINATION ---
    const totalPages = Math.ceil(processedData.length / pagination.itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
        return processedData.slice(start, start + pagination.itemsPerPage);
    }, [processedData, pagination]);

    const handleFilterChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    const handleSort = (key: string) => {
        setSortConfig(prev => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'desc' };
        });
    };

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
        // Reset filters when opening new audit
        setFilters({ fechaInicio: '', fechaFin: '', emisor: '', receptor: '', moneda: 'Todas', montoMin: '', montoMax: '', estatus: 'Todos' });
        setPagination(p => ({ ...p, currentPage: 1 }));

        try {
            if (USE_DEMO_MODE) {
                console.log("🛡️ SENTINEL DEMO MODE: Injecting Audit Data");
                setTimeout(() => {
                    // @ts-ignore
                    setListaDetalle(DEMO_CFDI_LIST);
                    setLoadingDetalle(false);
                }, 400);
                return;
            }

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
        if (processedData.length === 0) return;

        // Mapeo robusto y limpio para reporte profesional
        const dataExport = processedData.map(item => {
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
            ["Filtros aplicados: " + JSON.stringify(filters)],
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
        const fileName = `Auditoria_1x1_${cleanEmpresa.toUpperCase()}_${cleanMes}_FILTRADO.xlsx`;

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
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-bold rounded-md text-gray-700 bg-white hover:bg-green-50 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
                                    >
                                        ⬇️ Descargar Excel Forense
                                    </button>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-gray-400 hover:text-gray-500 p-2"
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
                                        <p className="mt-4 text-gray-600">Verificando integridad fiscal...</p>
                                    </div>
                                ) : errorDetalle ? (
                                    <div className="flex flex-col items-center justify-center h-full text-red-600">
                                        <span className="text-4xl">⚠️</span>
                                        <p className="mt-2 font-bold">{errorDetalle}</p>
                                    </div>
                                ) : listaDetalle.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                        <p className="font-medium text-lg">Sin movimientos en este periodo</p>
                                        <p className="text-sm mt-1">El filtro es correcto, simplemente no hubo operaciones registradas en el SAT.</p>
                                    </div>
                                ) : (
                                    <div className="bg-white shadow overflow-auto border-b border-gray-200 sm:rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200 relative">
                                            <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                                                <tr className="divide-x divide-gray-200">
                                                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[140px]">
                                                        <div className="flex items-center cursor-pointer mb-1 hover:text-indigo-600" onClick={() => handleSort('fecha')}>
                                                            Fecha {sortConfig?.key === 'fecha' && ((sortConfig.direction === 'asc') ? '🔼' : '🔽')}
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <input
                                                                type="date"
                                                                className="w-full text-[9px] p-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                                                value={filters.fechaInicio}
                                                                onChange={e => handleFilterChange('fechaInicio', e.target.value)}
                                                            />
                                                            <input
                                                                type="date"
                                                                className="w-full text-[9px] p-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                                                value={filters.fechaFin}
                                                                onChange={e => handleFilterChange('fechaFin', e.target.value)}
                                                            />
                                                        </div>
                                                    </th>
                                                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-24">
                                                        UUID
                                                    </th>
                                                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[120px]">
                                                        Emisor
                                                        <input
                                                            type="text"
                                                            placeholder="Buscar..."
                                                            className="w-full text-[9px] p-0.5 border border-gray-300 rounded mt-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                            value={filters.emisor}
                                                            onChange={e => handleFilterChange('emisor', e.target.value)}
                                                        />
                                                    </th>
                                                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[120px]">
                                                        Receptor
                                                        <input
                                                            type="text"
                                                            placeholder="Buscar..."
                                                            className="w-full text-[9px] p-0.5 border border-gray-300 rounded mt-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                            value={filters.receptor}
                                                            onChange={e => handleFilterChange('receptor', e.target.value)}
                                                        />
                                                    </th>
                                                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                        Tipo
                                                    </th>
                                                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                        Moneda
                                                        <select
                                                            className="w-full text-[9px] p-0.5 border border-gray-300 rounded mt-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                            value={filters.moneda}
                                                            onChange={e => handleFilterChange('moneda', e.target.value)}
                                                        >
                                                            <option value="Todas">Todas</option>
                                                            <option value="MXN">MXN</option>
                                                            <option value="USD">USD</option>
                                                            <option value="EUR">EUR</option>
                                                        </select>
                                                    </th>
                                                    <th className="px-2 py-2 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                        Monto Orig.
                                                    </th>
                                                    <th className="px-2 py-2 text-right text-xs font-bold text-gray-700 uppercase tracking-wider text-gray-400">TC</th>
                                                    <th className="px-2 py-2 text-right text-xs font-bold text-gray-700 uppercase tracking-wider text-indigo-800 min-w-[130px]">
                                                        <div className="flex items-center justify-end cursor-pointer mb-1 hover:text-indigo-600" onClick={() => handleSort('total_mxn')}>
                                                            Monto MXN {sortConfig?.key === 'total_mxn' && ((sortConfig.direction === 'asc') ? '🔼' : '🔽')}
                                                        </div>
                                                        <div className="flex gap-1 justify-end">
                                                            <input
                                                                type="number"
                                                                placeholder="Min"
                                                                className="w-[50px] text-[9px] p-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                                                value={filters.montoMin}
                                                                onChange={e => handleFilterChange('montoMin', e.target.value)}
                                                            />
                                                            <input
                                                                type="number"
                                                                placeholder="Max"
                                                                className="w-[50px] text-[9px] p-0.5 border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                                                value={filters.montoMax}
                                                                onChange={e => handleFilterChange('montoMax', e.target.value)}
                                                            />
                                                        </div>
                                                    </th>
                                                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[100px]">
                                                        Estatus
                                                        <select
                                                            className="w-full text-[9px] p-0.5 border border-gray-300 rounded mt-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                                                            value={filters.estatus}
                                                            onChange={e => handleFilterChange('estatus', e.target.value)}
                                                        >
                                                            <option value="Todos">Todos</option>
                                                            <option value="Vigente">Vigente</option>
                                                            <option value="Cancelado">Cancelado</option>
                                                        </select>
                                                    </th>
                                                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {paginatedData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={10} className="px-6 py-10 text-center text-gray-500">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <span className="text-3xl mb-2">🔍</span>
                                                                <p className="text-sm font-medium">No se encontraron resultados con los filtros actuales</p>
                                                                <button
                                                                    onClick={() => setFilters({
                                                                        fechaInicio: '',
                                                                        fechaFin: '',
                                                                        emisor: '',
                                                                        receptor: '',
                                                                        moneda: 'Todas',
                                                                        montoMin: '',
                                                                        montoMax: '',
                                                                        estatus: 'Todos'
                                                                    })}
                                                                    className="mt-2 text-indigo-600 hover:text-indigo-800 text-xs font-bold underline"
                                                                >
                                                                    Limpiar Filtros
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginatedData.map((cfdi) => {
                                                        const tc = cfdi.tipo_cambio && cfdi.tipo_cambio > 0 ? cfdi.tipo_cambio : 1;
                                                        const isForeign = cfdi.moneda && cfdi.moneda !== 'MXN' && cfdi.moneda !== 'XXX';
                                                        const totalMXN = cfdi.total * tc;

                                                        return (
                                                            <tr key={cfdi.uuid} className="hover:bg-blue-50 transition-colors text-xs">
                                                                <td className="px-3 py-2 whitespace-nowrap text-gray-900 font-mono">
                                                                    {cfdi.fecha ? cfdi.fecha.split('T')[0] : 'N/D'}
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-gray-500 font-mono cursor-pointer hover:text-indigo-600" onClick={() => copyToClipboard(cfdi.uuid)} title="Copiar UUID Completo">
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
                                                                    {/* Si es extranjero mostramos el original, si es MXN mostramos el mismo */}
                                                                    {formatCurrency(cfdi.total, cfdi.moneda || 'MXN')}
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-right font-mono text-gray-400 text-[10px]">
                                                                    {isForeign ? tc.toFixed(4) : '-'}
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-right font-mono font-bold text-indigo-700 bg-indigo-50/30">
                                                                    {formatCurrency(totalMXN, 'MXN')}
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                                                    {cfdi.estado_sat === 'Cancelado' ? (
                                                                        <span className="text-red-700 font-extrabold text-[10px] uppercase bg-red-100 px-2 py-0.5 rounded">CANCELADO</span>
                                                                    ) : (
                                                                        <span className="text-green-600 font-bold text-[10px]">VIGENTE</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 whitespace-nowrap text-center">
                                                                    <div className="flex items-center justify-center">
                                                                        <button
                                                                            onClick={() => {
                                                                                setAuditandoUuid(cfdi.uuid);
                                                                                setAuditandoTipo(cfdi.tipo_comprobante);
                                                                                setShowEvidenciaModal(true);
                                                                            }}
                                                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-l-md text-xs font-bold transition-colors flex items-center gap-1 border-r border-indigo-200"
                                                                            title="Ver/Subir Materialidad (Contratos, Entregables)"
                                                                        >
                                                                            <span>📂</span> Evidencias
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setSelectedXmlUuid(cfdi.uuid)}
                                                                            className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-r-md text-xs font-bold transition-colors flex items-center gap-1 border-l border-gray-200"
                                                                            title="Ver XML Original (Solo Lectura)"
                                                                        >
                                                                            <span>👁</span>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Footer informativo */}
                            {/* Footer Forense con Paginación */}
                            <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs text-gray-700">
                                            Mostrando <span className="font-bold">{(processedData.length > 0) ? (pagination.currentPage - 1) * pagination.itemsPerPage + 1 : 0}</span> a <span className="font-bold">{Math.min(pagination.currentPage * pagination.itemsPerPage, processedData.length)}</span> de <span className="font-bold">{processedData.length}</span> resultados filtrados
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-500 mr-2">Filas:</label>
                                        <select
                                            className="text-xs border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 outline-none py-1"
                                            value={pagination.itemsPerPage}
                                            onChange={e => setPagination(prev => ({ currentPage: 1, itemsPerPage: Number(e.target.value) }))}
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, currentPage: 1 }))}
                                                disabled={pagination.currentPage === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Primera Página"
                                            >
                                                ⏮️
                                            </button>
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
                                                disabled={pagination.currentPage === 1}
                                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Anterior"
                                            >
                                                ◀️
                                            </button>
                                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-xs font-medium text-gray-700">
                                                Página {pagination.currentPage} / {Math.max(1, totalPages)}
                                            </span>
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(totalPages, prev.currentPage + 1) }))}
                                                disabled={pagination.currentPage === totalPages || totalPages === 0}
                                                className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Siguiente"
                                            >
                                                ▶️
                                            </button>
                                            <button
                                                onClick={() => setPagination(prev => ({ ...prev, currentPage: totalPages }))}
                                                disabled={pagination.currentPage === totalPages || totalPages === 0}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Última Página"
                                            >
                                                ⏭️
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                                <p className="text-[10px] text-gray-400 text-center">
                                    Los XML originales permanecen intactos. La plataforma solo interpreta y presenta información. No existe alteración fiscal de los comprobantes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL GESTIÓN DE EVIDENCIAS Y MATERIALIDAD --- */}
            {showEvidenciaModal && auditandoUuid && (
                <div className="fixed inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity" onClick={() => setShowEvidenciaModal(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                        <div className="inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-2xl sm:w-full">
                            <div className="bg-indigo-50 px-4 py-3 border-b border-indigo-100 flex justify-between items-center">
                                <h3 className="text-lg leading-6 font-bold text-indigo-900">
                                    📎 Gestión de Materialidad
                                </h3>
                                <button
                                    onClick={() => setShowEvidenciaModal(false)}
                                    className="text-gray-400 hover:text-gray-500 font-bold text-2xl"
                                >
                                    &times;
                                </button>
                            </div>

                            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                                <div className="mb-6">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">CFDI VINCULADO</h4>
                                    <code className="block bg-gray-100 p-2 rounded text-xs text-gray-700 font-mono break-all text-center">
                                        {auditandoUuid}
                                    </code>
                                </div>

                                <div className="grid grid-cols-1 gap-8">
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <span>🗂️</span> Expediente Digital
                                        </h4>
                                        <ListaEvidencias
                                            cfdiUuid={auditandoUuid}
                                            tipoComprobante={auditandoTipo || 'I'}
                                            folioControl={`AUDIT-${periodoLabel || 'GENERAL'}`}
                                            onUpdate={() => { }}
                                            onClose={() => setShowEvidenciaModal(false)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-right">
                                <button
                                    type="button"
                                    className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
                                    onClick={() => setShowEvidenciaModal(false)}
                                >
                                    Cerrar Expediente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Visor XML */}
            {selectedXmlUuid && (
                <XmlVisorModal
                    uuid={selectedXmlUuid}
                    onClose={() => setSelectedXmlUuid(null)}
                />
            )}
        </>
    );
};
