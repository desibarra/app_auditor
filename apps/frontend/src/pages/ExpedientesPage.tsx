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
        return localStorage.getItem('empresaActiva') || '';
    });

    const [expedientes, setExpedientes] = useState<Expediente[]>([]);
    const [loading, setLoading] = useState(true);

    // Estado para Generador Universal (Default: Mes Actual)
    const [anio, setAnio] = useState(2025);
    const [mes, setMes] = useState(11); // Default Noviembre para demo
    const [generandoZip, setGenerandoZip] = useState(false);

    useEffect(() => {
        // Doble check al montar
        const storedId = localStorage.getItem('empresaActiva');
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
            targetEmpresaId = localStorage.getItem('empresaActiva') || '';
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
        <MissionControlLayout title="Archivo Digital Maestro">
            <div className="flex flex-col h-full space-y-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 px-4 rounded border border-gray-700 transition-colors flex items-center gap-2 text-sm"
                    >
                        ← Regresar al Dashboard
                    </button>
                </div>

                {/* SECCIÓN PRINCIPAL: GENERADOR DE LEGAJO */}
                <div className="bg-[#161b22] border border-gray-800 rounded-xl p-8 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                                <span className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg text-xl">📦</span>
                                Generador de Cierre Mensual
                            </h2>
                            <p className="text-gray-400 max-w-2xl leading-relaxed">
                                Genera y descarga un expediente maestro inmutable (ZIP) que contiene:
                                <br />
                                <span className="text-gray-500 text-sm">• Todos los XMLs validados y clasificados.</span>
                                <br />
                                <span className="text-gray-500 text-sm">• Reporte PDF de cumplimiento y materialidad.</span>
                                <br />
                                <span className="text-gray-500 text-sm">• Estructura de carpetas lista para auditoría.</span>
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-end gap-4 bg-black/20 p-6 rounded-xl border border-gray-800 backdrop-blur-sm">
                            <div className="flex gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Año Fiscal</label>
                                    <select
                                        value={anio}
                                        onChange={(e) => setAnio(Number(e.target.value))}
                                        className="block w-28 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                                    >
                                        <option value={2024}>2024</option>
                                        <option value={2025}>2025</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Periodo</label>
                                    <select
                                        value={mes}
                                        onChange={(e) => setMes(Number(e.target.value))}
                                        className="block w-36 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>
                                                {new Date(0, i).toLocaleString('es-MX', { month: 'long' })}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                onClick={descargarLegajoUniversal}
                                disabled={generandoZip}
                                className={`inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-bold rounded-lg shadow-lg text-white transition-all transform hover:scale-105 active:scale-95
                                    ${generandoZip ? 'bg-indigo-900/50 cursor-not-allowed' : 'bg-[#00C853] hover:bg-green-500 shadow-green-900/20'}`}
                            >
                                {generandoZip ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Empaquetando...
                                    </>
                                ) : (
                                    <>
                                        <span className="mr-2 text-lg">⬇️</span>
                                        Descargar Legajo
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* HISTORIAL */}
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-gray-500">📜</span> Historial de Expedientes
                    </h3>

                    {expedientes.length === 0 ? (
                        <div className="text-center py-16 bg-[#161b22] rounded-xl border border-dashed border-gray-800">
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl opacity-50">📭</span>
                            </div>
                            <p className="text-gray-400 font-medium">No hay registros históricos descargados.</p>
                            <p className="text-gray-600 text-sm mt-2 max-w-sm mx-auto">
                                Utiliza el Generador de Cierre Mensual para crear y archivar tu primer Expediente Maestro.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden">
                            {/* Tabla placeholder style Sentinel */}
                            <div className="p-4 text-gray-400 text-center">Tabla de historial de expedientes...</div>
                        </div>
                    )}
                </div>
            </div>
        </MissionControlLayout>
    );
}

export default ExpedientesPage;
