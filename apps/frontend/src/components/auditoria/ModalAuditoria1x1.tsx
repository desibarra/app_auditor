import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BadgeFiscal from '../fiscal/BadgeFiscal';
import XmlVisorModal from '../XmlVisorModal';
import ListaEvidencias from '../ListaEvidencias';
import * as XLSX from 'xlsx';

interface CfdiDetalle {
    fecha: string;
    rfcEmisor: string;
    nombreEmisor: string;
    rfcReceptor: string;
    nombreReceptor: string;
    uuid: string;
    tipoCfdi: 'I' | 'E' | 'N' | 'P' | 'T';
    moneda: string;
    importeMxn: number;
    importeUsd?: number;
    status: string;
    complementos: string[];
}

interface ModalAuditoria1x1Props {
    mes: string;
    empresaId: string;
    dominio: 'emitidos' | 'recibidos';
    tipo: 'ingresos' | 'egresos' | 'nomina' | 'pagos';
    onClose: () => void;
}

const ModalAuditoria1x1: React.FC<ModalAuditoria1x1Props> = ({
    mes,
    empresaId,
    dominio,
    tipo,
    onClose
}) => {
    const [cfdis, setCfdis] = useState<CfdiDetalle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uuidSeleccionado, setUuidSeleccionado] = useState<string | null>(null);
    const [cfdiEvidencias, setCfdiEvidencias] = useState<CfdiDetalle | null>(null);

    // Filtros y paginación
    const [filtroRfc, setFiltroRfc] = useState('');
    const [filtroMoneda, setFiltroMoneda] = useState('TODAS');
    const [filtroMontoMin, setFiltroMontoMin] = useState('');
    const [filtroMontoMax, setFiltroMontoMax] = useState('');
    const [ordenarPor, setOrdenarPor] = useState<string>('fecha');
    const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('desc');
    const [paginaActual, setPaginaActual] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(25);

    useEffect(() => {
        fetchCfdis();
    }, [mes, empresaId, dominio, tipo]);

    const fetchCfdis = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await axios.get(
                `/api/cfdi/detalle-mes/${empresaId}/${mes}/${dominio}/${tipo}`
            );

            setCfdis(response.data.cfdis || []);
        } catch (err: any) {
            console.error('Error fetching CFDIs:', err);
            setError(err.response?.data?.message || 'Error al cargar los CFDIs');
        } finally {
            setLoading(false);
        }
    };

    // Aplicar filtros
    const cfdisFiltrados = cfdis.filter(cfdi => {
        if (filtroRfc &&
            !cfdi.rfcEmisor.includes(filtroRfc.toUpperCase()) &&
            !cfdi.rfcReceptor.includes(filtroRfc.toUpperCase()) &&
            !cfdi.uuid.toUpperCase().includes(filtroRfc.toUpperCase())) {
            return false;
        }
        if (filtroMoneda !== 'TODAS' && cfdi.moneda !== filtroMoneda) {
            return false;
        }
        if (filtroMontoMin && cfdi.importeMxn < parseFloat(filtroMontoMin)) {
            return false;
        }
        if (filtroMontoMax && cfdi.importeMxn > parseFloat(filtroMontoMax)) {
            return false;
        }
        return true;
    });

    // Ordenar Dinámico
    const cfdisOrdenados = [...cfdisFiltrados].sort((a, b) => {
        let valA: any = a[ordenarPor as keyof CfdiDetalle];
        let valB: any = b[ordenarPor as keyof CfdiDetalle];

        if (ordenarPor === 'importeMxn' || ordenarPor === 'importeUsd') {
            valA = Number(valA || 0);
            valB = Number(valB || 0);
        } else if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = (valB as string).toLowerCase();
        }

        if (valA < valB) return ordenDireccion === 'asc' ? -1 : 1;
        if (valA > valB) return ordenDireccion === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (col: string) => {
        if (ordenarPor === col) {
            setOrdenDireccion(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setOrdenarPor(col);
            setOrdenDireccion('desc');
        }
    };

    const SortIcon = ({ col }: { col: string }) => {
        if (ordenarPor !== col) return <span className="opacity-20 ml-1">↕</span>;
        return <span className="ml-1 text-indigo-400">{ordenDireccion === 'asc' ? '▲' : '▼'}</span>;
    };

    // Paginar
    const totalPaginas = Math.ceil(cfdisOrdenados.length / itemsPorPagina);
    const indiceInicio = (paginaActual - 1) * itemsPorPagina;
    const indiceFin = indiceInicio + itemsPorPagina;
    const cfdisPaginados = cfdisOrdenados.slice(indiceInicio, indiceFin);

    // Calcular totales
    const totalMxn = cfdisFiltrados.reduce((sum, cfdi) => sum + cfdi.importeMxn, 0);
    const totalUsd = cfdisFiltrados.reduce((sum, cfdi) => sum + (cfdi.importeUsd || 0), 0);

    // Exportar a Excel
    const exportarExcel = () => {
        const datosExport = cfdisOrdenados.map(cfdi => ({
            'Fecha': new Date(cfdi.fecha).toLocaleDateString('es-MX'),
            'RFC Emisor': cfdi.rfcEmisor,
            'Nombre Emisor': cfdi.nombreEmisor,
            'RFC Receptor': cfdi.rfcReceptor,
            'Nombre Receptor': cfdi.nombreReceptor,
            'UUID': cfdi.uuid,
            'Tipo CFDI': cfdi.tipoCfdi,
            'Moneda': cfdi.moneda,
            'Importe MXN': cfdi.importeMxn,
            'Importe USD': cfdi.importeUsd || 0,
            'Status': cfdi.status,
            'Complementos': cfdi.complementos.join(', ')
        }));

        const ws = XLSX.utils.json_to_sheet(datosExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Auditoría 1x1');
        const nombreArchivo = `Auditoria_${dominio}_${tipo}_${mes}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
    };

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatearMoneda = (monto: number, moneda: string = 'MXN') => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: moneda
        }).format(monto);
    };

    return (
        <>
            <div className="fixed inset-0 z-[60] overflow-hidden" role="dialog" aria-modal="true">
                <div className="flex h-screen">
                    <div className="fixed inset-0 bg-black bg-opacity-90 backdrop-blur-sm" onClick={onClose}></div>
                    <div className="relative z-10 flex w-full max-w-[98vw] mx-auto my-4 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden flex-col">

                        {/* Header */}
                        <div className="bg-gradient-to-r from-gray-950 to-gray-900 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <span className="text-3xl">📊</span>
                                    AUDITORÍA 1x1 - {tipo.toUpperCase()}
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    {dominio === 'emitidos' ? 'CFDIs Emitidos' : 'CFDIs Recibidos'} • {mes}
                                </p>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-3xl font-bold bg-white/5 w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10">
                                &times;
                            </button>
                        </div>

                        {/* Filtros y Controles */}
                        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">RFC</label>
                                    <input type="text" value={filtroRfc} onChange={(e) => setFiltroRfc(e.target.value)} placeholder="Buscar RFC o UUID..." className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Moneda</label>
                                    <select value={filtroMoneda} onChange={(e) => setFiltroMoneda(e.target.value)} className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none">
                                        <option value="TODAS">Todas</option>
                                        <option value="MXN">MXN</option>
                                        <option value="USD">USD</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Monto Mín</label>
                                    <input type="number" value={filtroMontoMin} onChange={(e) => setFiltroMontoMin(e.target.value)} placeholder="0.00" className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Monto Máx</label>
                                    <input type="number" value={filtroMontoMax} onChange={(e) => setFiltroMontoMax(e.target.value)} placeholder="999999.99" className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded px-3 py-2 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Ordenar</label>
                                    <div className="flex gap-2">
                                        <select value={ordenarPor} onChange={(e) => setOrdenarPor(e.target.value)} className="flex-1 bg-gray-900 border border-gray-600 text-white text-sm rounded px-2 py-2 focus:ring-1 focus:ring-indigo-500 outline-none">
                                            <option value="fecha">Fecha</option>
                                            <option value="importeMxn">Monto</option>
                                            <option value="rfcEmisor">RFC Emisor</option>
                                            <option value="rfcReceptor">RFC Receptor</option>
                                            <option value="status">Status</option>
                                        </select>
                                        <button onClick={() => setOrdenDireccion(prev => prev === 'asc' ? 'desc' : 'asc')} className="bg-gray-900 border border-gray-600 text-white px-3 py-2 rounded hover:bg-gray-800 transition-colors">
                                            {ordenDireccion === 'asc' ? '↑' : '↓'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                                <div className="flex items-center gap-4">
                                    <div className="text-sm text-gray-400"><span className="font-bold text-white">{cfdisFiltrados.length}</span> CFDIs encontrados</div>
                                    <div className="text-sm text-gray-400">Total MXN: <span className="font-bold text-green-400">{formatearMoneda(totalMxn)}</span></div>
                                    {totalUsd > 0 && <div className="text-sm text-gray-400">Total USD: <span className="font-bold text-blue-400">{formatearMoneda(totalUsd, 'USD')}</span></div>}
                                </div>
                                <button onClick={exportarExcel} disabled={cfdisFiltrados.length === 0} className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                                    <span>📥</span> Exportar Excel
                                </button>
                            </div>
                        </div>

                        {/* Tabla */}
                        <div className="flex-1 overflow-auto bg-gray-950">
                            {loading ? (
                                <div className="flex items-center justify-center h-full"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div><p className="text-gray-400">Cargando CFDIs...</p></div></div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-full"><div className="text-center text-red-400"><span className="text-4xl mb-4 block">⚠️</span><p className="font-bold">{error}</p></div></div>
                            ) : cfdisPaginados.length === 0 ? (
                                <div className="flex items-center justify-center h-full"><div className="text-center text-gray-500"><span className="text-4xl mb-4 block">📭</span><p className="font-bold">No se encontraron CFDIs</p></div></div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-900 sticky top-0 z-10">
                                        <tr className="border-b border-gray-800">
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('fecha')}>Fecha <SortIcon col="fecha" /></th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('rfcEmisor')}>RFC Emisor <SortIcon col="rfcEmisor" /></th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('rfcReceptor')}>RFC Receptor <SortIcon col="rfcReceptor" /></th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('uuid')}>UUID <SortIcon col="uuid" /></th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('tipoCfdi')}>Tipo <SortIcon col="tipoCfdi" /></th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Moneda</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('importeMxn')}>Importe MXN <SortIcon col="importeMxn" /></th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('importeUsd')}>Importe USD <SortIcon col="importeUsd" /></th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white" onClick={() => handleSort('status')}>Status <SortIcon col="status" /></th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {cfdisPaginados.map((cfdi) => (
                                            <tr key={cfdi.uuid} className="hover:bg-gray-900/50 transition-colors">
                                                <td className="px-4 py-3 text-white font-mono text-xs">{formatearFecha(cfdi.fecha)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="text-white font-mono text-xs">{cfdi.rfcEmisor}</div>
                                                    <div className="text-gray-500 text-[10px] truncate max-w-[150px]" title={cfdi.nombreEmisor}>{cfdi.nombreEmisor}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-white font-mono text-xs">{cfdi.rfcReceptor}</div>
                                                    <div className="text-gray-500 text-[10px] truncate max-w-[150px]" title={cfdi.nombreReceptor}>{cfdi.nombreReceptor}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-gray-300 font-mono text-[10px] truncate max-w-[200px]" title={cfdi.uuid}>{cfdi.uuid}</div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <BadgeFiscal tipo={cfdi.tipoCfdi} complementos={cfdi.complementos} size="sm" />
                                                </td>
                                                <td className="px-4 py-3 text-white font-mono text-xs">{cfdi.moneda}</td>
                                                <td className="px-4 py-3 text-right text-white font-mono font-bold">{formatearMoneda(cfdi.importeMxn)}</td>
                                                <td className="px-4 py-3 text-right text-blue-300 font-mono">{cfdi.importeUsd ? formatearMoneda(cfdi.importeUsd, 'USD') : '-'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${cfdi.status === 'VIGENTE' ? 'bg-green-900/40 text-green-300 border border-green-700' : cfdi.status === 'CANCELADO' ? 'bg-red-900/40 text-red-300 border border-red-700' : 'bg-gray-900/40 text-gray-300 border border-gray-700'}`}>
                                                        {cfdi.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => setUuidSeleccionado(cfdi.uuid)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors">👁 XML</button>
                                                        <button onClick={() => setCfdiEvidencias(cfdi)} className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors">📂 Evidencias</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Paginación */}
                        {!loading && !error && cfdisFiltrados.length > 0 && (
                            <div className="bg-gray-900 border-t border-gray-800 px-6 py-4 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Items:</label>
                                    <select value={itemsPorPagina} onChange={(e) => { setItemsPorPagina(Number(e.target.value)); setPaginaActual(1); }} className="bg-gray-800 border border-gray-600 text-white text-sm rounded px-3 py-1 outline-none">
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <span className="text-sm text-gray-400">Mostrando {indiceInicio + 1} - {Math.min(indiceFin, cfdisFiltrados.length)} de {cfdisFiltrados.length}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))} disabled={paginaActual === 1} className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded">←</button>
                                    <span className="text-sm text-gray-400">Pág {paginaActual}</span>
                                    <button onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))} disabled={paginaActual === totalPaginas} className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded">→</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {uuidSeleccionado && <XmlVisorModal uuid={uuidSeleccionado} onClose={() => setUuidSeleccionado(null)} />}
            {cfdiEvidencias && (
                <div className="fixed inset-0 z-[70] overflow-y-auto" role="dialog" aria-modal="true">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-black bg-opacity-90 transition-opacity backdrop-blur-sm" onClick={() => setCfdiEvidencias(null)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-gray-900 rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full border border-gray-700">
                            <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 sm:px-6 flex justify-between items-center border-b border-gray-700">
                                <div><h3 className="text-lg leading-6 font-bold text-white">📁 EXPEDIENTE FISCAL</h3><p className="text-xs text-gray-400 font-mono">{cfdiEvidencias.uuid}</p></div>
                                <button onClick={() => setCfdiEvidencias(null)} className="text-gray-400 hover:text-white text-xl font-bold">&times;</button>
                            </div>
                            <div className="bg-gray-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 max-h-[80vh] overflow-y-auto">
                                <ListaEvidencias cfdiUuid={cfdiEvidencias.uuid} tipoComprobante={cfdiEvidencias.tipoCfdi} onUpdate={() => { }} onClose={() => setCfdiEvidencias(null)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ModalAuditoria1x1;
