import { useState, useEffect } from 'react';
import axios from 'axios';
import { useEmpresaContext } from '../context/EmpresaContext';

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
    const { empresaActiva } = useEmpresaContext();
    const [expedientes, setExpedientes] = useState<Expediente[]>([]);
    const [loading, setLoading] = useState(true);
    const [descargando, setDescargando] = useState<number | null>(null);

    useEffect(() => {
        if (empresaActiva) {
            fetchExpedientes();
        }
    }, [empresaActiva]);

    const fetchExpedientes = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/expedientes?empresaId=${empresaActiva}`);
            setExpedientes(response.data);
        } catch (error) {
            console.error('Error al cargar expedientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const descargarZip = async (expedienteId: number, folio: string) => {
        try {
            setDescargando(expedienteId);

            const response = await axios.get(`/api/expedientes/${expedienteId}/descargar-zip`, {
                responseType: 'blob',
            });

            // Crear URL del blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${folio}_Legajo_Digital.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al descargar ZIP:', error);
            alert('Error al descargar el legajo digital');
        } finally {
            setDescargando(null);
        }
    };

    const getEstadoBadge = (estado: string) => {
        const badges: Record<string, string> = {
            'borrador': 'bg-gray-100 text-gray-800',
            'enviado': 'bg-blue-100 text-blue-800',
            'en_revision': 'bg-yellow-100 text-yellow-800',
            'aprobado': 'bg-green-100 text-green-800',
            'rechazado': 'bg-red-100 text-red-800',
            'completado': 'bg-purple-100 text-purple-800',
        };
        return badges[estado] || 'bg-gray-100 text-gray-800';
    };

    const getEstadoLabel = (estado: string) => {
        const labels: Record<string, string> = {
            'borrador': 'Borrador',
            'enviado': 'Enviado',
            'en_revision': 'En Revisión',
            'aprobado': 'Aprobado',
            'rechazado': 'Rechazado',
            'completado': 'Completado',
        };
        return labels[estado] || estado;
    };

    if (loading) {
        return (
            <div className="card">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                    Mis Expedientes de Devolución
                </h1>
                <div className="text-center py-8">
                    <p className="text-gray-500">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    📁 Mis Expedientes de Devolución
                </h1>
                <div className="text-sm text-gray-600">
                    {expedientes.length} expediente{expedientes.length !== 1 ? 's' : ''}
                </div>
            </div>

            {expedientes.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay expedientes</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Comienza seleccionando CFDIs con materialidad completa (🟢) y genera tu primer expediente.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Folio
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nombre
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    IVA Recuperable
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    CFDIs
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {expedientes.map((exp) => (
                                <tr key={exp.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{exp.folio}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{exp.nombre}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-green-600">
                                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(exp.montoTotalIva)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{exp.cantidadCfdis} CFDIs</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoBadge(exp.estado)}`}>
                                            {getEstadoLabel(exp.estado)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(exp.fechaCreacion).toLocaleDateString('es-MX')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => descargarZip(exp.id, exp.folio)}
                                            disabled={descargando === exp.id}
                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {descargando === exp.id ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Preparando...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Descargar ZIP
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ExpedientesPage;
