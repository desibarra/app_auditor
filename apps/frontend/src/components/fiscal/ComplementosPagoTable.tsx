import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ComplementoPago {
    uuidCfdi: string;
    fechaCfdi: string;
    metodoPago: string;
    total: number;
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

    const getEstatusBadge = (estatus: string) => {
        switch (estatus) {
            case 'PAGADO':
                return <span className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">🟢 PAGADO</span>;
            case 'SIN_COMPLEMENTO':
                return <span className="px-2 py-1 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">🟡 PPD SIN COMPLEMENTO</span>;
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

    // Aplicar filtros
    const dataFiltrada = response?.data.filter(item => {
        if (filtros.estatus !== 'TODOS' && item.estatusPago !== filtros.estatus) return false;
        if (filtros.metodo !== 'TODOS' && item.metodoPago !== filtros.metodo) return false;
        if (filtros.ejercicio !== 'TODOS' && item.ejercicio.toString() !== filtros.ejercicio) return false;
        if (filtros.version !== 'TODOS' && item.versionCfdi !== filtros.version) return false;
        return true;
    }) || [];

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

            {/* FUNDAMENTO LEGAL Y CONTEXTO (EXIGENCIA DE AUDITORÍA) */}
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
                            : 'Esta vista analiza los complementos que tú emites a tus clientes. Sirve para control administrativo y fiscal de ingresos percibidos. No afecta directamente tus deducciones pero sí tus ingresos acumulables.'}
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

            {/* MÉTRICAS */}
            {response && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-[#0B0E14] border border-gray-800 p-5 rounded-xl">
                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-2">Total Analizados</div>
                        <div className="text-2xl font-bold text-white font-mono">{response.meta.totalCFDI}</div>
                    </div>
                    <div className="bg-[#0B0E14] border border-gray-800 p-5 rounded-xl">
                        <div className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-2">Pagados / Conciliados</div>
                        <div className="text-2xl font-bold text-emerald-400 font-mono">{response.meta.pagados}</div>
                    </div>
                    <div className="bg-[#0B0E14] border border-gray-800 p-5 rounded-xl">
                        <div className="text-rose-500 text-[10px] font-bold uppercase tracking-widest mb-2">PPD sin Complemento</div>
                        <div className="text-2xl font-bold text-rose-400 font-mono">{response.meta.ppdSinComplemento}</div>
                    </div>
                    <div className="bg-[#0B0E14] border border-gray-800 p-5 rounded-xl">
                        <div className="text-blue-500 text-[10px] font-bold uppercase tracking-widest mb-2">Ventas/Gastos PUE</div>
                        <div className="text-2xl font-bold text-blue-400 font-mono">{response.meta.pue}</div>
                    </div>
                </div>
            )}

            {/* FILTROS */}
            <div className="bg-[#0B0E14] border border-gray-800 p-5 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Estatus Fiscal</label>
                        <select
                            value={filtros.estatus}
                            onChange={(e) => setFiltros({ ...filtros, estatus: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                            <option value="TODOS">TODOS</option>
                            <option value="PAGADO">PAGADO</option>
                            <option value="SIN_COMPLEMENTO">SIN COMPLEMENTO</option>
                            <option value="PUE">PUE</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Método de Pago</label>
                        <select
                            value={filtros.metodo}
                            onChange={(e) => setFiltros({ ...filtros, metodo: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                            <option value="TODOS">TODOS</option>
                            <option value="PPD">PPD</option>
                            <option value="PUE">PUE</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Ejercicio</label>
                        <select
                            value={filtros.ejercicio}
                            onChange={(e) => setFiltros({ ...filtros, ejercicio: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                            <option value="TODOS">TODOS</option>
                            {[2023, 2024, 2025, 2026].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Versión CFDI</label>
                        <select
                            value={filtros.version}
                            onChange={(e) => setFiltros({ ...filtros, version: e.target.value })}
                            className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-xs font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                            <option value="TODOS">TODAS</option>
                            <option value="3.3">3.3</option>
                            <option value="4.0">4.0</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* TABLA PRINCIPAL */}
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
                    <table className="w-full text-left">
                        <thead className="bg-[#080a0f] border-b border-gray-800">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">UUID Origen</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Contraparte</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Total CFDI</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">UUID Pago</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Estatus</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Versión</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {dataFiltrada.map((item, idx) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-indigo-500">
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-gray-200 font-mono">{item.uuidCfdi.substring(0, 8)}...</div>
                                        <div className="text-[10px] text-gray-500 uppercase font-bold">{formatDate(item.fechaCfdi)}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs font-bold text-gray-300 truncate max-w-[200px]">
                                            {tipoComplemento === 'RECIBIDOS' ? item.emisorNombre : item.receptorNombre}
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-mono">
                                            {tipoComplemento === 'RECIBIDOS' ? item.emisorRfc : item.receptorRfc}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="text-xs font-bold text-white font-mono">{formatCurrency(item.total)}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {item.uuidComplemento ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-bold text-emerald-400 font-mono">{item.uuidComplemento.substring(0, 8)}...</span>
                                                <span className="text-[9px] text-gray-500 font-bold">{formatDate(item.fechaComplemento)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-600 font-bold">---</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getEstatusBadge(item.estatusPago)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                            v{item.versionCfdi}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {dataFiltrada.length === 0 && !loading && (
                    <div className="text-center py-20 bg-gray-900/10">
                        <p className="text-3xl mb-4">🔍</p>
                        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">Sin registros encontrados</p>
                        <p className="text-gray-600 text-xs mt-2">Prueba cambiando los filtros o el periodo fiscal.</p>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-gray-600 uppercase tracking-widest px-2">
                <div>Mostrando {dataFiltrada.length} de {response?.data.length || 0} registros</div>
                <div className="flex gap-4">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Coherente</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Riesgo Fiscal</span>
                </div>
            </div>
        </div>
    );
};

export default ComplementosPagoTable;
