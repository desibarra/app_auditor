/**
 * 📊 TABLA DE CONTROL MENSUAL DE CFDIS
 * ======================================
 * 
 * Componente INDEPENDIENTE de filtros
 * Muestra resumen por mes y tipo de comprobante
 * Permite detectar faltantes en segundos
 * 
 * Características:
 * - NO depende de filtros de fecha
 * - NO depende de búsquedas
 * - Clickable para filtrar listado inferior
 * - Se actualiza automáticamente al cargar XML
 */

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ResumenMensual {
    mes: string;
    I: number; // Ingreso
    E: number; // Egreso
    P: number; // Pago
    N: number; // Nómina
    T: number; // Traslado
    total: number;
    mesIncompleto: boolean;  // 🆕 Si faltan tipos esperados
    faltantes: string[];     // 🆕 Tipos que faltan ['I', 'P']
    nivelAlerta: 'ok' | 'medium' | 'high';  // 🆕 Nivel de alerta
}

interface TablaControlMensualProps {
    empresaId: string | null;
    onMesClick?: (mes: string, tipo?: string) => void;
    refreshTrigger?: number; // Para forzar actualización
}

export const TablaControlMensual: React.FC<TablaControlMensualProps> = ({
    empresaId,
    onMesClick,
    refreshTrigger = 0,
}) => {
    const [resumen, setResumen] = useState<ResumenMensual[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const cargarResumen = async () => {
        if (!empresaId) {
            setResumen([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get('/api/cfdi/resumen-mensual', {
                params: { empresaId },
            });

            if (response.data.success) {
                setResumen(response.data.resumen);
            }
        } catch (err: any) {
            console.error('Error cargando resumen mensual:', err);
            setError('Error al cargar resumen mensual');
        } finally {
            setLoading(false);
        }
    };

    // Cargar al montar y cuando cambia empresa o refreshTrigger
    useEffect(() => {
        cargarResumen();
    }, [empresaId, refreshTrigger]);

    if (!empresaId) {
        return null;
    }

    if (loading && resumen.length === 0) {
        return (
            <div className="tabla-control-loading">
                <div className="spinner"></div>
                <p>Cargando resumen mensual...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tabla-control-error">
                <p>⚠️ {error}</p>
            </div>
        );
    }

    if (resumen.length === 0) {
        return (
            <div className="tabla-control-vacia">
                <p>No hay CFDIs registrados aún</p>
            </div>
        );
    }

    const handleCeldaClick = (mes: string, tipo?: string) => {
        if (onMesClick) {
            onMesClick(mes, tipo);
        }
    };

    return (
        <div className="tabla-control-mensual">
            <div className="tabla-control-header">
                <h3>📊 Control Mensual de CFDIs</h3>
                <p className="tabla-control-subtitle">
                    Independiente de filtros • Click para filtrar listado inferior
                </p>
            </div>

            <div className="tabla-control-wrapper">
                <table className="tabla-control">
                    <thead>
                        <tr>
                            <th>Mes</th>
                            <th className="tipo-col tipo-I" title="Ingreso">I</th>
                            <th className="tipo-col tipo-E" title="Egreso">E</th>
                            <th className="tipo-col tipo-P" title="Pago">P</th>
                            <th className="tipo-col tipo-N" title="Nómina">N</th>
                            <th className="tipo-col tipo-T" title="Traslado">T</th>
                            <th className="total-col">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {resumen.map((row) => {
                            // 🆕 Determinar clase de alerta para la fila
                            let alertClass = '';
                            let alertTooltip = '';

                            if (row.mesIncompleto) {
                                alertClass = row.nivelAlerta === 'high' ? 'alerta-alta' : 'alerta-media';
                                const tiposNombres = {
                                    'I': 'Ingreso',
                                    'E': 'Egreso',
                                    'P': 'Pago',
                                    'N': 'Nómina',
                                    'T': 'Traslado'
                                };
                                const faltantesText = row.faltantes.map(t => tiposNombres[t as keyof typeof tiposNombres]).join(', ');
                                alertTooltip = `⚠️ Falta CFDI tipo: ${faltantesText}`;
                            }

                            return (
                                <tr key={row.mes} className={alertClass} title={alertTooltip}>
                                    <td
                                        className="mes-col clickable"
                                        onClick={() => handleCeldaClick(row.mes)}
                                    >
                                        {formatMes(row.mes)}
                                        {row.mesIncompleto && (
                                            <span className="icono-alerta">
                                                {row.nivelAlerta === 'high' ? ' ⚠️' : ' ⚠'}
                                            </span>
                                        )}
                                    </td>
                                    <td
                                        className={`tipo-col tipo-I ${row.I > 0 ? 'clickable' : 'vacia'}`}
                                        onClick={() => row.I > 0 && handleCeldaClick(row.mes, 'I')}
                                        title={row.I > 0 ? `${row.I} CFDIs de Ingreso` : 'Sin CFDIs'}
                                    >
                                        {row.I || '—'}
                                    </td>
                                    <td
                                        className={`tipo-col tipo-E ${row.E > 0 ? 'clickable' : 'vacia'}`}
                                        onClick={() => row.E > 0 && handleCeldaClick(row.mes, 'E')}
                                        title={row.E > 0 ? `${row.E} CFDIs de Egreso` : 'Sin CFDIs'}
                                    >
                                        {row.E || '—'}
                                    </td>
                                    <td
                                        className={`tipo-col tipo-P ${row.P > 0 ? 'clickable' : 'vacia'}`}
                                        onClick={() => row.P > 0 && handleCeldaClick(row.mes, 'P')}
                                        title={row.P > 0 ? `${row.P} CFDIs de Pago` : 'Sin CFDIs'}
                                    >
                                        {row.P || '—'}
                                    </td>
                                    <td
                                        className={`tipo-col tipo-N ${row.N > 0 ? 'clickable' : 'vacia'}`}
                                        onClick={() => row.N > 0 && handleCeldaClick(row.mes, 'N')}
                                        title={row.N > 0 ? `${row.N} CFDIs de Nómina` : 'Sin CFDIs'}
                                    >
                                        {row.N || '—'}
                                    </td>
                                    <td
                                        className={`tipo-col tipo-T ${row.T > 0 ? 'clickable' : 'vacia'}`}
                                        onClick={() => row.T > 0 && handleCeldaClick(row.mes, 'T')}
                                        title={row.T > 0 ? `${row.T} CFDIs de Traslado` : 'Sin CFDIs'}
                                    >
                                        {row.T || '—'}
                                    </td>
                                    <td className="total-col">
                                        <strong>{row.total}</strong>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="total-row">
                            <td><strong>TOTAL</strong></td>
                            <td className="tipo-col tipo-I">
                                <strong>{resumen.reduce((sum, r) => sum + r.I, 0)}</strong>
                            </td>
                            <td className="tipo-col tipo-E">
                                <strong>{resumen.reduce((sum, r) => sum + r.E, 0)}</strong>
                            </td>
                            <td className="tipo-col tipo-P">
                                <strong>{resumen.reduce((sum, r) => sum + r.P, 0)}</strong>
                            </td>
                            <td className="tipo-col tipo-N">
                                <strong>{resumen.reduce((sum, r) => sum + r.N, 0)}</strong>
                            </td>
                            <td className="tipo-col tipo-T">
                                <strong>{resumen.reduce((sum, r) => sum + r.T, 0)}</strong>
                            </td>
                            <td className="total-col">
                                <strong>{resumen.reduce((sum, r) => sum + r.total, 0)}</strong>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <style jsx>{`
                .tabla-control-mensual {
                    background: white;
                    border-radius: 12px;
                    padding: 24px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    margin-bottom: 24px;
                }

                .tabla-control-header {
                    margin-bottom: 16px;
                }

                .tabla-control-header h3 {
                    margin: 0 0 4px 0;
                    font-size: 1.5rem;
                    color: #1a1a1a;
                }

                .tabla-control-subtitle {
                    margin: 0;
                    font-size: 0.875rem;
                    color: #666;
                }

                .tabla-control-wrapper {
                    overflow-x: auto;
                }

                .tabla-control {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.9rem;
                }

                .tabla-control thead th {
                    background: #f8f9fa;
                    padding: 12px 8px;
                    text-align: center;
                    font-weight: 600;
                    border-bottom: 2px solid #dee2e6;
                    white-space: nowrap;
                }

                .tabla-control tbody td {
                    padding: 10px 8px;
                    text-align: center;
                    border-bottom: 1px solid #e9ecef;
                }

                .tabla-control tfoot td {
                    padding: 12px 8px;
                    text-align: center;
                    background: #f8f9fa;
                    border-top: 2px solid #dee2e6;
                    font-weight: 600;
                }

                .mes-col {
                    text-align: left !important;
                    font-weight: 500;
                    min-width: 120px;
                }

                .tipo-col {
                    min-width: 50px;
                }

                .total-col {
                    background: #f1f3f5;
                    font-weight: 600;
                }

                .clickable {
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .clickable:hover {
                    background: #e9ecef;
                    transform: scale(1.05);
                }

                .vacia {
                    color: #adb5bd;
                }

                /* Colores por tipo de CFDI */
                .tipo-I { color: #28a745; }
                .tipo-E { color: #dc3545; }
                .tipo-P { color: #007bff; }
                .tipo-N { color: #6f42c1; }
                .tipo-T { color: #fd7e14; }

                /* 🆕 Alertas de meses incompletos */
                .alerta-alta {
                    background-color: #ffe4e4 !important;
                    border-left: 4px solid #dc3545;
                }

                .alerta-media {
                    background-color: #fff9e6 !important;
                    border-left: 4px solid #ffc107;
                }

                .icono-alerta {
                    font-size: 0.9rem;
                    margin-left: 4px;
                }

                .tabla-control-loading,
                .tabla-control-error,
                .tabla-control-vacia {
                    padding: 40px;
                    text-align: center;
                    background: #f8f9fa;
                    border-radius: 8px;
                }

                .spinner {
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #3498db;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 16px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

function formatMes(mes: string): string {
    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const [year, month] = mes.split('-');
    const monthIndex = parseInt(month, 10) - 1;

    return `${meses[monthIndex]} ${year}`;
}

export default TablaControlMensual;
