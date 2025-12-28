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
            'BORRADOR': 'bg-gray-800 text-gray-400 border-gray-700',
            'PRESENTADO': 'bg-blue-900/40 text-blue-300 border-blue-700',
            'REQUERIDO': 'bg-orange-900/40 text-orange-300 border-orange-700',
            'AUTORIZADO': 'bg-green-900/40 text-green-300 border-green-700',
            'NEGADO': 'bg-red-900/40 text-red-300 border-red-700',
        };
        return (
            <span className={`px-2 py-1 rounded text-[10px] font-bold border ${styles[estado] || styles['BORRADOR']}`}>
                {estado}
            </span>
        );
    };

    return (
        <MissionControlLayout title="Devoluciones de IVA">
            {/* Header Contextual */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-2 uppercase tracking-widest"
                    >
                        ← Volver al Dashboard
                    </button>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Gestión de Trámites FED (Art. 22 CFF)</h2>
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                        Este módulo es exclusivamente para la <strong>formalización y seguimiento</strong> de trámites ante el SAT.
                        <span className="group relative cursor-help">
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">?</span>
                            <span className="absolute left-0 top-6 hidden group-hover:block w-64 bg-gray-900 border border-indigo-500/50 p-2 rounded shadow-2xl z-50 text-[10px] text-indigo-100 font-medium">
                                ⚠️ RIESGO: Este módulo se usa SOLO cuando existe saldo a favor validado por el motor Sentinel.
                            </span>
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
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
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                    >
                        <span>🛡️</span> Nuevo Trámite
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#0B0E14] border border-gray-800 p-5 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Saldo Recuperable</p>
                    <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                        ${devoluciones.filter(d => d.estado !== 'NEGADO').reduce((acc, curr) => acc + curr.saldoFavor, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-[#0B0E14] border border-gray-800 p-5 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trámites en Curso</p>
                    <p className="text-2xl font-bold text-blue-400 font-mono mt-1">
                        {devoluciones.filter(d => ['PRESENTADO', 'REQUERIDO'].includes(d.estado)).length}
                    </p>
                </div>
                <div className="bg-[#0B0E14] border border-gray-800 p-5 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Autorizados</p>
                    <p className="text-2xl font-bold text-green-500 font-mono mt-1">
                        {devoluciones.filter(d => d.estado === 'AUTORIZADO').length}
                    </p>
                </div>
                <div className="bg-[#0B0E14] border border-gray-800 p-5 rounded-xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dictámenes Red</p>
                    <p className="text-2xl font-bold text-rose-500 font-mono mt-1">0</p>
                </div>
            </div>

            {/* Tabla Principal */}
            <div className="bg-[#0B0E14] border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/30 flex justify-between items-center">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                        Historial de Solicitudes Oficiales
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-[10px] text-gray-500 uppercase bg-gray-950 border-b border-gray-800">
                            <tr>
                                <th className="px-6 py-3 font-bold">Periodo</th>
                                <th className="px-6 py-3 font-bold">Estado</th>
                                <th className="px-6 py-3 font-bold text-right">Saldo a Favor</th>
                                <th className="px-6 py-3 font-bold text-center">Informe Hash</th>
                                <th className="px-6 py-3 font-bold text-center">Creado</th>
                                <th className="px-6 py-3 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="animate-pulse flex flex-col items-center">
                                            <div className="h-4 w-48 bg-gray-800 rounded mb-4"></div>
                                            <span>Consultando bóveda de trámites...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : devoluciones.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="max-w-xs mx-auto">
                                            <p className="text-3xl mb-4">📂</p>
                                            <p className="text-gray-400 font-bold text-sm">Aún no has creado trámites de devolución.</p>
                                            <p className="text-gray-600 text-[11px] mt-2">Genera primero un Informe SAT-GRADE en Auditoría Detallada para habilitar el trámite.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                devoluciones.map((dev) => (
                                    <tr key={dev.id} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-200">{dev.periodo}</td>
                                        <td className="px-6 py-4">{getEstadoBadge(dev.estado)}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold text-emerald-400">
                                            ${dev.saldoFavor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-[10px] text-indigo-400/60 ">{dev.informeHash}</td>
                                        <td className="px-6 py-4 text-center text-xs text-gray-500">{new Date(dev.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate(`/devoluciones/${dev.id}`)}
                                                className="text-indigo-400 hover:text-white font-bold text-xs uppercase tracking-wider border border-indigo-500/30 px-3 py-1.5 rounded hover:bg-indigo-600 transition-all"
                                            >
                                                Ver Expediente
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="relative bg-[#0D1117] border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-900/50 to-gray-900 px-6 py-4 border-b border-gray-800">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                💼 Nuevo Trámite de Devolución
                            </h3>
                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Vinculación Forense SAT-GRADE</p>
                        </div>

                        <div className="p-6">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Seleccionar Periodo Fiscal</label>
                            <div className="flex gap-2 mb-6">
                                <input
                                    type="month"
                                    value={selectedPeriodo}
                                    onChange={(e) => handlePreValuate(e.target.value)}
                                    className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button
                                    onClick={() => handlePreValuate(selectedPeriodo)}
                                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 rounded-lg border border-gray-600"
                                >
                                    🔄
                                </button>
                            </div>

                            {loadingPreVal ? (
                                <div className="py-12 text-center text-gray-500">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                                    <p className="text-xs font-mono">Calculando trazabalidad forense...</p>
                                </div>
                            ) : preVal ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                            <p className="text-[9px] font-bold text-gray-600 uppercase">Saldo a Favor</p>
                                            <p className="text-lg font-bold text-emerald-400 font-mono">${preVal.saldoFavor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div className="bg-gray-950 p-3 rounded-lg border border-gray-800">
                                            <p className="text-[9px] font-bold text-gray-600 uppercase">Dictamen</p>
                                            <p className={`text-xs font-bold ${preVal.dictamen.resultado === 'RED' ? 'text-rose-500' : 'text-green-500'}`}>
                                                {preVal.dictamen.titulo}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-950/50 p-4 rounded-lg border border-gray-800">
                                        <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3 border-b border-gray-800 pb-2">Evidencias Vinculadas</h4>
                                        <div className="flex justify-between items-center text-xs mb-2">
                                            <span className="text-gray-400">CFDIs de Gastos:</span>
                                            <span className="font-mono text-white">{preVal.cfdisCount}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs mb-4">
                                            <span className="text-gray-400">Complementos de Pago:</span>
                                            <span className="font-mono text-white">{preVal.pagosCount}</span>
                                        </div>
                                        <div className="p-2 bg-indigo-500/5 border border-indigo-500/20 rounded text-[10px] text-indigo-300">
                                            🛡️ Los UUIDs serán bloqueados e inyectados en el expediente digital.
                                        </div>
                                    </div>

                                    {preVal.dictamen.resultado === 'RED' && (
                                        <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg flex gap-3">
                                            <span className="text-xl">🛑</span>
                                            <p className="text-[10px] text-red-400 leading-relaxed font-bold">
                                                ACCESO DENEGADO: No se puede proceder con este trámite. El informe presenta riesgos críticos (Dictamen RED). Por favor corrija en Auditoría Detallada.
                                            </p>
                                        </div>
                                    )}

                                    {preVal.dictamen.resultado === 'YELLOW' && (
                                        <div className="p-4 bg-yellow-900/20 border border-yellow-700/30 rounded-lg flex gap-3">
                                            <span className="text-xl">⚠️</span>
                                            <p className="text-[10px] text-yellow-400 leading-relaxed font-bold">
                                                ADVERTENCIA: El informe tiene observaciones (YELLOW). Producirá requerimientos del SAT. ¿Desea continuar bajo su responsabilidad?
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        <div className="bg-gray-950 px-6 py-4 flex justify-end gap-3 border-t border-gray-800">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white uppercase transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmarTramite}
                                disabled={!preVal || preVal.dictamen.resultado === 'RED' || creando}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-bold text-xs uppercase shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
                            >
                                {creando ? 'Formalizando...' : 'Confirmar e Iniciar Trámite'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MissionControlLayout>
    );
};

export default ListaDevolucionesPage;
