import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ContextBar from '../components/ContextBar';
import SelectorEmpresa from '../components/SelectorEmpresa';

interface Expediente {
    id: number;
    folio: string;
    nombre: string;
    montoTotalIva: number;
    cantidadCfdis: number;
    estado: string;
    fechaCreacion: string;
}

function ListaDevolucionesPage() {
    const navigate = useNavigate();
    const [expedientes, setExpedientes] = useState<Expediente[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newPeriodo, setNewPeriodo] = useState(new Date().toISOString().substring(0, 7)); // YYYY-MM
    const [creando, setCreando] = useState(false);

    const [empresaId, setEmpresaId] = useState<string | null>(null);

    useEffect(() => {
        if (empresaId) {
            fetchExpedientes();
        }
    }, [empresaId]);

    const fetchExpedientes = async () => {
        try {
            // Using existing logic but filtering context if needed
            const res = await axios.get(`/api/expedientes?empresaId=${empresaId}`);
            setExpedientes(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        setCreando(true);
        try {
            await axios.post('/api/expedientes/periodo', {
                empresaId,
                periodo: newPeriodo,
                nombre: `Devolución IVA - ${newPeriodo}`
            });
            setShowModal(false);
            fetchExpedientes();
        } catch (err: any) {
            alert('Error creando expediente: ' + (err.response?.data?.message || err.message));
        } finally {
            setCreando(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'borrador': return 'text-gray-400 bg-gray-800';
            case 'enviado': return 'text-blue-400 bg-blue-900/30';
            case 'aprobado': return 'text-green-400 bg-green-900/30';
            case 'rechazado': return 'text-red-400 bg-red-900/30';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex justify-end">
                <SelectorEmpresa
                    empresaSeleccionada={empresaId}
                    onSeleccionar={setEmpresaId}
                />
            </div>

            <ContextBar
                empresaNombre={empresaId || ''} // TODO: lookup Name
                empresaRfc="TVA060209QL6" // Placeholder, should be dyn
                periodoLabel={newPeriodo}
                modo="recibidos"
                subModo="devoluciones"
            />

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Devoluciones de IVA</h1>
                        <p className="text-gray-400 text-sm mt-1">Gestión de trámites ante el SAT (FED)</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <span>➕</span> Nuevo Trámite
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-800 p-4 rounded border border-gray-700">
                        <p className="text-xs text-gray-500 uppercase font-bold">Saldo a Favor Total</p>
                        <p className="text-2xl font-mono font-bold text-green-400 mt-1">
                            ${expedientes.reduce((acc, curr) => acc + curr.montoTotalIva, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded border border-gray-700">
                        <p className="text-xs text-gray-500 uppercase font-bold">Trámites Activos</p>
                        <p className="text-2xl font-mono font-bold text-indigo-400 mt-1">
                            {expedientes.filter(e => e.estado !== 'completado').length}
                        </p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded border border-gray-700">
                        <p className="text-xs text-gray-500 uppercase font-bold">Efectividad</p>
                        <p className="text-2xl font-mono font-bold text-yellow-400 mt-1">100%</p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-bold uppercase text-xs">Folio</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs">Periodo / Nombre</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs text-right">Saldo a Favor</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs text-center">CFDIs</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs text-center">Estado</th>
                                <th className="px-6 py-4 font-bold uppercase text-xs text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center">Cargando...</td></tr>
                            ) : expedientes.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No hay devoluciones registradas</td></tr>
                            ) : (
                                expedientes.map((exp) => (
                                    <tr key={exp.id} className="hover:bg-gray-750 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-gray-300">{exp.folio}</td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-200">{exp.nombre}</p>
                                            <p className="text-xs text-gray-500">{new Date(exp.fechaCreacion).toLocaleDateString()}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-green-400 font-bold">
                                            ${exp.montoTotalIva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">{exp.cantidadCfdis}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(exp.estado)}`}>
                                                {exp.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => navigate(`/devoluciones/${exp.id}`)}
                                                className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
                                            >
                                                Ver Detalle &rarr;
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Create */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700 shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Nueva Solicitud de Devolución</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-400 mb-2">Periodo Fiscal</label>
                            <input
                                type="month"
                                value={newPeriodo}
                                onChange={(e) => setNewPeriodo(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        <div className="bg-blue-900/20 p-3 rounded border border-blue-800 mb-6">
                            <p className="text-xs text-blue-300">
                                ℹ️ El sistema buscará automáticamente todos los CFDI de Egresos (Gastos) del periodo seleccionado y calculará el IVA acreditable.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creando}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold disabled:opacity-50 flex items-center gap-2"
                            >
                                {creando && <span className="animate-spin">⏳</span>}
                                {creando ? 'Procesando...' : 'Generar Expediente'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ListaDevolucionesPage;
