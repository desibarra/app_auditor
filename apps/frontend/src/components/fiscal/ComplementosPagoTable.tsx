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

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-MX');
    };

    // Aplicar filtros y ordenamiento
    let dataFiltrada = (response?.data || []).filter(item => {
        if (!item) return false;
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
            <div className="flex flex-col items-center justify-center py-20 gap-6 animate-in zoom-in-95">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-4xl shadow-sm border border-rose-100">⚠️</div>
                <div className="text-center">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Protocolo Interrumpido</h3>
                    <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest mt-2">{error}</p>
                </div>
                <button onClick={fetchData} className="btn-secondary px-8 py-3">REINTENTAR CONEXIÓN</button>
            </div>
        );
    }

    if (loading && !response) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6 animate-in fade-in duration-500">
                <div className="w-12 h-12 border-x-4 border-slate-100 border-t-4 border-t-[#0f172a] rounded-2xl animate-spin"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Sincronizando Trazabilidad Forense...</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* SELECTOR DE TIPO (ARQUITECTURA SENTINEL) */}
            <div className="bg-white p-2 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 flex gap-2">
                <button
                    onClick={() => setTipoComplemento('RECIBIDOS')}
                    className={`flex-1 py-4.5 px-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 ${tipoComplemento === 'RECIBIDOS'
                        ? 'bg-[#0f172a] text-white shadow-xl shadow-slate-900/20 active:scale-95'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    📥 COMPLEMENTOS RECIBIDOS
                    {tipoComplemento === 'RECIBIDOS' && <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>}
                </button>
                <button
                    onClick={() => setTipoComplemento('EMITIDOS')}
                    className={`flex-1 py-4.5 px-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-3 ${tipoComplemento === 'EMITIDOS'
                        ? 'bg-[#0f172a] text-white shadow-xl shadow-slate-900/20 active:scale-95'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    📤 COMPLEMENTOS EMITIDOS
                    {tipoComplemento === 'EMITIDOS' && <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>}
                </button>
            </div>

            {/* FUNDAMENTO LEGAL Y CONTEXTO */}
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex gap-8 items-start shadow-inner">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-sm text-slate-400">
                    ⚖️
                </div>
                <div>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-2 text-slate-900 flex items-center gap-3">
                        {tipoComplemento === 'RECIBIDOS' ? 'Análisis de Impacto LIVA (Creditamiento)' : 'Control de Cobranza y Ventas Percibidas'}
                        <div className="px-2 py-0.5 bg-white border border-slate-200 text-[8px] rounded-lg text-slate-400">INFO FISCAL</div>
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium uppercase">
                        {tipoComplemento === 'RECIBIDOS'
                            ? 'Este motor analiza el flujo de efectivo contra el repositorio SAT. El IVA es acreditable únicamente si existe el complemento de pago vinculado o es PUE conforme al Art. 1-B y 5 Fracc III LIVA.'
                            : 'Análisis de integridad de las facturas de ingresos cuya base de impuestos se determina mediante el momento de cobro efectivo.'}
                    </p>
                </div>
            </div>

            {/* ALERTA DE RIESGO */}
            {response?.meta?.riesgoFiscal && tipoComplemento === 'RECIBIDOS' && (
                <div className="bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] p-8 flex items-start gap-6 animate-in slide-in-from-top-6 duration-700 shadow-xl shadow-rose-900/5">
                    <div className="text-4xl">⚠️</div>
                    <div>
                        <div className="font-black text-rose-700 text-sm uppercase tracking-tighter mb-1.5">Riesgo de Rechazo en Acreditamiento de IVA</div>
                        <div className="text-rose-600/80 text-[11px] font-black uppercase tracking-widest leading-relaxed">
                            {response.meta.mensajeRiesgo}. El SAT rechazará el acreditamiento de estas partidas en una auditoría o solicitud de devolución (Art. 22 CFF).
                        </div>
                    </div>
                </div>
            )}

            {/* MÉTRICAS (KPIs) */}
            {response?.meta && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 group hover:shadow-2xl transition-all duration-500">
                        <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 group-hover:text-slate-900 transition-colors">Total Analizados</div>
                        <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">{response.meta.totalCFDI || 0}</div>
                    </div>
                    <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 group hover:shadow-2xl transition-all duration-500">
                        <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 group-hover:text-emerald-600 transition-colors">Pagados / Conciliados</div>
                        <div className="text-3xl font-black text-emerald-600 font-mono tracking-tighter">{response.meta.pagados || 0}</div>
                    </div>
                    <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 group hover:shadow-2xl transition-all duration-500 border-l-4 border-l-rose-500">
                        <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 group-hover:text-rose-600 transition-colors">PPD sin Complemento</div>
                        <div className="text-3xl font-black text-rose-600 font-mono tracking-tighter">{response.meta.ppdSinComplemento || 0}</div>
                    </div>
                    <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/40 group hover:shadow-2xl transition-all duration-500">
                        <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-4 group-hover:text-blue-600 transition-colors">Ventas/Gastos PUE</div>
                        <div className="text-3xl font-black text-blue-600 font-mono tracking-tighter">{response.meta.pue || 0}</div>
                    </div>
                </div>
            )}

            {/* TABS SECUNDARIOS Y BUSCADOR */}
            <div className="flex flex-col lg:flex-row gap-6 justify-between items-center bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                <div className="flex gap-2 p-2 bg-white rounded-[1.8rem] border border-slate-100 shadow-sm">
                    {['TODOS', 'PAGADO', 'SIN_COMPLEMENTO', 'PUE'].map(st => (
                        <button
                            key={st}
                            onClick={() => setFiltros({ ...filtros, estatus: st })}
                            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.2rem] transition-all duration-500 ${filtros.estatus === st ? 'bg-[#0f172a] text-white shadow-lg shadow-slate-900/20 active:scale-95' : 'text-slate-400 hover:text-slate-800'}`}
                        >
                            {st === 'TODOS' ? 'Todos' : st === 'PAGADO' ? 'Con Pago' : st === 'SIN_COMPLEMENTO' ? 'Faltantes' : 'PUE'}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:w-96">
                    <input
                        type="text"
                        placeholder="BUSCAR UUID O RFC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-[#0f172a] rounded-[1.5rem] pl-12 pr-6 py-4 text-[11px] font-black uppercase tracking-widest focus:ring-4 focus:ring-slate-500/5 focus:border-[#0f172a] outline-none transition-all shadow-sm placeholder:text-slate-300"
                    />
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
            </div>

            {/* TABLA PRINCIPAL */}
            <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/40 relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20 animate-in fade-in">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-x-4 border-slate-100 border-t-4 border-t-[#0f172a] rounded-xl animate-spin"></div>
                            <span className="text-[10px] font-black text-[#0f172a] tracking-[0.4em] uppercase">Auditando...</span>
                        </div>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th onClick={() => handleSort('fechaCfdi')} className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] cursor-pointer hover:text-[#0f172a] transition-colors">
                                    CFDI Origen / Fecha {sortKey === 'fechaCfdi' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('emisorRfc')} className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] cursor-pointer hover:text-[#0f172a] transition-colors">
                                    Entidad Fiscal {sortKey === 'emisorRfc' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th onClick={() => handleSort('total')} className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right cursor-pointer hover:text-[#0f172a] transition-colors">
                                    Monto Total
                                </th>
                                <th onClick={() => handleSort('iva')} className="px-10 py-8 text-[10px] font-black text-[#0f172a] uppercase tracking-[0.3em] text-right cursor-pointer hover:underline transition-all">
                                    IVA (Flujo)
                                </th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Trazabilidad Pago</th>
                                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Estado Forense</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {dataFiltrada.map((item, idx) => (
                                <tr key={item.uuidCfdi + idx} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="text-[11px] font-black text-slate-900 font-mono tracking-tight group-hover:text-[#0f172a] uppercase">{item.uuidCfdi}</div>
                                        <div className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-widest">{formatDate(item.fechaCfdi)}</div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="text-[11px] font-black text-slate-900 group-hover:text-[#0f172a] transition-colors uppercase truncate max-w-[200px]" title={tipoComplemento === 'RECIBIDOS' ? item.emisorNombre : item.receptorNombre}>
                                            {tipoComplemento === 'RECIBIDOS' ? item.emisorNombre : item.receptorNombre}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono font-bold mt-1 uppercase tracking-tighter">
                                            {tipoComplemento === 'RECIBIDOS' ? item.emisorRfc : item.receptorRfc}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="text-[13px] font-black text-slate-900 font-mono tracking-tighter">{formatCurrency(item.total)}</div>
                                        <div className="text-[9px] text-slate-400 font-black uppercase mt-1 tracking-widest">{item.metodoPago}</div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <div className="text-[13px] font-black text-[#0f172a] font-mono tracking-tighter">{formatCurrency(item.iva)}</div>
                                    </td>
                                    <td className="px-10 py-8 text-center text-[10px]">
                                        {item.uuidComplemento ? (
                                            <div className="flex flex-col items-center">
                                                <span className="font-mono font-black text-emerald-600 group-hover:underline cursor-pointer tracking-tighter uppercase">{item.uuidComplemento}</span>
                                                <span className="text-[9px] text-slate-400 font-black mt-2 uppercase tracking-widest">{formatDate(item.fechaComplemento)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 font-black tracking-widest uppercase">No Vinculado</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="flex justify-center">
                                            {item.estatusPago === 'PAGADO' ? (
                                                <div className="badge-success">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                                    CONCILIADO
                                                </div>
                                            ) : item.estatusPago === 'SIN_COMPLEMENTO' ? (
                                                <div className="px-4 py-1.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                                                    PENDIENTE
                                                </div>
                                            ) : (
                                                <div className="px-4 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                                    PUE (CONTADO)
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {dataFiltrada.length === 0 && !loading && (
                    <div className="text-center py-28 animate-in fade-in duration-1000">
                        <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center text-4xl shadow-xl shadow-slate-200/50 mx-auto mb-8 grayscale opacity-50">🔍</div>
                        <p className="text-[12px] text-slate-900 font-black uppercase tracking-[0.3em]">Integridad de Periodo Detectada</p>
                        <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-[0.3em]">No se identificaron registros en este protocolo de búsqueda.</p>
                    </div>
                )}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/30 gap-6">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    Filtro Activo: <span className="text-[#0f172a]">{filtros.estatus.replace('_', ' ')}</span> • {dataFiltrada.length} Folios Detectados
                </div>
                <div className="flex flex-wrap gap-8">
                    <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30"></span>
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Coherente</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-lg shadow-rose-500/30"></span>
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Riesgo Fiscal</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30"></span>
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Acreditamiento PUE</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplementosPagoTable;

