import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ComplementoPago {
    uuidCfdi: string;
    fechaCfdi: string;
    metodoPago: string;
    total: number;
    iva: number;
    uuidComplemento: string | null;
    fechaComplemento: string | null;
    estatusPago: 'PAGADO' | 'SIN_COMPLEMENTO' | 'PUE';
    ejercicio: number;
    versionCfdi: string;
    emisorRfc: string;
    receptorRfc: string;
    emisorNombre: string;
    receptorNombre: string;
}

interface ComplementosPagoMeta {
    empresaId: string;
    empresaNombre: string;
    empresaRfc: string;
    periodo: string;
    totalCFDI: number;
    pagados: number;
    ppdSinComplemento: number;
    pue: number;
    riesgoFiscal: boolean;
    mensajeRiesgo: string | null;
}

interface ComplementosPagoResponse {
    meta: ComplementosPagoMeta;
    data: ComplementoPago[];
}

interface Props {
    empresaId: string;
    periodo: string;
}

const ComplementosPagoTable: React.FC<Props> = ({ empresaId, periodo }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [response, setResponse] = useState<ComplementosPagoResponse | null>(null);
    const [tipoComplemento, setTipoComplemento] = useState<'RECIBIDOS' | 'EMITIDOS'>('RECIBIDOS');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortKey, setSortKey] = useState<string>('fechaCfdi');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const [filtros, setFiltros] = useState({
        estatus: 'TODOS',
        metodo: 'TODOS',
        ejercicio: 'TODOS',
        version: 'TODOS'
    });

    useEffect(() => {
        if (empresaId && periodo) {
            fetchData();
        }
    }, [empresaId, periodo, tipoComplemento]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get<ComplementosPagoResponse>('/api/cfdi/complementos-pago', {
                params: { empresaId, periodo, origen: tipoComplemento }
            });
            setResponse(res.data);
        } catch (err: any) {
            console.error('Error fetching complementos:', err);
            setError(err.response?.data?.message || 'Error al cargar complementos de pago');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    };

    const getEstatusBadge = (estatus: string) => {
        switch (estatus) {
            case 'PAGADO':
                return <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">🟢 CON COMPLEMENTO</span>;
            case 'SIN_COMPLEMENTO':
                return <span className="px-2 py-1 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">✖ SIN COMPLEMENTO</span>;
            case 'PUE':
                return <span className="px-2 py-1 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">🔵 PUE</span>;
            default:
                return <span className="px-2 py-1 rounded text-[10px] font-bold bg-gray-500/10 text-gray-400">DESCONOCIDO</span>;
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-MX');
    };

    // Aplicar filtros y ordenamiento
    let dataFiltrada = response?.data.filter(item => {
        // Filtro por Tab Secundario (Estatus)
        if (filtros.estatus !== 'TODOS' && item.estatusPago !== filtros.estatus) return false;

        // Filtro por Dropdowns adicionales
        if (filtros.metodo !== 'TODOS' && item.metodoPago !== filtros.metodo) return false;
        if (filtros.ejercicio !== 'TODOS' && item.ejercicio.toString() !== filtros.ejercicio) return false;
        if (filtros.version !== 'TODOS' && item.versionCfdi !== filtros.version) return false;

        // Búsqueda por UUID o RFC
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            const matchUUID = item.uuidCfdi.toLowerCase().includes(search) || (item.uuidComplemento?.toLowerCase().includes(search) || false);
            const matchRFC = item.emisorRfc.toLowerCase().includes(search) || item.receptorRfc.toLowerCase().includes(search);
            if (!matchUUID && !matchRFC) return false;
        }

        return true;
    }) || [];

    // Ordenamiento
    dataFiltrada = [...dataFiltrada].sort((a: any, b: any) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    if (error) {
        return (
            <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <p className="text-xl mb-2">⚠️</p>
                <p className="text-rose-400 font-bold text-xs uppercase tracking-widest">{error}</p>
                <button onClick={fetchData} className="mt-4 text-[10px] text-white bg-rose-600 px-3 py-1.5 rounded font-bold uppercase">Reintentar</button>
            </div>
        );
    }

    if (loading && !response) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                <div className="ml-4 text-gray-400 font-mono text-xs uppercase tracking-widest">Sincronizando trazabilidad...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* SELECTOR DE TIPO (ARQUITECTURA SENTINEL) */}
            <div className="bg-[#0B0E14] border border-gray-800 rounded-xl p-1 flex shadow-lg">
                <button
                    onClick={() => setTipoComplemento('RECIBIDOS')}
                    className={`flex-1 py-3 px-6 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${tipoComplemento === 'RECIBIDOS'
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                >
                    📥 COMPLEMENTOS RECIBIDOS
                    {tipoComplemento === 'RECIBIDOS' && <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>}
                </button>
                <button
                    onClick={() => setTipoComplemento('EMITIDOS')}
                    className={`flex-1 py-3 px-6 rounded-lg font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${tipoComplemento === 'EMITIDOS'
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }`}
                >
                    📤 COMPLEMENTOS EMITIDOS
                    {tipoComplemento === 'EMITIDOS' && <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>}
                </button>
            </div>

            {/* FUNDAMENTO LEGAL Y CONTEXTO */}
            <div className={`p-4 rounded-xl border flex gap-4 items-start ${tipoComplemento === 'RECIBIDOS' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                <div className={`p-2 rounded-lg bg-white/5 ${tipoComplemento === 'RECIBIDOS' ? 'text-indigo-400' : 'text-amber-400'}`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${tipoComplemento === 'RECIBIDOS' ? 'text-indigo-300' : 'text-amber-300'}`}>
                        {tipoComplemento === 'RECIBIDOS' ? 'ANÁLISIS DE IMPACTO EN IVA (CREDITAMIENTO)' : 'CONTROL DE COBRANZA Y LIQUIDEZ'}
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                        {tipoComplemento === 'RECIBIDOS'
                            ? 'Esta vista analiza los pagos recibidos de proveedores. El IVA es acreditable únicamente si existe el complemento de pago vinculado o es PUE. Fundamento: Art. 1-B y 5 Fracc III LIVA.'
                            : 'Esta vista analiza los complementos que tú emites a tus clientes. Sirve para control administrativo y fiscal de ingresos percibidos.'}
                    </p>
                </div>
            </div>

            {/* ALERTA DE RIESGO */}
            {response?.meta.riesgoFiscal && tipoComplemento === 'RECIBIDOS' && (
                <div className="bg-rose-500/10 border-2 border-rose-500/30 rounded-xl p-5 flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="text-3xl">⚠️</div>
                    <div>
                        <div className="font-bold text-rose-400 text-sm uppercase tracking-widest mb-1">RIESGO DE PÉRDIDA DE IVA</div>
                        <div className="text-gray-300 text-xs font-medium leading-relaxed">
                            {response.meta.mensajeRiesgo}. El SAT rechazará el acreditamiento de estas partidas en una solicitud de devolución (Art. 22 CFF).
                        </div>
                    </div>
                </div>
            )}

            {/* MÉTRICAS (KPIs) */}
            {response && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[#0B0E14] border border-gray-800 p-5 rounded-xl shadow-inner">
                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Total Analizados</div>
                        <div className="text-2xl font-bold text-white font-mono">{response.meta.totalCFDI}</div>
                    </div>
                    <div className="bg-[#0B0E14] border border-gray-800 p-5 rounded-xl shadow-inner">
                        <div className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-2">Pagados / Conciliados</div>
                        <div className="text-2xl font-bold text-emerald-400 font-mono">{response.meta.pagados}</div>
                    </div>
                    <div className="bg-[#0B0E14] border border-gray-800 p-5 rounded-xl shadow-inner">
                        <div className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mb-2">PPD sin Complemento</div>
                        <div className="text-2xl font-bold text-rose-400 font-mono">{response.meta.ppdSinComplemento}</div>
                    </div>
                    <div className="bg-[#0B0E14] border border-gray-800 p-5 rounded-xl shadow-inner">
                        <div className="text-blue-500 text-[10px] font-bold uppercase tracking-widest mb-2">Ventas/Gastos PUE</div>
                        <div className="text-2xl font-bold text-blue-400 font-mono">{response.meta.pue}</div>
                    </div>
                </div>
            )}

            {/* TABS SECUNDARIOS Y BUSCADOR (Solicitado) */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0B0E14]/50 p-4 rounded-xl border border-gray-800">
                <div className="flex gap-2 p-1 bg-gray-950 rounded-lg border border-gray-800">
                    <button
                        onClick={() => setFiltros({ ...filtros, estatus: 'TODOS' })}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filtros.estatus === 'TODOS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFiltros({ ...filtros, estatus: 'PAGADO' })}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filtros.estatus === 'PAGADO' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        ✔ Con complemento
                    </button>
                    <button
                        onClick={() => setFiltros({ ...filtros, estatus: 'SIN_COMPLEMENTO' })}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filtros.estatus === 'SIN_COMPLEMENTO' ? 'bg-rose-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        ✖ Sin complemento
                    </button>
                    <button
                        onClick={() => setFiltros({ ...filtros, estatus: 'PUE' })}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${filtros.estatus === 'PUE' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        PUE
                    </button>
                </div>

                <div className="relative w-full md:w-80">
                    <input
                        type="text"
                        placeholder="Buscar por UUID o RFC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg pl-10 pr-4 py-2.5 text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* TABLA PRINCIPAL (REUTILIZANDO ESTILOS DE AUDITORÍA 1x1) */}
            <div className="bg-[#0B0E14] border border-gray-800 rounded-xl overflow-hidden shadow-2xl relative">
                {loading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                        <div className="flex flex-col items-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                            <span className="text-[10px] font-bold text-indigo-400">AUDITANDO...</span>
                        </div>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono">
                        <thead className="bg-[#080a0f] border-b border-gray-800">
                            <tr>
                                <th onClick={() => handleSort('fechaCfdi')} className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-white transition-colors">
                                    CFDI Origen / Fecha {sortKey === 'fechaCfdi' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => handleSort('emisorRfc')} className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-white transition-colors">
                                    Contraparte (RFC) {sortKey === 'emisorRfc' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => handleSort('total')} className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right cursor-pointer hover:text-white transition-colors">
                                    Total CFDI {sortKey === 'total' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th onClick={() => handleSort('iva')} className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right text-indigo-400 cursor-pointer hover:text-white transition-colors">
                                    IVA (002) {sortKey === 'iva' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                                </th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Complemento Pago</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Estatus</th>
                                <th onClick={() => handleSort('ejercicio')} className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center cursor-pointer hover:text-white transition-colors">
                                    Ejerc. {sortKey === 'ejercicio' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {dataFiltrada.map((item, idx) => (
                                <tr key={item.uuidCfdi + idx} className="hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-indigo-500">
                                    <td className="px-6 py-4">
                                        <div className="text-[10px] font-bold text-gray-200 font-mono break-all">{item.uuidCfdi}</div>
                                        <div className="text-[9px] text-gray-500 uppercase font-bold mt-1">{formatDate(item.fechaCfdi)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[10px] font-bold text-gray-300 truncate max-w-[180px]" title={tipoComplemento === 'RECIBIDOS' ? item.emisorNombre : item.receptorNombre}>
                                            {tipoComplemento === 'RECIBIDOS' ? item.emisorNombre : item.receptorNombre}
                                        </div>
                                        <div className="text-[9px] text-gray-500 font-mono">
                                            {tipoComplemento === 'RECIBIDOS' ? item.emisorRfc : item.receptorRfc}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-[10px] font-bold text-white font-mono">{formatCurrency(item.total)}</div>
                                        <div className="text-[9px] text-gray-500 font-bold uppercase">{item.metodoPago}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-[10px] font-bold text-indigo-400 font-mono">{formatCurrency(item.iva)}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {item.uuidComplemento ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-[9px] font-bold text-emerald-400 font-mono break-all">{item.uuidComplemento}</span>
                                                <span className="text-[9px] text-gray-500 font-bold mt-0.5">{formatDate(item.fechaComplemento)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-600 font-bold">---</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getEstatusBadge(item.estatusPago)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                            {item.ejercicio}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {dataFiltrada.length === 0 && !loading && (
                    <div className="text-center py-20 bg-gray-950/20">
                        <div className="text-4xl mb-4">🔍</div>
                        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">
                            No se detectaron CFDI en esta categoría para el periodo seleccionado.
                        </p>
                        <p className="text-gray-600 text-[10px] mt-2 font-bold uppercase tracking-widest">Sentinel Engine - Auditoría Forense</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2 pb-4">
                <div>Filtro: {filtros.estatus.replace('_', ' ')} • Registros: {dataFiltrada.length}</div>
                <div className="flex gap-4">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_#10b981]"></span> Coherente</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_5px_#f43f5e]"></span> Riesgo Fiscal</span>
                </div>
            </div>
        </div>
    );
};

export default ComplementosPagoTable;
