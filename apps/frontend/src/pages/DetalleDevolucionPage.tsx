import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import ContextBar from '../components/ContextBar';

function DetalleDevolucionPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('resumen');
    const [expediente, setExpediente] = useState<any>(null);
    const [cedulas, setCedulas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        fetchCedulas();
    }, [id]);

    const fetchData = async () => {
        try {
            const res = await axios.get(`/api/expedientes/${id}`);
            setExpediente(res.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchCedulas = async () => {
        try {
            const res = await axios.get(`/api/expedientes/${id}/cedulas`);
            setCedulas(res.data);
        } catch (err) { console.error(err); }
    };

    const handleDownloadZip = () => {
        window.open(`/api/expedientes/${id}/descargar-zip`, '_blank');
    };

    if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Cargando expediente...</div>;
    if (!expediente) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">No encontrado.</div>;

    const { expediente: info, resumen } = expediente;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            <ContextBar
                empresaNombre="TRL980520REQ"
                empresaRfc="TRL980520REQ"
                periodoLabel={info.folio.split('-')[1] || "HISTÓRICO"}
                modo="recibidos"
                subModo="devoluciones"
            />

            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-6">
                <div className="max-w-7xl mx-auto flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <button onClick={() => navigate('/devoluciones')} className="text-gray-500 hover:text-white">&larr; Volver</button>
                            <span className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-xs font-mono">{info.folio}</span>
                            <span className="bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded text-xs font-bold uppercase">{info.estado}</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">{info.nombre}</h1>
                        <p className="text-gray-400 text-sm mt-1">{info.descripcion}</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 font-medium">
                            📝 Editar
                        </button>
                        <button onClick={handleDownloadZip} className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded font-bold shadow-lg flex items-center gap-2">
                            💾 Descargar Legajo ZIP
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 flex gap-6">
                    {['resumen', 'cedulas', 'documentacion', 'estatus'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-3 px-1 text-sm font-bold border-b-2 transition-colors uppercase ${activeTab === tab
                                ? 'border-indigo-500 text-white'
                                : 'border-transparent text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {activeTab === 'resumen' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-800 rounded p-6 border border-gray-700">
                            <h3 className="text-lg font-bold text-white mb-4">Determinación del Saldo a Favor</h3>
                            <div className="space-y-4">
                                <Row label="Monto Total Facturado" value={info.montoTotalFacturas} />
                                <Row label="IVA Trasladado (No Acreditable)" value={0} />
                                <div className="border-t border-gray-700 pt-2">
                                    <Row label="IVA Acreditable (Saldo a Favor)" value={info.montoTotalIva} highlight />
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-800 rounded p-6 border border-gray-700">
                            <h3 className="text-lg font-bold text-white mb-4">Estadísticas del Expediente</h3>
                            <div className="space-y-4">
                                <RowLite label="Número de Proveedores" value={cedulas.length} />
                                <RowLite label="Total de Facturas" value={info.cantidadCfdis} />
                                <RowLite label="Evidencias Materialidad" value={resumen.totalEvidencias} />
                                <RowLite label="Porcentaje de Blindaje" value={`${Math.round((resumen.totalEvidencias / (info.cantidadCfdis * 3)) * 100)}%`} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'cedulas' && (
                    <div className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
                        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-gray-200">Cédula Analítica por Proveedor (A-29)</h3>
                            <button className="text-xs text-indigo-400 hover:text-white">Exportar Excel</button>
                        </div>
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-900 text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">RFC</th>
                                    <th className="px-4 py-3">Razón Social</th>
                                    <th className="px-4 py-3 text-center">Tipo</th>
                                    <th className="px-4 py-3 text-right">Total Operación</th>
                                    <th className="px-4 py-3 text-right text-green-400">IVA Acreditable</th>
                                    <th className="px-4 py-3 text-center">Facturas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 text-gray-300">
                                {cedulas.length > 0 ? cedulas.map((ced, i) => (
                                    <tr key={i} className="hover:bg-gray-750">
                                        <td className="px-4 py-2 font-mono">{ced.rfcProveedor}</td>
                                        <td className="px-4 py-2 truncate max-w-[200px]">{ced.nombreProveedor}</td>
                                        <td className="px-4 py-2 text-center text-gray-500">{ced.tipoTercero}</td>
                                        <td className="px-4 py-2 text-right">${ced.totalOperacion.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-2 text-right font-bold text-green-400">${ced.ivaAcreditable.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                        <td className="px-4 py-2 text-center">{ced.numeroFacturas}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={6} className="p-4 text-center">No hay cédulas generadas</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'documentacion' && (
                    <div className="bg-gray-800 rounded border border-gray-700 p-8 text-center">
                        <p className="text-gray-400">Implementación de visor detallado pendiente. Use "Descargar ZIP" para ver el legajo completo.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const Row = ({ label, value, highlight = false }: any) => (
    <div className={`flex justify-between items-center ${highlight ? 'text-green-400 font-bold text-lg' : 'text-gray-300'}`}>
        <span>{label}</span>
        <span className="font-mono">${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
    </div>
);

const RowLite = ({ label, value }: any) => (
    <div className="flex justify-between items-center text-gray-400">
        <span>{label}</span>
        <span className="font-medium text-gray-200">{value}</span>
    </div>
);

export default DetalleDevolucionPage;
