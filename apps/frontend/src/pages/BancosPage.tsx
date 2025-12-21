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

import MissionControlLayout from '../components/MissionControlLayout';

function BancosPage() {
    // ... logic (kept largely same, just styling return) ...
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
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // ... (Logic Same)
        if (!e.target.files || !e.target.files[0]) return;
        const file = e.target.files[0];

        const formData = new FormData();
        formData.append('file', file);
        formData.append('empresaId', empresaId);
        formData.append('banco', 'SANTANDER');
        formData.append('cuenta', '1234');
        formData.append('anio', anio.toString());
        formData.append('mes', mes.toString());

        try {
            setUploading(true);
            await axios.post('/api/bancos/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 300000
            });
            alert('✅ Estado de Cuenta procesado correctamente.');
            fetchMovimientos(empresaId, anio, mes);
        } catch (error: any) {
            const serverMsg = error.response?.data?.message;
            alert(`❌ Falló la carga: ${serverMsg || 'Error desconocido'}`);
        } finally {
            setUploading(false);
        }
    };

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // ... (Logic Same)
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
                timeout: 60000
            });

            const { resumen } = response.data;
            alert(`✅ Importación exitosa!\n\n📊 Movimientos: ${resumen.movimientos}\n💰 Depósitos: $${resumen.totalDepositos}\n💸 Retiros: $${resumen.totalRetiros}\n💵 Saldo: $${resumen.saldoFinal}`);
            fetchMovimientos(empresaId, anio, mes);
        } catch (error: any) {
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
            const res = await axios.get(`/api/cfdi/all?empresaId=${empresaId}&limit=100&fechaInicio=${anio}-${mes.toString().padStart(2, '0')}-01`);
            const todos = res.data.data || [];
            const montoObj = Math.abs(mov.monto);
            const sugeridos = todos.filter((c: any) => Math.abs(c.total - montoObj) < 1.0);
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
        const userConfirmed = window.confirm('⚠️ ¿Estás seguro de ELIMINAR todo el periodo?');
        if (!userConfirmed) return;
        try {
            setLoading(true);
            await axios.delete(`/api/bancos/periodo`, { params: { empresaId, anio, mes } });
            alert('🗑️ Periodo eliminado correctamente.');
            setMovimientos([]);
            fetchMovimientos(empresaId, anio, mes);
        } catch (error) {
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
        <MissionControlLayout title="Bóveda Bancaria">
            <div className="flex flex-col h-full space-y-6">

                {/* Header Actions & Filters */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row justify-between items-center shadow-lg gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold py-2 px-4 rounded border border-gray-600 transition-colors flex items-center gap-2 text-sm"
                        >
                            ← Regresar
                        </button>
                        <div className="h-8 w-px bg-gray-600 mx-2"></div>
                        <div className="flex gap-2">
                            <div>
                                <select value={anio} onChange={e => setAnio(Number(e.target.value))} className="bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none">
                                    {[2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div>
                                <select value={mes} onChange={e => setMes(Number(e.target.value))} className="bg-gray-900 border border-gray-600 text-white rounded px-3 py-2 text-sm focus:border-indigo-500 outline-none">
                                    {Array.from({ length: 12 }, (_, i) =>
                                        <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es-MX', { month: 'long' })}</option>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {movimientos.length > 0 && (
                            <button
                                onClick={handleExportExcel}
                                className="bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                            >
                                📊 Exportar
                            </button>
                        )}
                        <button
                            onClick={handleDeletePeriodo}
                            disabled={movimientos.length === 0}
                            className={`bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${movimientos.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            🗑️ Eliminar
                        </button>

                        <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-lg border border-gray-700">
                            <label className={`cursor-pointer inline-flex items-center px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors gap-2 ${uploading ? 'bg-gray-700 text-gray-400' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'}`}>
                                {uploading ? '...' : '📄 Subir PDF'}
                                <input type="file" accept=".pdf,.xml,.csv" className="hidden" onChange={handleUpload} disabled={uploading} />
                            </label>
                            <label className={`cursor-pointer inline-flex items-center px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors gap-2 ${uploading ? 'bg-gray-700 text-gray-400' : 'bg-[#00C853] hover:bg-green-500 text-white shadow-lg shadow-green-900/20'}`}>
                                {uploading ? '...' : '📊 Importar Excel'}
                                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} disabled={uploading} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Tabla Movimientos */}
                <div className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden shadow-xl flex-1 flex flex-col relative">
                    {loading && (
                        <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-10 backdrop-blur-sm rounded-xl">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C853]"></div>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-800">
                            <thead className="bg-[#0d1117]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Fecha</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Descripción</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Monto</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">Conciliación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {movimientos.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                                                    <span className="text-3xl">🏦</span>
                                                </div>
                                                <p className="text-gray-500 font-medium">No hay movimientos bancarios cargados para este periodo.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    movimientos.map((mov) => (
                                        <tr key={mov.id} className={`hover:bg-gray-800/50 transition-colors ${mov.conciliado ? 'bg-green-900/10' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">{mov.fecha}</td>
                                            <td className="px-6 py-4 text-sm text-gray-300">
                                                <div className="font-bold text-white mb-0.5">{mov.descripcion}</div>
                                                <div className="text-xs text-indigo-400 font-mono">{mov.referencia}</div>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold font-mono ${mov.tipo === 'CARGO' ? 'text-red-400' : 'text-[#00C853]'}`}>
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(mov.monto)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                {mov.conciliado ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-900/30 text-green-400 border border-green-900/50">
                                                        ✅ Vinculado
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => abrirConciliacion(mov)}
                                                        className="text-indigo-400 hover:text-white border border-indigo-500/30 hover:bg-indigo-600 px-3 py-1 rounded transition-all text-xs uppercase font-bold tracking-wide"
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
                                <tfoot className="bg-[#0d1117] border-t border-gray-700">
                                    <tr>
                                        <td colSpan={2} className="px-6 py-4 text-right font-bold text-gray-500 text-xs uppercase tracking-widest">RESUMEN DEL PERIODO</td>
                                        <td className="px-6 py-4 text-right bg-gray-800/30">
                                            <div className="text-[#00C853] font-bold font-mono text-xs mb-1">
                                                Dep: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
                                                    movimientos.filter(m => m.tipo === 'ABONO').reduce((acc, m) => acc + m.monto, 0)
                                                )}
                                            </div>
                                            <div className="text-red-400 font-bold font-mono text-xs">
                                                Ret: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
                                                    movimientos.filter(m => m.tipo === 'CARGO').reduce((acc, m) => acc + m.monto, 0)
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Diferencial</div>
                                            <div className="text-sm font-bold text-white font-mono">
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
                </div>

                {/* Modal de Conciliación */}
                {movimientoAConciliar && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
                        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-900 bg-opacity-90 transition-opacity backdrop-blur-sm" onClick={() => setMovimientoAConciliar(null)}></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                            <div className="inline-block align-middle bg-gray-800 rounded-lg text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-2xl sm:w-full border border-gray-700">
                                <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">🔗 Conciliar Movimiento</h3>
                                </div>

                                <div className="p-6">
                                    <div className="bg-gray-700/50 p-4 rounded border border-gray-600 mb-6">
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Movimiento Bancario</p>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-white text-lg">{movimientoAConciliar.descripcion}</p>
                                                <p className="text-xs text-indigo-400 font-mono mt-1">{movimientoAConciliar.fecha}</p>
                                            </div>
                                            <p className={`font-bold text-xl font-mono ${movimientoAConciliar.tipo === 'CARGO' ? 'text-red-400' : 'text-[#00C853]'}`}>
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(movimientoAConciliar.monto)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Sugerencias Inteligentes</h4>
                                        {buscandoCandidatos ? (
                                            <div className="text-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-2"></div>
                                                <p className="text-gray-400 text-xs">Analizando CFDI...</p>
                                            </div>
                                        ) : candidatos.length === 0 ? (
                                            <p className="text-center py-8 text-gray-500 bg-gray-900/50 rounded border border-dashed border-gray-700">
                                                No se encontraron coincidencias exactas.
                                            </p>
                                        ) : (
                                            <div className="max-h-60 overflow-y-auto border border-gray-700 rounded bg-[#161b22] custom-scrollbar">
                                                <table className="min-w-full divide-y divide-gray-800">
                                                    <thead className="bg-gray-900">
                                                        <tr>
                                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase text-left">Contraparte</th>
                                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase text-right">Total</th>
                                                            <th className="px-3 py-2"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-800">
                                                        {candidatos.map(c => (
                                                            <tr key={c.uuid} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-3 py-2 text-sm text-gray-300">
                                                                    <div className="font-medium text-white">{c.emisorNombre || c.receptorNombre}</div>
                                                                    <div className="text-[10px] text-gray-500 font-mono">{c.fecha.split('T')[0]} • {c.tipoComprobante}</div>
                                                                </td>
                                                                <td className="px-3 py-2 text-sm font-bold text-right font-mono text-white">
                                                                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(c.total)}
                                                                </td>
                                                                <td className="px-3 py-2 text-right">
                                                                    <button
                                                                        onClick={() => confirmarConciliacion(c.uuid)}
                                                                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-500 shadow-lg shadow-indigo-900/20"
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

                                    <div className="flex justify-end pt-4 border-t border-gray-700">
                                        <button
                                            onClick={() => setMovimientoAConciliar(null)}
                                            className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 mr-2 text-sm font-bold"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MissionControlLayout>
    );
}

export default BancosPage;
