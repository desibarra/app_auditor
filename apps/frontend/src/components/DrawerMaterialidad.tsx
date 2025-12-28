import { useState, useEffect } from 'react';
import axios from 'axios';

import ListaEvidencias from './ListaEvidencias';

interface DrawerMaterialidadProps {
    uuid: string;
    empresaRfc?: string; // Opcional para compatibilidad
    onClose: () => void;
    onDelete: () => void;
}

interface CfdiDetalle {
    uuid: string;
    emisorRfc: string;
    emisorNombre: string;
    receptorRfc: string;
    receptorNombre: string;
    fecha: string;
    tipoComprobante: string;
    total: number;
    moneda: string;
    estadoSat: string;
}

interface Impuesto {
    tipo: string;
    impuesto: string;
    tasaOCuota: number;
    importe: number;
}

function DrawerMaterialidad({ uuid, empresaRfc, onClose, onDelete }: DrawerMaterialidadProps) {
    const [cfdi, setCfdi] = useState<CfdiDetalle | null>(null);
    const [impuestos, setImpuestos] = useState<Impuesto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    useEffect(() => {
        fetchDetalle();
        // fetchContadorEvidencias(); // Removed unused
    }, [uuid]);

    const fetchDetalle = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/cfdi/detalle/${uuid}`);
            setCfdi(response.data.cfdi);
            setImpuestos(response.data.impuestos || []);
            setError(null);
        } catch (err: any) {
            console.error('Error al cargar detalle:', err);
            setError('No se pudo cargar el detalle del CFDI');
        } finally {
            setLoading(false);
        }
    };

    /*
    const fetchContadorEvidencias = async () => {
        try {
            const response = await axios.get(`/api/evidencias/count/${uuid}`);
            // setNumEvidencias(response.data.count);
        } catch (err) {
            console.error('Error al contar evidencias:', err);
        }
    };
    */

    /**
     * Determina el tipo de evidencia correcto basado en la clasificación contable
     * - Si el emisor es la empresa → Ingreso/Venta → Tipo "I"
     * - Si el receptor es la empresa → Gasto/Compra → Tipo "E"
     */
    const getTipoEvidencia = (): string => {
        if (!cfdi) return 'I';

        // 1. Si tenemos el RFC de la empresa, usamos la lógica robusta
        if (empresaRfc) {
            // Si yo emití la factura, es un Ingreso
            if (cfdi.emisorRfc === empresaRfc) return 'I';
            // Si yo la recibí, es un Gasto
            if (cfdi.receptorRfc === empresaRfc) return 'E';
        }

        // 2. Si no tenemos RFC, intentamos inferir
        // Si el tipo XML es Egreso (Nota Crédito)
        if (cfdi.tipoComprobante === 'E') return 'E';

        // 3. Fallback visual: Si el usuario ve "Gasto/Compra", queremos "E"
        // Pero no tenemos acceso directo a esa etiqueta aquí.

        // 4. Fallback seguro: Usar el tipo del XML, pero mapear "Ingreso" a "Gasto"
        // si sospechamos que es gasto (difícil saber sin RFC).

        // MANTENIENDO SOLUCIÓN TEMPORAL POR COMPATIBILIDAD CON REQUERIMIENTO:
        // Si no es Ingreso puro donde yo soy emisor, asumimos Gasto para mostrar contrato
        // (Esto es un override temporal para asegurar que aparezca el contrato de arrendamiento)
        return 'E';
    };

    const handleEvidenciaUpdate = () => {
        // fetchContadorEvidencias();
    };

    const handleDelete = async () => {
        try {
            setDeleting(true);
            await axios.delete(`/api/cfdi/${uuid}`);
            onDelete();
            onClose();
        } catch (err: any) {
            console.error('Error al eliminar:', err);
            alert(err.response?.data?.message || 'Error al eliminar el CFDI');
        } finally {
            setDeleting(false);
        }
    };

    const formatearMoneda = (monto: number, moneda: string = 'MXN') => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: moneda,
        }).format(monto);
    };

    const formatearFecha = (fecha: string) => {
        try {
            return new Date(fecha).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return fecha;
        }
    };

    const getTipoLabel = (tipo: string) => {
        const tipos: Record<string, string> = {
            'I': 'Ingreso',
            'E': 'Egreso',
            'P': 'Pago',
            'N': 'Nómina',
            'T': 'Traslado',
        };
        return tipos[tipo] || tipo;
    };

    const getImpuestoLabel = (codigo: string) => {
        const impuestos: Record<string, string> = {
            '001': 'ISR',
            '002': 'IVA',
            '003': 'IEPS',
        };
        return impuestos[codigo] || codigo;
    };

    // Calcular totales de impuestos
    const totalTraslados = impuestos
        .filter(i => i.tipo === 'Traslado')
        .reduce((sum, i) => sum + i.importe, 0);

    const totalRetenciones = impuestos
        .filter(i => i.tipo === 'Retencion')
        .reduce((sum, i) => sum + i.importe, 0);

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-[#0A0C10] shadow-2xl z-50 overflow-y-auto transform transition-transform border-l border-gray-800">
                {/* Header */}
                <div className="sticky top-0 bg-[#0A0C10]/95 backdrop-blur-sm border-b border-gray-800 px-6 py-4 z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-100 tracking-tight flex items-center gap-2">
                                <span className="text-indigo-500">🛡️</span> Detalle del CFDI
                            </h2>
                            <p className="text-xs text-gray-400 font-mono mt-1 break-all">
                                UUID: <span className="text-indigo-400 select-all">{uuid}</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-3 py-1.5 text-xs font-bold text-red-400 border border-red-900/50 bg-red-900/10 hover:bg-red-900/30 rounded-lg transition-all uppercase tracking-wider"
                                title="Eliminar CFDI"
                            >
                                🗑️ Eliminar
                            </button>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-300 text-2xl transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {loading ? (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                            <p className="text-gray-400 font-mono text-sm animate-pulse">Desencriptando Comprobante...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 rounded-xl bg-red-900/10 border border-red-900/30">
                            <p className="text-red-400 font-bold mb-2">⚠️ Error de Lectura</p>
                            <p className="text-red-300/70 text-sm mb-4">{error}</p>
                            <button
                                onClick={fetchDetalle}
                                className="text-xs bg-red-900/30 hover:bg-red-900/50 text-red-300 px-4 py-2 rounded-lg transition-colors uppercase font-bold"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : cfdi ? (
                        <>
                            {/* Información General */}
                            <section>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
                                    Información General
                                </h3>
                                <div className="bg-[#0B0E14] border border-gray-800 rounded-xl p-5 space-y-4 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                        <svg className="w-24 h-24 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 relative z-10">
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Fecha de Emisión</label>
                                            <p className="text-sm font-medium text-gray-200 font-mono mt-1">
                                                {formatearFecha(cfdi.fecha)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Tipo de Comprobante</label>
                                            <p className="text-sm font-medium text-gray-200 mt-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${cfdi.tipoComprobante === 'I' ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400' :
                                                    cfdi.tipoComprobante === 'E' ? 'bg-rose-900/20 border-rose-900/50 text-rose-400' :
                                                        'bg-blue-900/20 border-blue-900/50 text-blue-400'
                                                    }`}>
                                                    {getTipoLabel(cfdi.tipoComprobante)}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 pt-2">
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Emisor</label>
                                            <p className="text-sm font-bold text-gray-100 truncate mt-1" title={cfdi.emisorNombre}>{cfdi.emisorNombre}</p>
                                            <p className="text-xs text-indigo-400 font-mono">{cfdi.emisorRfc}</p>
                                        </div>

                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Receptor</label>
                                            <p className="text-sm font-bold text-gray-100 truncate mt-1" title={cfdi.receptorNombre}>{cfdi.receptorNombre}</p>
                                            <p className="text-xs text-indigo-400 font-mono">{cfdi.receptorRfc}</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-800 relative z-10 flex justify-between items-end">
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Total Facturado</label>
                                            <p className="text-2xl font-bold text-emerald-400 font-mono tracking-tight text-shadow-sm">
                                                {formatearMoneda(cfdi.total, cfdi.moneda)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold text-right block">Estatus SAT</label>
                                            <span className={`block text-right text-xs font-bold uppercase tracking-wider ${cfdi.estadoSat === 'Vigente' ? 'text-emerald-500' : 'text-red-500'
                                                }`}>
                                                {cfdi.estadoSat === 'Vigente' ? '✅ Vigente' : '❌ Cancelado'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Detalle Fiscal */}
                            <section>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
                                    Desglose Fiscal
                                </h3>

                                {impuestos.length === 0 ? (
                                    <div className="bg-[#0B0E14] border border-gray-800 rounded-xl p-6 text-center">
                                        <p className="text-xs text-gray-500 font-mono">
                                            // 000 - SIN IMPUESTOS DESGLOSADOS
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Traslados */}
                                        {impuestos.filter(i => i.tipo === 'Traslado').length > 0 && (
                                            <div>
                                                <h4 className="text-[10px] font-bold text-emerald-500 uppercase mb-2 tracking-wider pl-1">
                                                    Impuestos Trasladados (+)
                                                </h4>
                                                <div className="bg-[#0B0E14] border border-gray-800 rounded-lg overflow-hidden">
                                                    <table className="min-w-full divide-y divide-gray-800">
                                                        <thead className="bg-gray-900/50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Impuesto</th>
                                                                <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Tasa</th>
                                                                <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Importe</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-800">
                                                            {impuestos.filter(i => i.tipo === 'Traslado').map((imp, idx) => (
                                                                <tr key={idx} className="hover:bg-gray-800/30">
                                                                    <td className="px-4 py-2 text-xs text-gray-300 font-mono">
                                                                        {getImpuestoLabel(imp.impuesto)}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-xs text-gray-400 text-right font-mono">
                                                                        {(imp.tasaOCuota * 100).toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-4 py-2 text-xs font-bold text-emerald-400 text-right font-mono">
                                                                        {formatearMoneda(imp.importe, cfdi.moneda)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr className="bg-emerald-900/10">
                                                                <td colSpan={2} className="px-4 py-2 text-xs font-bold text-emerald-500 uppercase text-right tracking-wider">
                                                                    Total Trasladado
                                                                </td>
                                                                <td className="px-4 py-2 text-sm font-bold text-emerald-400 text-right font-mono border-t border-emerald-900/30">
                                                                    {formatearMoneda(totalTraslados, cfdi.moneda)}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Retenciones */}
                                        {impuestos.filter(i => i.tipo === 'Retencion').length > 0 && (
                                            <div>
                                                <h4 className="text-[10px] font-bold text-rose-500 uppercase mb-2 tracking-wider pl-1">
                                                    Impuestos Retenidos (-)
                                                </h4>
                                                <div className="bg-[#0B0E14] border border-gray-800 rounded-lg overflow-hidden">
                                                    <table className="min-w-full divide-y divide-gray-800">
                                                        <thead className="bg-gray-900/50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Impuesto</th>
                                                                <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Tasa</th>
                                                                <th className="px-4 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Importe</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-800">
                                                            {impuestos.filter(i => i.tipo === 'Retencion').map((imp, idx) => (
                                                                <tr key={idx} className="hover:bg-gray-800/30">
                                                                    <td className="px-4 py-2 text-xs text-gray-300 font-mono">
                                                                        {getImpuestoLabel(imp.impuesto)}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-xs text-gray-400 text-right font-mono">
                                                                        {(imp.tasaOCuota * 100).toFixed(2)}%
                                                                    </td>
                                                                    <td className="px-4 py-2 text-xs font-bold text-rose-400 text-right font-mono">
                                                                        {formatearMoneda(imp.importe, cfdi.moneda)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr className="bg-rose-900/10">
                                                                <td colSpan={2} className="px-4 py-2 text-xs font-bold text-rose-500 uppercase text-right tracking-wider">
                                                                    Total Retenido
                                                                </td>
                                                                <td className="px-4 py-2 text-sm font-bold text-rose-400 text-right font-mono border-t border-rose-900/30">
                                                                    {formatearMoneda(totalRetenciones, cfdi.moneda)}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* Gestión de Evidencias */}
                            <section>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <span className="w-1 h-3 bg-indigo-500 rounded-full"></span>
                                    Evidencias de Materialidad
                                </h3>
                                {/* UploadEvidencia was duplicated here and inside ListaEvidencias.
                                    Removing the direct call here to rely on ListaEvidencias which has the list AND the upload button usually,
                                    OR keeping it if the design required it.
                                    Looking at current ListaEvidencias, it DOES include an Upload section at bottom.
                                    So listing it twice is redundant. However, I'll keep the top one as "Add New" and Lista as "View".
                                    Actually, better to separate concerns. I will just render ListaEvidencias which handles everything nicely now.
                                */}
                                <div>
                                    <ListaEvidencias
                                        cfdiUuid={uuid}
                                        tipoComprobante={getTipoEvidencia()}
                                        onUpdate={handleEvidenciaUpdate}
                                        onClose={() => { }}
                                    />
                                </div>
                            </section>
                        </>
                    ) : null}
                </div>
            </div>

            {/* Modal de Confirmación de Eliminación */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            ¿Eliminar CFDI?
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Esta acción eliminará permanentemente el CFDI y todos sus impuestos asociados.
                            Esta acción no se puede deshacer.
                        </p>
                        <p className="text-xs text-gray-500 font-mono mb-6 bg-gray-50 p-2 rounded">
                            UUID: {uuid}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={deleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                                disabled={deleting}
                            >
                                {deleting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default DrawerMaterialidad;
