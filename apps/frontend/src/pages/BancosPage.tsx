import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Movimiento {
    id: string;
    fecha: string;
    descripcion: string;
    monto: number;
    tipo: 'CARGO' | 'ABONO';
    referencia: string;
    conciliado: boolean;
    cfdi?: any; // Objeto CFDI si está conciliado
    banco: string;
    estadoCuentaId?: string;
}

function BancosPage() {
    const navigate = useNavigate();
    const [empresaId, setEmpresaId] = useState<string>('');
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

    // Filtros
    const [anio, setAnio] = useState(2025);
    const [mes, setMes] = useState(11);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const storedId = localStorage.getItem('empresaActiva');
        if (storedId) {
            setEmpresaId(storedId);
            fetchMovimientos(storedId, anio, mes);
        }
    }, [anio, mes]);

    const fetchMovimientos = async (id: string, a: number, m: number) => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/bancos/movimientos?empresaId=${id}&anio=${a}&mes=${m}`);
            setMovimientos(res.data);
        } catch (error: any) {
            console.error(error);
            // Si es 404 o vacío no mostrar alerta agresiva, solo log
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        const formData = new FormData();
        formData.append('file', file);
        formData.append('empresaId', empresaId);
        formData.append('banco', 'SANTANDER'); // Hardcoded MVP o Selector
        formData.append('cuenta', '1234'); // Hardcoded MVP
        formData.append('anio', anio.toString());
        formData.append('mes', mes.toString());

        try {
            setUploading(true);
            await axios.post('/api/bancos/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 300000 // 5 minutos para permitir que el OCR se complete
            });
            alert('✅ Estado de Cuenta procesado correctamente.');
            fetchMovimientos(empresaId, anio, mes);
        } catch (error: any) {
            console.error(error);
            const serverMsg = error.response?.data?.message;
            const status = error.response?.status;

            let userMsg = 'Error desconocido al procesar el archivo.';
            if (status === 500) userMsg = 'Error interno del servidor de Base de Datos.';
            if (serverMsg) userMsg = serverMsg;

            alert(`❌ Falló la carga: ${userMsg}`);
        } finally {
            setUploading(false);
        }
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        // Validar extensión
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
            alert('⚠️ Solo se permiten archivos Excel (.xlsx, .xls) o CSV (.csv)');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('empresaId', empresaId);
        formData.append('banco', 'EXCEL_IMPORT');
        formData.append('cuenta', '****');
        formData.append('anio', anio.toString());
        formData.append('mes', mes.toString());

        try {
            setUploading(true);
            const response = await axios.post('/api/bancos/import-excel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000 // 1 minuto
            });

            const { resumen } = response.data;
            alert(`✅ Importación exitosa!\n\n📊 Movimientos: ${resumen.movimientos}\n💰 Depósitos: $${resumen.totalDepositos}\n💸 Retiros: $${resumen.totalRetiros}\n💵 Saldo: $${resumen.saldoFinal}`);
            fetchMovimientos(empresaId, anio, mes);
        } catch (error: any) {
            console.error(error);
            const serverMsg = error.response?.data?.message;
            alert(`❌ Error: ${serverMsg || error.message}`);
        } finally {
            setUploading(false);
        }
    };

    // Modales y Estados de Conciliación
    const [movimientoAConciliar, setMovimientoAConciliar] = useState<Movimiento | null>(null);
    const [candidatos, setCandidatos] = useState<any[]>([]);
    const [buscandoCandidatos, setBuscandoCandidatos] = useState(false);

    const abrirConciliacion = async (mov: Movimiento) => {
        setMovimientoAConciliar(mov);
        setBuscandoCandidatos(true);
        try {
            // Buscar CFDIs del mismo periodo
            const res = await axios.get(`/api/cfdi/all?empresaId=${empresaId}&limit=100&fechaInicio=${anio}-${mes.toString().padStart(2, '0')}-01`);
            const todos = res.data.data || [];

            // Sugerencia inteligente: Coincidencia de monto (con margen de $0.50)
            const montoObj = Math.abs(mov.monto);
            const sugeridos = todos.filter((c: any) => Math.abs(c.total - montoObj) < 1.0);

            // Si no hay coincidencias exactas, mostrar recientes
            setCandidatos(sugeridos.length > 0 ? sugeridos : todos.slice(0, 10));
        } catch (error) {
            console.error(error);
        } finally {
            setBuscandoCandidatos(false);
        }
    };

    const confirmarConciliacion = async (cfdiUuid: string) => {
        if (!movimientoAConciliar) return;
        try {
            await axios.post('/api/bancos/conciliar', {
                movimientoId: movimientoAConciliar.id,
                cfdiUuid
            });
            alert('✅ Conciliación Exitosa');
            setMovimientoAConciliar(null);
            fetchMovimientos(empresaId, anio, mes);
        } catch (error) {
            alert('Error al conciliar');
        }
    };

    const handleDeletePeriodo = async () => {
        const userConfirmed = window.confirm('⚠️ ¿Estás seguro de ELIMINAR todo el periodo seleccionado (estados de cuenta y movimientos)? Esta acción no se puede deshacer.');
        if (!userConfirmed) return;

        try {
            setLoading(true);

            // Eliminar por periodo (empresaId, año, mes)
            await axios.delete(`/api/bancos/periodo`, {
                params: {
                    empresaId,
                    anio,
                    mes
                }
            });

            alert('🗑️ Periodo eliminado correctamente.');
            setMovimientos([]); // Limpiar UI
            fetchMovimientos(empresaId, anio, mes); // Recargar (debería estar vacío)
        } catch (error) {
            console.error(error);
            alert('Error al eliminar el periodo.');
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        if (!movimientos.length) return;
        window.open(`/api/bancos/export-excel?empresaId=${empresaId}&anio=${anio}&mes=${mes}`, '_blank');
    };

    return (
        <div className="card max-w-6xl mx-auto p-6 relative">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                🏦 Bóveda Bancaria
                <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">Etapa 1: Flujo de Efectivo</span>
            </h1>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 gap-4">
                <div className="flex gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Año</label>
                        <select value={anio} onChange={e => setAnio(Number(e.target.value))} className="mt-1 block rounded-md border-gray-300">
                            {[2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500">Mes</label>
                        <select value={mes} onChange={e => setMes(Number(e.target.value))} className="mt-1 block rounded-md border-gray-300">
                            {Array.from({ length: 12 }, (_, i) =>
                                <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es-MX', { month: 'long' })}</option>
                            )}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {movimientos.length > 0 && (
                        <button
                            onClick={handleExportExcel}
                            className="bg-white text-green-700 border border-green-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-green-50 flex items-center gap-2"
                        >
                            📊 Exportar Excel (SAT)
                        </button>
                    )}
                    <button
                        onClick={handleDeletePeriodo}
                        disabled={movimientos.length === 0}
                        className={`bg-white text-red-600 border border-red-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 mr-2 flex items-center gap-2 ${movimientos.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        🗑️ Eliminar Periodo
                    </button>
                    <label className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${uploading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                        {uploading ? 'Procesando...' : '📄 Subir Estado de Cuenta (PDF)'}
                        <input type="file" accept=".pdf,.xml,.csv" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                    <label className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${uploading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} ml-2`}>
                        {uploading ? 'Procesando...' : '📊 Importar desde Excel'}
                        <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} disabled={uploading} />
                    </label>
                </div>
            </div>

            {/* Tabla Movimientos */}
            <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Conciliación</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {movimientos.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                    No hay movimientos bancarios cargados para este periodo.
                                </td>
                            </tr>
                        ) : (
                            movimientos.map((mov) => (
                                <tr key={mov.id} className={mov.conciliado ? 'bg-green-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{mov.fecha}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        <div className="font-medium">{mov.descripcion}</div>
                                        <div className="text-xs text-gray-500">{mov.referencia}</div>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${mov.tipo === 'CARGO' ? 'text-red-600' : 'text-green-600'}`}>
                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(mov.monto)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        {mov.conciliado ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                ✅ Vinculado
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => abrirConciliacion(mov)}
                                                className="text-indigo-600 hover:text-indigo-900 border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-50"
                                            >
                                                🔗 Conciliar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {movimientos.length > 0 && (
                        <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                            <tr>
                                <td colSpan={2} className="px-6 py-4 text-right font-bold text-gray-700">RESUMEN DEL PERIODO (CONTROL):</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="text-green-600 font-bold">
                                        Depósitos: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
                                            movimientos.filter(m => m.tipo === 'ABONO').reduce((acc, m) => acc + m.monto, 0)
                                        )}
                                    </div>
                                    <div className="text-red-600 font-bold">
                                        Retiros: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
                                            movimientos.filter(m => m.tipo === 'CARGO').reduce((acc, m) => acc + m.monto, 0)
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="text-xs text-gray-500 font-medium">Diferencia:</div>
                                    <div className="text-sm font-bold">
                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
                                            movimientos.reduce((acc, m) => acc + m.monto, 0)
                                        )}
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* Modal de Conciliación */}
            {movimientoAConciliar && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4">
                        <h3 className="text-lg font-bold mb-4">Conciliar Movimiento Bancario</h3>

                        <div className="bg-gray-50 p-4 rounded mb-4">
                            <p className="text-sm text-gray-500">Buscando coincidencia para:</p>
                            <p className="font-bold text-lg">{movimientoAConciliar.descripcion}</p>
                            <p className={`font-bold ${movimientoAConciliar.tipo === 'CARGO' ? 'text-red-600' : 'text-green-600'}`}>
                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(movimientoAConciliar.monto)}
                            </p>
                            <p className="text-xs text-gray-400">{movimientoAConciliar.fecha}</p>
                        </div>

                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Resultados Inmediatos (Monto Similar o CFDI Reciente):</h4>
                            {buscandoCandidatos ? (
                                <p className="text-center py-4 text-gray-500">🔍 Buscando CFDIs...</p>
                            ) : candidatos.length === 0 ? (
                                <p className="text-center py-4 text-red-400">No se encontraron CFDIs sugeridos.</p>
                            ) : (
                                <div className="max-h-60 overflow-y-auto border rounded">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-xs font-medium text-gray-500 text-left">Emisor/Receptor</th>
                                                <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right">Total</th>
                                                <th className="px-3 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {candidatos.map(c => (
                                                <tr key={c.uuid} className="hover:bg-blue-50">
                                                    <td className="px-3 py-2 text-sm text-gray-700">
                                                        <div className="font-medium">{c.emisorNombre || c.receptorNombre}</div>
                                                        <div className="text-xs text-gray-400">{c.fecha} • {c.tipoComprobante}</div>
                                                    </td>
                                                    <td className="px-3 py-2 text-sm font-bold text-gray-900 text-right">
                                                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(c.total)}
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <button
                                                            onClick={() => confirmarConciliacion(c.uuid)}
                                                            className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                                                        >
                                                            Vincular
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <button
                                onClick={() => setMovimientoAConciliar(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mr-2"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BancosPage;
