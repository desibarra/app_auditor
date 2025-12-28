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
                <div className="flex flex-col items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            </MissionControlLayout>
        );
    }

    if (!data) {
        return (
            <MissionControlLayout title="Error">
                <div className="text-center py-20">
                    <p className="text-xl text-gray-500">Expediente no encontrado</p>
                    <button onClick={() => navigate('/devoluciones')} className="mt-4 text-indigo-400 font-bold uppercase text-xs">Volver a la lista</button>
                </div>
            </MissionControlLayout>
        );
    }

    return (
        <MissionControlLayout title={`Expediente: ${data.periodo}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <button
                        onClick={() => navigate('/devoluciones')}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-2 uppercase tracking-widest"
                    >
                        ← Volver a la Lista
                    </button>
                    <div className="flex items-center gap-4">
                        <h2 className="text-3xl font-bold text-white tracking-tight">Expediente Digital #{data.id}</h2>
                        <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase rounded-full tracking-widest">
                            {data.estado}
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">Periodo Determinado: {data.periodo} • ID Sistema: {data.id}</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all">
                        📄 Descargar Acuse
                    </button>
                </div>
            </div>

            {/* Quick View Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#0B0E14] border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-4xl">💰</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Saldo Solicitado (IVA)</p>
                    <p className="text-3xl font-bold text-emerald-400 font-mono tracking-tighter">
                        ${data.saldoFavor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-[#0B0E14] border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-4xl">🔗</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Hash de Integridad Forense</p>
                    <p className="text-lg font-bold text-indigo-300 font-mono break-all leading-tight mt-2">
                        {data.informeHash}
                    </p>
                    <p className="text-[9px] text-gray-600 mt-2 uppercase tracking-widest">Inmutable • Sentinel Certified</p>
                </div>
                <div className="bg-[#0B0E14] border border-gray-800 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="text-4xl">📅</span>
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Fecha de Generación</p>
                    <p className="text-xl font-bold text-gray-200 mt-1">
                        {new Date(data.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[9px] text-gray-600 mt-1 uppercase tracking-widest">Hora: {new Date(data.createdAt).toLocaleTimeString()}</p>
                </div>
            </div>

            {/* Tabs de Detalle */}
            <div className="bg-[#0B0E14] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="bg-gray-950 px-6 py-2 border-b border-gray-800 flex gap-8">
                    {['resumen', 'cfdis', 'pagos', 'log'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-3 text-[10px] font-bold uppercase tracking-[2px] transition-all border-b-2 ${activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-600 hover:text-gray-400'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {activeTab === 'resumen' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div>
                                <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6 border-b border-gray-800 pb-2">Diagnóstico de la Solicitud</h4>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">✓</div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-200">Certificación de Saldo</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">El saldo fue auditado 1x1 contra el repositorio fiscal inmutable en el momento de la creación.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">✓</div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-200">Vinculación de Pagos</p>
                                            <p className="text-[11px] text-gray-500 mt-0.5">Se detectaron y vincularon {data.uuidsComplementos.length} complementos de pago necesarios para acreditar el IVA.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-950 p-6 rounded-xl border border-gray-800">
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Acredidatamiento de IVA</h4>
                                <div className="space-y-4 font-mono text-sm px-2">
                                    <div className="flex justify-between border-b border-gray-900 pb-2">
                                        <span className="text-gray-500">Monto del Trámite</span>
                                        <span className="text-gray-200 font-bold">${data.saldoFavor.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-900 pb-2">
                                        <span className="text-gray-500">Saldo Pendiente</span>
                                        <span className="text-gray-200">${data.saldoFavor.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-400 font-bold pt-2">
                                        <span>ESTATUS ACTUAL</span>
                                        <span>SOLICITADO</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'cfdis' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-xs font-bold text-white uppercase tracking-widest">Listado Forense de UUIDs (Ingresos/Gastos)</h4>
                                <span className="text-[10px] text-gray-500 font-mono">{data.uuidsCfdi.length} registros vinculados</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {data.uuidsCfdi.map((uuid, i) => (
                                    <div key={i} className="bg-gray-950 p-3 rounded border border-gray-800 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                        <span className="font-mono text-[10px] text-gray-400 select-all">{uuid}</span>
                                        <button className="opacity-0 group-hover:opacity-100 text-indigo-400 text-[10px] font-bold">VER</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'pagos' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-xs font-bold text-white uppercase tracking-widest">Vínculos de Complementos de Pago</h4>
                                <span className="text-[10px] text-gray-500 font-mono">{data.uuidsComplementos.length} relaciones detectadas</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {data.uuidsComplementos.map((uuid, i) => (
                                    <div key={i} className="bg-gray-950 p-3 rounded border border-gray-800 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                                        <span className="font-mono text-[10px] text-gray-400 select-all">{uuid}</span>
                                        <span className="px-1.5 py-0.5 bg-emerald-900/40 text-emerald-400 text-[8px] font-bold rounded">PAGO 2.0</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MissionControlLayout>
    );
};

export default DetalleDevolucionPage;
