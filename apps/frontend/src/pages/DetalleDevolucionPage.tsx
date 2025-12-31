import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import MissionControlLayout from '../components/MissionControlLayout';

interface DevolucionDetalle {
    id: number;
    empresaId: string;
    periodo: string;
    saldoFavor: number;
    informeHash: string;
    estado: string;
    uuidsCfdi: string[];
    uuidsComplementos: string[];
    createdAt: number;
}

const DetalleDevolucionPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<DevolucionDetalle | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('resumen');

    useEffect(() => {
        const fetchDetalle = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/api/devoluciones/${id}`);
                setData(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetalle();
    }, [id]);

    if (loading) {
        return (
            <MissionControlLayout title="Expediente de Devolución">
                <div className="flex flex-col items-center justify-center h-[500px] gap-6 animate-in fade-in duration-500">
                    <div className="w-14 h-14 border-x-4 border-slate-100 border-t-4 border-t-[#0f172a] rounded-2xl animate-spin"></div>
                    <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-[0.3em]">Recuperando Expediente Forense...</p>
                </div>
            </MissionControlLayout>
        );
    }

    if (!data) {
        return (
            <MissionControlLayout title="Error">
                <div className="flex flex-col items-center justify-center py-40 gap-8 animate-in zoom-in-95">
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-5xl shadow-2xl border border-slate-100">🚫</div>
                    <div className="text-center">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Expediente no Identificado</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">No se encontró correlación en la bóveda de trámites.</p>
                    </div>
                    <button onClick={() => navigate('/devoluciones')} className="btn-secondary px-8 py-3">VOLVER AL HISTORIAL</button>
                </div>
            </MissionControlLayout>
        );
    }

    return (
        <MissionControlLayout title={`Expediente: ${data.periodo}`}>
            <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <button
                            onClick={() => navigate('/devoluciones')}
                            className="btn-secondary py-2 px-4 mb-4 text-[10px]"
                        >
                            <span>←</span> HISTORIAL
                        </button>
                        <div className="flex flex-wrap items-center gap-5">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Expediente Digital <span className="text-slate-300 ml-1">#{data.id}</span></h2>
                            <div className="badge-success">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {data.estado}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-3">
                            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Periodo Determinado: <span className="text-slate-900">{data.periodo}</span> • ID Sistema: <span className="text-slate-900">{data.id}</span></p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="btn-primary py-3.5 px-8 shadow-xl shadow-slate-900/10 active:scale-95 transition-all">
                            <span>📄</span> DESCARGAR ACUSE FED
                        </button>
                    </div>
                </div>

                {/* Quick View Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-125">
                            <span className="text-6xl grayscale">💰</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 group-hover:text-emerald-600 transition-colors">Saldo Solicitado (IVA)</p>
                        <p className="text-3xl font-black text-emerald-600 font-mono tracking-tighter">
                            ${data.saldoFavor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-125">
                            <span className="text-6xl grayscale">🔗</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 group-hover:text-[#0f172a] transition-colors">Hash de Integridad Forense</p>
                        <div className="relative">
                            <p className="text-xs font-black text-slate-900 font-mono break-all leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-inner">
                                {data.informeHash}
                            </p>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-4 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            Inmutable • Sentinel Certified
                        </p>
                    </div>
                    <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-125">
                            <span className="text-6xl grayscale">📅</span>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 group-hover:text-[#0f172a] transition-colors">Timestamp de Envío</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter uppercase mt-1">
                            {new Date(data.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-[0.2em] font-mono">Hora: {new Date(data.createdAt).toLocaleTimeString()}</p>
                    </div>
                </div>

                {/* Tabs de Detalle */}
                <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/40 min-h-[500px]">
                    <div className="bg-slate-50/50 px-10 border-b border-slate-100 flex gap-10">
                        {['resumen', 'cfdis', 'pagos', 'log sistema'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.split(' ')[0])}
                                className={`py-6 text-[11px] font-black uppercase tracking-[0.3em] transition-all relative group ${activeTab === tab.split(' ')[0] ? 'text-[#0f172a]' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {tab}
                                {activeTab === tab.split(' ')[0] && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0f172a] rounded-t-full shadow-[0_-2px_8px_rgba(15,23,42,0.3)] animate-in slide-in-from-bottom-2"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-12">
                        {activeTab === 'resumen' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 animate-in fade-in duration-500">
                                <div className="space-y-10">
                                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                                        <div className="w-1.5 h-5 bg-[#0f172a] rounded-full shadow-lg shadow-slate-900/20"></div>
                                        Diagnóstico de la Solicitud
                                    </h4>
                                    <div className="space-y-8">
                                        <div className="flex items-start gap-6 group">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-all duration-300">✓</div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Certificación de Saldo Favor</p>
                                                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-medium uppercase">El saldo fue auditado 1x1 contra el repositorio fiscal inmutable en el momento de la creación mediante el motor Sentinel.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-6 group">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-sm group-hover:scale-110 transition-all duration-300">✓</div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Vinculación de Pagos Certificados</p>
                                                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-medium uppercase">Se detectaron y vincularon <span className="text-[#0f172a] font-black">{data.uuidsComplementos.length}</span> complementos de pago necesarios para acreditar el flujo de efectivo ante el SAT.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 shadow-inner">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Protocolo de Acreditamiento (IVA)</h4>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center border-b border-white pb-6">
                                            <span className="text-[11px] font-black text-slate-400 uppercase">Monto Total del Trámite</span>
                                            <span className="text-xl font-black text-slate-900 font-mono tracking-tighter">${data.saldoFavor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b border-white pb-6">
                                            <span className="text-[11px] font-black text-slate-400 uppercase">Reserva para Requerimientos</span>
                                            <span className="text-xl font-black text-slate-300 font-mono tracking-tighter">$0.00</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-4">
                                            <span className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-3">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                Estatus del Expediente
                                            </span>
                                            <span className="text-xl font-black text-emerald-600 tracking-tighter uppercase">{data.estado}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'cfdis' && (
                            <div className="animate-in slide-in-from-bottom-2 duration-500">
                                <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
                                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Bóveda Forense de UUIDs (Ingresos/Gastos)</h4>
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-white px-4 py-1.5 rounded-xl border border-slate-100 shadow-sm">{data.uuidsCfdi.length} Documentos Vinculados</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.uuidsCfdi.map((uuid, i) => (
                                        <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-[#0f172a] hover:bg-white transition-all shadow-sm hover:shadow-xl hover:shadow-slate-200/50">
                                            <span className="font-mono text-[11px] font-bold text-slate-500 group-hover:text-slate-900 select-all tracking-tight uppercase">{uuid}</span>
                                            <button className="opacity-0 group-hover:opacity-100 bg-[#0f172a] text-white text-[9px] font-black px-4 py-2 rounded-xl transition-all shadow-lg shadow-slate-900/10 uppercase tracking-widest">VISUALIZAR</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'pagos' && (
                            <div className="animate-in slide-in-from-bottom-2 duration-500">
                                <div className="flex justify-between items-center mb-10 pb-6 border-b border-slate-100">
                                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">Relaciones de Complementos de Pago (REP)</h4>
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-white px-4 py-1.5 rounded-xl border border-slate-100 shadow-sm">{data.uuidsComplementos.length} Flujos Auditados</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.uuidsComplementos.map((uuid, i) => (
                                        <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-emerald-500 hover:bg-emerald-50/10 transition-all shadow-sm">
                                            <span className="font-mono text-[11px] font-bold text-slate-500 group-hover:text-emerald-700 select-all tracking-tight uppercase">{uuid}</span>
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-lg uppercase tracking-widest shadow-sm">PAGO 2.0</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MissionControlLayout>
    );
};

export default DetalleDevolucionPage;
