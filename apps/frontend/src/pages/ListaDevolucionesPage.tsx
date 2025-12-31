import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MissionControlLayout from '../components/MissionControlLayout';
import SelectorEmpresa from '../components/SelectorEmpresa';

interface Devolucion {
    id: number;
    periodo: string;
    saldoFavor: number;
    informeHash: string;
    estado: 'BORRADOR' | 'PRESENTADO' | 'REQUERIDO' | 'AUTORIZADO' | 'NEGADO';
    createdAt: string;
}

interface PreValuation {
    periodo: string;
    saldoFavor: number;
    dictamen: {
        resultado: 'GREEN' | 'YELLOW' | 'RED';
        titulo: string;
        justificacion: string;
    };
    cfdisCount: number;
    pagosCount: number;
}

const ListaDevolucionesPage = () => {
    const navigate = useNavigate();
    const [empresaId, setEmpresaId] = useState<string | null>(localStorage.getItem('empresaSeleccionada'));
    const [devoluciones, setDevoluciones] = useState<Devolucion[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedPeriodo, setSelectedPeriodo] = useState(new Date().toISOString().substring(0, 7));
    const [preVal, setPreVal] = useState<PreValuation | null>(null);
    const [loadingPreVal, setLoadingPreVal] = useState(false);
    const [creando, setCreando] = useState(false);

    const fetchDevoluciones = useCallback(async () => {
        if (!empresaId) return;
        try {
            setLoading(true);
            const res = await axios.get(`/api/devoluciones?empresaId=${empresaId}`);
            setDevoluciones(res.data);
        } catch (err) {
            console.error('Error fetching devoluciones:', err);
        } finally {
            setLoading(false);
        }
    }, [empresaId]);

    useEffect(() => {
        fetchDevoluciones();
    }, [fetchDevoluciones]);

    const handlePreValuate = async (periodo: string) => {
        if (!empresaId) return;
        try {
            setLoadingPreVal(true);
            setSelectedPeriodo(periodo);
            const res = await axios.get(`/api/devoluciones/pre-valuation?empresaId=${empresaId}&periodo=${periodo}`);
            setPreVal(res.data);
        } catch (err) {
            console.error('Error in pre-valuation:', err);
        } finally {
            setLoadingPreVal(false);
        }
    };

    const handleConfirmarTramite = async () => {
        if (!empresaId || !preVal) return;

        setCreando(true);
        try {
            await axios.post('/api/devoluciones', {
                empresaId,
                periodo: preVal.periodo
            });
            setShowModal(false);
            setPreVal(null);
            fetchDevoluciones();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al crear trámite');
        } finally {
            setCreando(false);
        }
    };

    const getEstadoBadge = (estado: string) => {
        const styles: Record<string, string> = {
            'BORRADOR': 'bg-slate-100 text-slate-400 border-slate-200',
            'PRESENTADO': 'bg-[#0f172a] text-white border-[#0f172a]',
            'REQUERIDO': 'bg-amber-50 text-amber-700 border-amber-200',
            'AUTORIZADO': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'NEGADO': 'bg-rose-50 text-rose-700 border-rose-200',
        };

        if (estado === 'AUTORIZADO') {
            return (
                <div className="badge-success mx-auto w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    AUTORIZADO
                </div>
            );
        }

        return (
            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black border uppercase tracking-widest inline-flex items-center gap-2 ${styles[estado] || styles['BORRADOR']}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${estado === 'PRESENTADO' ? 'bg-white' : estado === 'REQUERIDO' ? 'bg-amber-500' : estado === 'NEGADO' ? 'bg-rose-500' : 'bg-slate-300'}`}></span>
                {estado}
            </span>
        );
    };

    return (
        <MissionControlLayout title="Devoluciones de IVA">
            <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto">
                {/* Header Contextual */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-secondary py-2 px-4 mb-4 text-[10px]"
                        >
                            <span>←</span> DASHBOARD
                        </button>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Gestión de Trámites FED <span className="text-slate-300 text-lg font-medium ml-2">(Art. 22 CFF)</span></h2>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                Formalización y seguimiento de activos fiscales ante el SAT.
                                <span className="group relative cursor-help ml-2 inline-block">
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-slate-100 text-[#0f172a] text-[9px] font-black border border-slate-200">?</span>
                                    <span className="absolute left-0 top-6 hidden group-hover:block w-72 bg-[#0f172a] text-white p-4 rounded-2xl shadow-2xl z-50 text-[10px] font-bold leading-relaxed tracking-wide uppercase border border-slate-800">
                                        ⚠️ PROTOCOLO: Este módulo se opera exclusivamente bajo saldos a favor validados por el motor Sentinel.
                                    </span>
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                        <SelectorEmpresa
                            empresaSeleccionada={empresaId}
                            onSeleccionar={(id) => {
                                setEmpresaId(id);
                                localStorage.setItem('empresaSeleccionada', id);
                            }}
                        />
                        <button
                            onClick={() => {
                                setShowModal(true);
                                handlePreValuate(selectedPeriodo);
                            }}
                            className="btn-primary py-3 px-8 text-[11px]"
                        >
                            <span>🛡️</span> NUEVO TRÁMITE
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/20 group hover:border-[#0f172a]/20 transition-all">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 group-hover:text-[#0f172a] transition-colors">Saldo Recuperable</p>
                        <p className="text-3xl font-black text-emerald-600 font-mono tracking-tighter">
                            ${devoluciones.filter(d => d.estado !== 'NEGADO').reduce((acc, curr) => acc + curr.saldoFavor, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/20 group hover:border-[#0f172a]/20 transition-all">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 group-hover:text-[#0f172a] transition-colors">Trámites en Curso</p>
                        <p className="text-3xl font-black text-[#0f172a] font-mono tracking-tighter">
                            {devoluciones.filter(d => ['PRESENTADO', 'REQUERIDO'].includes(d.estado)).length}
                        </p>
                    </div>
                    <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/20 group hover:border-emerald-50 transition-all">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 group-hover:text-emerald-600 transition-colors">Autorizados</p>
                        <p className="text-3xl font-black text-emerald-500 font-mono tracking-tighter">
                            {devoluciones.filter(d => d.estado === 'AUTORIZADO').length}
                        </p>
                    </div>
                    <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-xl shadow-slate-200/20 group hover:border-rose-50 transition-all">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 group-hover:text-rose-600 transition-colors">Dictámenes Red</p>
                        <p className="text-3xl font-black text-slate-300 font-mono tracking-tighter">0</p>
                    </div>
                </div>

                {/* Tabla Principal */}
                <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/30">
                    <div className="px-10 py-7 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-4">
                            <div className="w-1.5 h-6 bg-[#0f172a] rounded-full"></div>
                            Historial de Solicitudes Forenses
                        </h3>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Total Registros: {devoluciones.length}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-100">
                                <tr>
                                    <th className="px-10 py-6">Periodo Fiscal</th>
                                    <th className="px-10 py-6">Estado Trámite</th>
                                    <th className="px-10 py-6 text-right">Monto Solicitado</th>
                                    <th className="px-10 py-6 text-center">Protocolo ID (Hash)</th>
                                    <th className="px-10 py-6 text-center">Ejecución</th>
                                    <th className="px-10 py-6 text-right">Expediente</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-10 py-24 text-center">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="w-14 h-14 border-x-4 border-slate-100 border-t-4 border-t-[#0f172a] rounded-2xl animate-spin"></div>
                                                <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">Consultando Bóveda SAT...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : devoluciones.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-10 py-32 text-center bg-slate-50/10">
                                            <div className="max-w-xs mx-auto flex flex-col items-center">
                                                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
                                                    <span className="text-4xl grayscale opacity-30">📂</span>
                                                </div>
                                                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Sin Solicitudes Activas</h4>
                                                <p className="text-[10px] text-slate-400 font-medium mt-3 leading-relaxed uppercase">No se han formalizado trámites Art. 22 para esta empresa en el historial actual.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    devoluciones.map((dev) => (
                                        <tr key={dev.id} className="hover:bg-slate-50/30 transition-all group">
                                            <td className="px-10 py-7 font-black text-slate-900 font-mono text-sm uppercase">{dev.periodo}</td>
                                            <td className="px-10 py-7 text-center">{getEstadoBadge(dev.estado)}</td>
                                            <td className="px-10 py-7 text-right font-mono font-black text-emerald-600 text-[15px] tracking-tighter">
                                                ${dev.saldoFavor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-10 py-7 text-center">
                                                <span className="font-mono text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 inline-block uppercase truncate max-w-[120px]">
                                                    {dev.informeHash}
                                                </span>
                                            </td>
                                            <td className="px-10 py-7 text-center text-[11px] font-black text-slate-500 uppercase">{new Date(dev.createdAt).toLocaleDateString('es-MX', { year: '2-digit', month: '2-digit', day: '2-digit' })}</td>
                                            <td className="px-10 py-7 text-right">
                                                <button
                                                    onClick={() => navigate(`/devoluciones/${dev.id}`)}
                                                    className="text-[10px] font-black uppercase tracking-widest text-[#0f172a] hover:bg-[#0f172a] hover:text-white border border-[#0f172a]/20 px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-[#0f172a]/20 bg-white"
                                                >
                                                    CONSULTAR
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL NUEVO TRÁMITE */}
                {showModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="fixed inset-0 bg-[#0f172a]/70 backdrop-blur-md transition-opacity" onClick={() => setShowModal(false)}></div>
                        <div className="relative bg-white border border-slate-100 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="bg-slate-50 px-10 py-8 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                                        💼 Formalización de Trámite
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Vinculación Forense SAT-GRADE v4.0</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2.5 bg-white rounded-2xl text-slate-400 hover:text-slate-600 border border-slate-100 transition-all shadow-sm">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="p-10">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Seleccionar Periodo Fiscal Master</label>
                                <div className="flex gap-4 mb-10">
                                    <div className="relative flex-1">
                                        <input
                                            type="month"
                                            value={selectedPeriodo}
                                            onChange={(e) => handlePreValuate(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-black text-sm focus:ring-4 focus:ring-slate-500/5 focus:border-[#0f172a] outline-none transition-all uppercase appearance-none shadow-inner"
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handlePreValuate(selectedPeriodo)}
                                        className="bg-slate-100 hover:bg-slate-200 text-[#0f172a] px-6 rounded-2xl border border-slate-200 transition-all font-black text-xl flex items-center justify-center p-0"
                                    >
                                        🔄
                                    </button>
                                </div>

                                {loadingPreVal ? (
                                    <div className="py-20 text-center bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                                        <div className="w-12 h-12 border-x-4 border-slate-200 border-t-4 border-t-[#0f172a] rounded-2xl animate-spin mx-auto mb-6"></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Calculando trazabalidad forense...</p>
                                    </div>
                                ) : preVal ? (
                                    <div className="space-y-8 animate-in fade-in duration-500">
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-[#0f172a] p-6 rounded-[2rem] border border-slate-800 shadow-xl shadow-slate-900/20">
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Saldo a Favor Detectado</p>
                                                <p className="text-2xl font-black text-emerald-400 font-mono tracking-tighter">${preVal.saldoFavor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 shadow-inner flex flex-col justify-center">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Estatus Dictaminador</p>
                                                <p className={`text-xs font-black uppercase tracking-widest flex items-center gap-2 ${preVal.dictamen.resultado === 'RED' ? 'text-rose-600' : preVal.dictamen.resultado === 'YELLOW' ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    <span className={`w-2 h-2 rounded-full ${preVal.dictamen.resultado === 'RED' ? 'bg-rose-500 animate-pulse' : preVal.dictamen.resultado === 'YELLOW' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                                    {preVal.dictamen.titulo}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-90">
                                            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                                <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                                                Protocolo de Evidencias Vinculadas
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">CFDIs de Egresos Validados:</span>
                                                    <span className="font-mono text-xs font-black text-[#0f172a] px-3 py-1 bg-white rounded-lg border border-slate-200">{preVal.cfdisCount}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">Flujos de Pago (REP) Auditados:</span>
                                                    <span className="font-mono text-xs font-black text-[#0f172a] px-3 py-1 bg-white rounded-lg border border-slate-200">{preVal.pagosCount}</span>
                                                </div>
                                            </div>
                                            <div className="mt-8 p-4 bg-[#0f172a] rounded-2xl border border-slate-800 text-[9px] text-emerald-400 font-black uppercase tracking-widest leading-relaxed flex items-center gap-3">
                                                <span className="text-xl">🛡️</span>
                                                <span>Los UUIDs serán bloqueados e inyectados en la Bóveda Digital Inmutable.</span>
                                            </div>
                                        </div>

                                        {preVal.dictamen.resultado === 'RED' && (
                                            <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex gap-4 items-center animate-bounce-short">
                                                <span className="text-3xl">🛑</span>
                                                <p className="text-[10px] text-rose-700 leading-relaxed font-black uppercase tracking-wide">
                                                    ACCESO RESTRINGIDO: Dictamen CRÍTICO detectado. El SAT rechazará este trámite. Corrija las inconsistencias en Auditoría Detallada antes de proceder.
                                                </p>
                                            </div>
                                        )}

                                        {preVal.dictamen.resultado === 'YELLOW' && (
                                            <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex gap-4 items-center">
                                                <span className="text-3xl">⚠️</span>
                                                <p className="text-[10px] text-amber-700 leading-relaxed font-black uppercase tracking-wide">
                                                    ADVERTENCIA FORENSE: Se detectaron observaciones (Dictamen YELLOW). El protocolo es propenso a requerimientos de autoridad. ¿Desea formalizar bajo su responsabilidad?
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>

                            <div className="bg-slate-50 px-10 py-8 flex justify-end gap-5 border-t border-slate-100">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary py-3 px-10 text-[10px]"
                                >
                                    CANCELAR
                                </button>
                                <button
                                    onClick={handleConfirmarTramite}
                                    disabled={!preVal || preVal.dictamen.resultado === 'RED' || creando}
                                    className={`btn-primary py-3 px-10 text-[10px] min-w-[220px] shadow-xl shadow-slate-900/10 ${creando ? 'opacity-70' : ''}`}
                                >
                                    {creando ? (
                                        <div className="flex items-center gap-3">
                                            <div className="h-4 w-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                                            <span>FORMALIZANDO...</span>
                                        </div>
                                    ) : 'CONFIRMAR E INICIAR TRÁMITE'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MissionControlLayout>
    );
};

export default ListaDevolucionesPage;
