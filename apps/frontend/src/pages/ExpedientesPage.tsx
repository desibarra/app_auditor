import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Expediente {
    id: number;
    folio: string;
    nombre: string;
    montoTotalIva: number;
    cantidadCfdis: number;
    estado: string;
    fechaCreacion: string;
}

import MissionControlLayout from '../components/MissionControlLayout';

function ExpedientesPage() {
    const navigate = useNavigate();

    // 1. Inicialización Robusta (Lazy State)
    const [empresaActiva, setEmpresaActiva] = useState<string>(() => {
        return localStorage.getItem('empresaSeleccionada') || '';
    });

    const [expedientes, setExpedientes] = useState<Expediente[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado para Generador Universal (Default: Mes Actual)
    const [anio, setAnio] = useState(2025);
    const [mes, setMes] = useState(11); // Default Noviembre para demo
    const [generandoZip, setGenerandoZip] = useState(false);

    useEffect(() => {
        // Doble check al montar
        const storedId = localStorage.getItem('empresaSeleccionada');
        if (storedId) {
            setEmpresaActiva(storedId);
            fetchExpedientes(storedId);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchExpedientes = async (empresaId: string) => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/expedientes?empresaId=${empresaId}`);
            setExpedientes(response.data);
        } catch (error) {
            console.error('Error al cargar expedientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const descargarLegajoUniversal = async () => {
        // ... (Logic kept same)
        let targetEmpresaId = empresaActiva;
        if (!targetEmpresaId) {
            targetEmpresaId = localStorage.getItem('empresaSeleccionada') || '';
        }

        if (!targetEmpresaId) {
            if (confirm('⚠️ No se ha detectado una empresa activa. ¿Deseas ir al Dashboard para seleccionarla?')) {
                navigate('/dashboard');
            }
            return;
        }

        try {
            setGenerandoZip(true);
            const response = await axios.post('/api/legajo/exportar', {
                empresaId: targetEmpresaId, // Usar el ID validado
                anio,
                mes
            }, {
                responseType: 'blob'
            });

            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                const json = JSON.parse(text);
                throw new Error(json.message || 'Error del servidor');
            }

            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
            const link = document.createElement('a');
            link.href = url;
            const nombreArchivo = `Legajo_Fiscal_${anio}_${mes.toString().padStart(2, '0')}.zip`;
            link.setAttribute('download', nombreArchivo);

            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                link.remove();
                window.URL.revokeObjectURL(url);
            }, 100);
        } catch (error: any) {
            console.error('❌ Error generando Legajo:', error);
            let mensajeError = 'Hubo un problema al generar el archivo ZIP.';
            if (error.response && error.response.data instanceof Blob) {
                try {
                    const text = await error.response.data.text();
                    const json = JSON.parse(text);
                    if (json.message) mensajeError = json.message;
                } catch (e) { /* Fallback */ }
            } else if (error.message) {
                mensajeError = error.message;
            }
            alert(`⚠️ No se pudo descargar el legajo:\n\n${mensajeError}`);
        } finally {
            setGenerandoZip(false);
        }
    };

    if (loading) {
        return (
            <MissionControlLayout title="Archivo Digital Maestro">
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            </MissionControlLayout>
        );
    }

    if (!empresaActiva) {
        return (
            <MissionControlLayout title="Archivo Digital Maestro">
                <div className="max-w-4xl mx-auto p-8 text-center mt-10 border border-yellow-700/50 bg-yellow-900/10 rounded-xl">
                    <div className="mx-auto h-12 w-12 text-yellow-500 flex items-center justify-center text-3xl mb-4">⚠️</div>
                    <h2 className="text-lg font-bold text-white">Empresa No Seleccionada</h2>
                    <p className="mt-2 text-gray-400">Para manejar el Archivo Digital, selecciona una empresa activa.</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                    >
                        Ir al Dashboard
                    </button>
                </div>
            </MissionControlLayout>
        );
    }

    return (
        <MissionControlLayout title="CENTRO DE GESTIÓN DE MATERIALIDAD">
            <div className="flex flex-col h-full space-y-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-gray-400 hover:text-white font-bold py-2 px-3 rounded border border-gray-800 hover:bg-gray-800 transition-all flex items-center gap-2 text-xs uppercase tracking-wider"
                    >
                        ← Volver al Centro de Mando
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span className="text-indigo-400 text-xs font-bold tracking-widest">SISTEMA DE EVIDENCIA ACTIVO</span>
                    </div>
                </div>

                {/* SECCIÓN PRINCIPAL: GENERADOR DE LEGAJO */}
                <div className="fiscal-card p-0 relative overflow-hidden group border-indigo-500/30">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-indigo-600/20 transition-all duration-700"></div>

                    <div className="p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </span>
                                <h2 className="text-xl font-bold text-white tracking-tight">Generador de Cierre Mensual</h2>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                                Generación de expediente maestro inmutable (ZIP). Incluye XMLs validados, compulsas contra SAT, y reporte de materialidad para defensa fiscal.
                            </p>

                            <div className="mt-6 flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-500">✓</span> Validación XML
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-500">✓</span> Reporte PDF
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-500">✓</span> Hash de Integridad
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-end gap-4 bg-[#0B0E14] p-6 rounded-lg border border-gray-800 shadow-xl">
                            <div className="flex gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Año Fiscal</label>
                                    <select
                                        value={anio}
                                        onChange={(e) => setAnio(Number(e.target.value))}
                                        className="block w-28 bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none font-mono hover:border-gray-600 transition-colors"
                                    >
                                        <option value={2024}>2024</option>
                                        <option value={2025}>2025</option>
                                        <option value={2026}>2026</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-widest">Periodo</label>
                                    <select
                                        value={mes}
                                        onChange={(e) => setMes(Number(e.target.value))}
                                        className="block w-40 bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none font-mono hover:border-gray-600 transition-colors"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {new Date(0, i).toLocaleString('es-MX', { month: 'long' }).toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={descargarLegajoUniversal}
                                disabled={generandoZip}
                                className={`inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-xs font-bold uppercase tracking-wider rounded-md text-white transition-all
                                    ${generandoZip
                                        ? 'bg-gray-800 cursor-not-allowed opacity-75'
                                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 active:translate-y-0.5'}`}
                            >
                                {generandoZip ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        Generar Legajo
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* HISTORIAL */}
                <div className="flex-1">
                    <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span> Historial de Expedientes
                    </h3>

                    {expedientes.length === 0 ? (
                        <div className="text-center py-20 fiscal-card border-dashed border-gray-800 bg-gray-900/30">
                            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800">
                                <span className="text-2xl opacity-30 text-gray-500">📁</span>
                            </div>
                            <p className="text-gray-300 font-bold text-sm">Sin expedientes generados</p>
                            <p className="text-gray-500 text-xs mt-2 max-w-sm mx-auto">
                                No se encontraron cierres mensuales previos.
                            </p>
                        </div>
                    ) : (
                        <div className="fiscal-card overflow-hidden">
                            <div className="relative overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-400">
                                    <thead className="text-[10px] text-gray-500 uppercase bg-gray-900/50 border-b border-gray-800">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 font-bold tracking-wider">Folio</th>
                                            <th scope="col" className="px-6 py-3 font-bold tracking-wider">Nombre</th>
                                            <th scope="col" className="px-6 py-3 font-bold tracking-wider">Fecha Creación</th>
                                            <th scope="col" className="px-6 py-3 font-bold tracking-wider text-center">Estado</th>
                                            <th scope="col" className="px-6 py-3 font-bold tracking-wider text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {expedientes.map((exp) => (
                                            <tr key={exp.id} className="bg-transparent hover:bg-gray-800/30 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs text-white">
                                                    {exp.folio}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-300">
                                                    {exp.nombre}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs">
                                                    {new Date(exp.fechaCreacion).toLocaleDateString('es-MX')}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${exp.estado === 'COMPLETO'
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                        }`}>
                                                        {exp.estado}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-indigo-400 hover:text-white text-xs font-bold uppercase tracking-wide transition-colors">
                                                        Ver Detalle
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MissionControlLayout>
    );
}

export default ExpedientesPage;
