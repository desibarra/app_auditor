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
    const [empresaId, setEmpresaId] = useState<string>(() => {
        return localStorage.getItem('empresaSeleccionada') || '';
    });
    const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

    // Filtros
    const [anio, setAnio] = useState(2025);
    const [mes, setMes] = useState(11);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const storedId = localStorage.getItem('empresaSeleccionada');
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
            <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500">

                {/* Header Actions & Filters */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row justify-between items-center shadow-xl shadow-slate-200/40 gap-6">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="btn-secondary py-2.5 px-5"
                        >
                            <span>←</span> REGRESAR
                        </button>
                        <div className="h-10 w-px bg-slate-100 mx-2"></div>
                        <div className="flex gap-3">
                            <div className="relative group">
                                <select
                                    value={anio}
                                    onChange={e => setAnio(Number(e.target.value))}
                                    className="bg-slate-50 border border-slate-200 text-slate-900 font-black rounded-xl px-4 py-2.5 text-[11px] focus:ring-4 focus:ring-slate-500/5 focus:border-[#0f172a] outline-none transition-all uppercase tracking-widest appearance-none pr-10"
                                >
                                    {[2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                            <div className="relative group">
                                <select
                                    value={mes}
                                    onChange={e => setMes(Number(e.target.value))}
                                    className="bg-slate-50 border border-slate-200 text-slate-900 font-black rounded-xl px-4 py-2.5 text-[11px] focus:ring-4 focus:ring-slate-500/5 focus:border-[#0f172a] outline-none transition-all uppercase tracking-widest appearance-none pr-10"
                                >
                                    {Array.from({ length: 12 }, (_, i) =>
                                        <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es-MX', { month: 'long' }).toUpperCase()}</option>
                                    )}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {movimientos.length > 0 && (
                            <button
                                onClick={handleExportExcel}
                                className="btn-secondary py-2.5 px-5 bg-white shadow-sm"
                            >
                                📄 EXPORTAR EXCEL
                            </button>
                        )}
                        <button
                            onClick={handleDeletePeriodo}
                            disabled={movimientos.length === 0}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 border shadow-sm ${movimientos.length === 0 ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 hover:border-rose-200'}`}
                        >
                            🗑️ ELIMINAR PERIODO
                        </button>

                        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
                            <label className={`cursor-pointer btn-primary py-2.5 px-5 text-[10px] rounded-xl ${uploading ? 'opacity-50 cursor-wait' : ''}`}>
                                {uploading ? 'PROCESANDO...' : 'SUBIR ESTADO PDF'}
                                <input type="file" accept=".pdf,.xml,.csv" className="hidden" onChange={handleUpload} disabled={uploading} />
                            </label>
                            <label className={`cursor-pointer btn-success py-2.5 px-5 text-[10px] rounded-xl ${uploading ? 'opacity-50 cursor-wait' : ''}`}>
                                {uploading ? 'PROCESANDO...' : 'IMPORTAR EXCEL'}
                                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} disabled={uploading} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Tabla Movimientos */}
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/30 flex-1 flex flex-col relative min-h-[500px]">
                    {loading && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-x-4 border-slate-100 border-t-4 border-t-[#0f172a] rounded-2xl animate-spin"></div>
                                <p className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest">Analizando Tesorería...</p>
                            </div>
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-10 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ejecución Fecha</th>
                                    <th className="px-10 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Concepto de Operación</th>
                                    <th className="px-10 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Importe Neto</th>
                                    <th className="px-10 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Protocolo Conciliación</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {movimientos.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-10 py-24 text-center">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200/50 border border-slate-100">
                                                    <span className="text-4xl grayscale opacity-50">🏦</span>
                                                </div>
                                                <div className="max-w-sm mx-auto">
                                                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Bóveda Vacía</h4>
                                                    <p className="text-[10px] text-slate-400 font-medium mt-2 leading-relaxed uppercase">No se han detectado transacciones bancarias sincronizadas para este periodo en la base de datos.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    movimientos.map((mov) => (
                                        <tr key={mov.id} className={`hover:bg-slate-50/50 transition-all group ${mov.conciliado ? 'bg-emerald-50/30' : ''}`}>
                                            <td className="px-10 py-6 whitespace-nowrap text-xs text-slate-500 font-black font-mono uppercase">{mov.fecha}</td>
                                            <td className="px-10 py-6 text-sm">
                                                <div className="font-black text-slate-900 group-hover:text-[#0f172a] transition-colors flex items-center gap-2 uppercase tracking-tighter">
                                                    {mov.descripcion}
                                                </div>
                                                <div className="text-[9px] text-[#0f172a]/50 font-black font-mono mt-1 flex items-center gap-1.5 uppercase">
                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 uppercase">REF</span> {mov.referencia}
                                                </div>
                                            </td>
                                            <td className={`px-10 py-6 whitespace-nowrap text-[15px] text-right font-black font-mono tracking-tighter ${mov.tipo === 'CARGO' ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                {mov.tipo === 'CARGO' ? '-' : '+'}{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(mov.monto)}
                                            </td>
                                            <td className="px-10 py-6 whitespace-nowrap text-center">
                                                {mov.conciliado ? (
                                                    <div className="badge-success mx-auto w-fit shadow-sm shadow-emerald-500/10">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        VINCULADO CFDI
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => abrirConciliacion(mov)}
                                                        className="text-[10px] font-black uppercase tracking-widest text-[#0f172a] hover:bg-[#0f172a] hover:text-white border border-[#0f172a]/20 px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-[#0f172a]/20 flex items-center gap-2 mx-auto bg-white"
                                                    >
                                                        <span>🔗</span> CONCILIAR
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {movimientos.length > 0 && (
                                <tfoot className="bg-slate-900 text-white">
                                    <tr>
                                        <td colSpan={2} className="px-10 py-8 text-right font-black text-slate-400 text-[10px] uppercase tracking-[0.3em]">RESUMEN DE TESORERÍA</td>
                                        <td className="px-10 py-8 text-right bg-slate-800/50">
                                            <div className="text-emerald-400 font-black font-mono text-xs mb-1.5 tracking-tight uppercase flex justify-end gap-2 items-center">
                                                <span className="text-[8px] font-black opacity-50 bg-emerald-900/50 px-1.5 py-0.5 rounded uppercase">DEPÓSITOS</span>
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
                                                    movimientos.filter(m => m.tipo === 'ABONO').reduce((acc, m) => acc + m.monto, 0)
                                                )}
                                            </div>
                                            <div className="text-rose-400 font-black font-mono text-xs tracking-tight uppercase flex justify-end gap-2 items-center">
                                                <span className="text-[8px] font-black opacity-50 bg-rose-900/50 px-1.5 py-0.5 rounded uppercase">RETIROS</span>
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
                                                    movimientos.filter(m => m.tipo === 'CARGO').reduce((acc, m) => acc + m.monto, 0)
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center bg-white border-t border-slate-900">
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Diferencial Forense</div>
                                            <div className="text-2xl font-black text-slate-900 font-mono tracking-tighter">
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(
                                                    movimientos.reduce((acc, m) => (m.tipo === 'ABONO' ? acc + m.monto : acc - m.monto), 0)
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
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity" onClick={() => setMovimientoAConciliar(null)}></div>

                        <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="bg-slate-50 px-10 py-8 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Protocolo de Conciliación</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Vinculación de activos digitales</p>
                                </div>
                                <button onClick={() => setMovimientoAConciliar(null)} className="p-2.5 bg-white rounded-2xl text-slate-400 hover:text-slate-600 border border-slate-100 transition-all shadow-sm">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="p-10">
                                <div className="bg-[#0f172a] p-8 rounded-[2rem] border border-slate-800 mb-10 shadow-xl shadow-slate-900/20">
                                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.3em] mb-3">Transacción Originaria</p>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-white text-lg font-black uppercase tracking-tighter leading-tight max-w-[300px]">{movimientoAConciliar.descripcion}</div>
                                            <div className="text-[10px] text-emerald-400 font-black font-mono mt-2 flex items-center gap-2 uppercase">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {movimientoAConciliar.fecha}
                                            </div>
                                        </div>
                                        <div className={`font-black text-3xl font-mono tracking-tighter ${movimientoAConciliar.tipo === 'CARGO' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(movimientoAConciliar.monto)}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-3">
                                        <span className="w-6 h-px bg-slate-200"></span>
                                        Sugerencias CFDI Forenses
                                        <span className="w-6 h-px bg-slate-200"></span>
                                    </h4>
                                    {buscandoCandidatos ? (
                                        <div className="text-center py-12">
                                            <div className="w-10 h-10 border-x-4 border-slate-50 border-t-4 border-t-[#0f172a] rounded-xl animate-spin mx-auto mb-4"></div>
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Escaneando base de datos...</p>
                                        </div>
                                    ) : candidatos.length === 0 ? (
                                        <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">No se identificaron coincidencias algorítmicas</p>
                                        </div>
                                    ) : (
                                        <div className="max-h-72 overflow-y-auto border border-slate-100 rounded-3xl bg-white shadow-inner divide-y divide-slate-50 custom-scrollbar pr-2">
                                            <table className="min-w-full">
                                                <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-sm z-10">
                                                    <tr>
                                                        <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase text-left tracking-widest">Entidad Fiscal</th>
                                                        <th className="px-6 py-3 text-[9px] font-black text-slate-400 uppercase text-right tracking-widest">Balance CFDI</th>
                                                        <th className="px-6 py-3"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {candidatos.map(c => (
                                                        <tr key={c.uuid} className="hover:bg-slate-50/50 transition-all group">
                                                            <td className="px-6 py-4">
                                                                <div className="font-black text-slate-800 text-xs uppercase tracking-tighter">{c.emisorNombre || c.receptorNombre}</div>
                                                                <div className="text-[9px] text-slate-400 font-black font-mono mt-1 uppercase flex items-center gap-2">
                                                                    {c.fecha.split('T')[0]} <span className="text-slate-200">•</span> {c.tipoComprobante}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-black text-right font-mono tracking-tighter text-[#0f172a]">
                                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(c.total)}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button
                                                                    onClick={() => confirmarConciliacion(c.uuid)}
                                                                    className="btn-primary py-2 px-4 text-[9px] shadow-sm tracking-widest"
                                                                >
                                                                    VINCULAR
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pt-8 border-t border-slate-100 gap-4">
                                    <button
                                        onClick={() => setMovimientoAConciliar(null)}
                                        className="btn-secondary py-3 px-8 text-[10px]"
                                    >
                                        DESCARTAR
                                    </button>
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
