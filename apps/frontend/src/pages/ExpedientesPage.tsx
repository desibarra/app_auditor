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
    const [mes, setMes] = useState(11); // Default Noviembre para demo (o usar new Date().getMonth() + 1)
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
        // 2. Validación Fail-Safe en tiempo de ejecución
        let targetEmpresaId = empresaActiva;
        if (!targetEmpresaId) {
            targetEmpresaId = localStorage.getItem('empresaActiva') || '';
        }

        console.log('🔄 Iniciando solicitud de descarga:', { targetEmpresaId, anio, mes });

        if (!targetEmpresaId) {
            if (confirm('⚠️ No se ha detectado una empresa activa. ¿Deseas ir al Dashboard para seleccionarla?')) {
                navigate('/dashboard');
            }
            return;
        }

        try {
            setGenerandoZip(true);

            // Petición con responseType blob
            const response = await axios.post('/api/legajo/exportar', {
                empresaId: targetEmpresaId, // Usar el ID validado
                anio,
                mes
            }, {
                responseType: 'blob'
            });

            // Verificar si el blob es un error (application/json)
            if (response.data.type === 'application/json') {
                const text = await response.data.text();
                const json = JSON.parse(text);
                throw new Error(json.message || 'Error del servidor');
            }

            console.log('✅ ZIP recibido, iniciando descarga en navegador...');

            // Crear link temporal
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
            const link = document.createElement('a');
            link.href = url;
            const nombreArchivo = `Legajo_Fiscal_${anio}_${mes.toString().padStart(2, '0')}.zip`;
            link.setAttribute('download', nombreArchivo);

            document.body.appendChild(link);
            link.click();

            // Limpieza
            setTimeout(() => {
                link.remove();
                window.URL.revokeObjectURL(url);
            }, 100);

            // alert('✅ Descarga iniciada'); // Opcional, a veces molesta si ya bajó
        } catch (error: any) {
            console.error('❌ Error generando Legajo:', error);

            let mensajeError = 'Hubo un problema al generar el archivo ZIP.';

            // Intentar extraer mensaje del backend si viene en el blob de error
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
        return <div className="p-8 text-center text-gray-500">Cargando módulo de expedientes...</div>;
    }

    // 3. UI de Emergencia si no hay empresa seleccionada
    if (!empresaActiva) {
        return (
            <div className="card max-w-4xl mx-auto p-8 text-center mt-10 border-l-4 border-yellow-400 bg-yellow-50">
                <svg className="mx-auto h-12 w-12 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="mt-4 text-lg font-bold text-gray-900">Empresa No Seleccionada</h2>
                <p className="mt-2 text-gray-600">Para generar y descargar legajos, primero debes seleccionar una empresa en el Panel Principal.</p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                    Ir al Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="card max-w-6xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                    >
                        ← Volver
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        🗂️ Archivo Digital Maestro
                    </h1>
                </div>
            </div>

            {/* SECCIÓN PRINCIPAL: GENERADOR DE LEGAJO */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 mb-8 shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-2">Generador de Cierre Mensual</h2>
                        <p className="text-sm text-gray-600 max-w-xl">
                            Descarga un expediente completo (ZIP) con todos los XMLs y Evidencias del mes,
                            organizados automáticamente por carpetas (Ingresos/Gastos) y un reporte PDF de cumplimiento.
                        </p>
                    </div>

                    <div className="flex items-end gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Año</label>
                            <select
                                value={anio}
                                onChange={(e) => setAnio(Number(e.target.value))}
                                className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value={2024}>2024</option>
                                <option value={2025}>2025</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Mes</label>
                            <select
                                value={mes}
                                onChange={(e) => setMes(Number(e.target.value))}
                                className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('es-MX', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={descargarLegajoUniversal}
                            disabled={generandoZip}
                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                                ${generandoZip ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {generandoZip ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Generando ZIP...
                                </>
                            ) : (
                                <>
                                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Descargar Legajo
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* LISTA HISTÓRICA (Opcional por ahora) */}
            <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de Expedientes Generados</h3>

                {expedientes.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500 text-sm">Registro histórico vacío.</p>
                        <p className="text-gray-400 text-xs mt-1">Utiliza el generador de arriba para descargar tu auditoría mensual.</p>
                    </div>
                ) : (
                    <p className="text-gray-500">Listado de expedientes antiguos...</p>
                    // Aquí iría la tabla original si se necesita
                )}
            </div>
        </div>
    );
}

export default ExpedientesPage;
