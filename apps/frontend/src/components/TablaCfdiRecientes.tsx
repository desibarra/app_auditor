import { useState, useEffect } from 'react';
import axios from 'axios';
import DrawerMaterialidad from './DrawerMaterialidad';
import IndicadorMaterialidad from './IndicadorMaterialidad';

interface CfdiReciente {
    uuid: string;
    emisorRfc: string;
    emisorNombre: string;
    fecha: string;
    tipoComprobante: string;
    total: number;
    moneda: string;
    estadoSat: string;
    fechaImportacion: number;
}

interface TablaCfdiRecientesProps {
    empresaId: string;
    onRefresh?: () => void;
}

function TablaCfdiRecientes({ empresaId, onRefresh }: TablaCfdiRecientesProps) {
    const [cfdis, setCfdis] = useState<CfdiReciente[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

    // Paginación
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 20;

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [tipoComprobante, setTipoComprobante] = useState('');

    // Contadores de evidencias por UUID
    const [evidenciasCounts, setEvidenciasCounts] = useState<Record<string, number>>({});

    const fetchCfdis = async () => {
        try {
            setLoading(true);

            // Construir query params
            const params = new URLSearchParams({
                empresaId,
                page: page.toString(),
                limit: limit.toString(),
            });

            if (fechaInicio) params.append('fechaInicio', fechaInicio);
            if (fechaFin) params.append('fechaFin', fechaFin);
            if (searchTerm) params.append('rfcEmisor', searchTerm);
            if (tipoComprobante) params.append('tipoComprobante', tipoComprobante);

            const response = await axios.get(`/api/cfdi/all?${params.toString()}`);

            setCfdis(response.data.data);
            setTotal(response.data.pagination.total);
            setTotalPages(response.data.pagination.totalPages);
            setError(null);

            // Obtener contadores de evidencias para cada CFDI
            fetchEvidenciasCounts(response.data.data);
        } catch (err: any) {
            console.error('Error al cargar CFDIs:', err);
            setError('No se pudieron cargar los CFDIs');
        } finally {
            setLoading(false);
        }
    };

    const fetchEvidenciasCounts = async (cfdis: CfdiReciente[]) => {
        try {
            const counts: Record<string, number> = {};

            // Obtener contador para cada CFDI
            await Promise.all(
                cfdis.map(async (cfdi) => {
                    try {
                        const response = await axios.get(`/api/evidencias/count/${cfdi.uuid}`);
                        counts[cfdi.uuid] = response.data.count;
                    } catch (err) {
                        counts[cfdi.uuid] = 0;
                    }
                })
            );

            setEvidenciasCounts(counts);
        } catch (err) {
            console.error('Error al obtener contadores de evidencias:', err);
        }
    };

    useEffect(() => {
        fetchCfdis();
    }, [empresaId, page, fechaInicio, fechaFin, tipoComprobante]);

    // Búsqueda con debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (page === 1) {
                fetchCfdis();
            } else {
                setPage(1); // Reset a página 1 cuando se busca
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (onRefresh) {
            fetchCfdis();
        }
    }, [onRefresh]);

    const handleLimpiarFiltros = () => {
        setSearchTerm('');
        setFechaInicio('');
        setFechaFin('');
        setTipoComprobante('');
        setPage(1);
    };

    const handleDeleteCfdi = () => {
        setSelectedUuid(null);
        fetchCfdis();
    };

    const formatearFecha = (fecha: string) => {
        try {
            return new Date(fecha).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return fecha;
        }
    };

    const formatearMoneda = (monto: number, moneda: string) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: moneda || 'MXN',
        }).format(monto);
    };

    const getTipoComprobanteLabel = (tipo: string) => {
        const tipos: Record<string, string> = {
            'I': 'Ingreso',
            'E': 'Egreso',
            'P': 'Pago',
            'N': 'Nómina',
            'T': 'Traslado',
        };
        return tipos[tipo] || tipo;
    };

    if (loading && cfdis.length === 0) {
        return (
            <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Centro de Gestión de Materialidad
                </h2>
                <div className="text-center py-8">
                    <p className="text-gray-500">Cargando...</p>
                </div>
            </div>
        );
    }

    if (error && cfdis.length === 0) {
        return (
            <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Centro de Gestión de Materialidad
                </h2>
                <div className="text-center py-8">
                    <p className="text-red-500">{error}</p>
                    <button
                        onClick={fetchCfdis}
                        className="mt-4 text-sm text-blue-600 hover:text-blue-700"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="card">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Centro de Gestión de Materialidad
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {total} CFDI{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={fetchCfdis}
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        🔄 Actualizar
                    </button>
                </div>

                {/* Filtros */}
                <div className="mb-6 space-y-4">
                    {/* Buscador */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            🔍 Buscar por RFC o UUID
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Ingresa RFC del emisor o UUID..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Filtros Avanzados */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha Inicio
                            </label>
                            <input
                                type="date"
                                value={fechaInicio}
                                onChange={(e) => setFechaInicio(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha Fin
                            </label>
                            <input
                                type="date"
                                value={fechaFin}
                                onChange={(e) => setFechaFin(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Comprobante
                            </label>
                            <select
                                value={tipoComprobante}
                                onChange={(e) => setTipoComprobante(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Todos</option>
                                <option value="I">Ingreso</option>
                                <option value="E">Egreso</option>
                                <option value="P">Pago</option>
                                <option value="N">Nómina</option>
                                <option value="T">Traslado</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleLimpiarFiltros}
                                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabla */}
                {cfdis.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500 italic">
                            {searchTerm || fechaInicio || fechaFin || tipoComprobante
                                ? 'No se encontraron CFDIs con los filtros aplicados'
                                : 'No hay CFDIs importados aún. Usa el botón "Cargar XML" para comenzar.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Materialidad
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Emisor
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            RFC
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tipo
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {cfdis.map((cfdi) => (
                                        <tr
                                            key={cfdi.uuid}
                                            onClick={() => setSelectedUuid(cfdi.uuid)}
                                            className="hover:bg-blue-50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <IndicadorMaterialidad numEvidencias={evidenciasCounts[cfdi.uuid] || 0} />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                {formatearFecha(cfdi.fecha)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                <div className="max-w-xs truncate" title={cfdi.emisorNombre}>
                                                    {cfdi.emisorNombre}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                                                {cfdi.emisorRfc}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${cfdi.tipoComprobante === 'I' ? 'bg-green-100 text-green-800' :
                                                    cfdi.tipoComprobante === 'E' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {getTipoComprobanteLabel(cfdi.tipoComprobante)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                                                {formatearMoneda(cfdi.total, cfdi.moneda)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${cfdi.estadoSat === 'Vigente' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                                    }`}>
                                                    {cfdi.estadoSat}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                            <div className="text-sm text-gray-700">
                                Mostrando <span className="font-medium">{((page - 1) * limit) + 1}</span> a{' '}
                                <span className="font-medium">{Math.min(page * limit, total)}</span> de{' '}
                                <span className="font-medium">{total}</span> resultados
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ← Anterior
                                </button>
                                <span className="px-4 py-2 text-sm text-gray-700">
                                    Página {page} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Siguiente →
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Drawer de Materialidad */}
            {selectedUuid && (
                <DrawerMaterialidad
                    uuid={selectedUuid}
                    onClose={() => setSelectedUuid(null)}
                    onDelete={handleDeleteCfdi}
                />
            )}
        </>
    );
}

export default TablaCfdiRecientes;
