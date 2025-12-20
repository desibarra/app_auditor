/**
 * 📊 TABLA DE CONTROL MENSUAL - CFDI EMITIDOS
 * ============================================
 * 
 * Muestra resumen mensual de CFDIs EMITIDOS por la empresa
 * - Independiente de filtros
 * - Columnas: Mes | Ingresos (I) | Total $ | Clientes
 * - Query base: emisor_rfc = empresa.rfc
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ResumenMensualEmitido {
    mes: string;
    I: number;
    E: number;
    P: number;
    N: number;
    T: number;
    total: number;
    importe_total: number;
    clientes: number;
}

interface TablaControlEmitidosProps {
    empresaId: string | null;
    refreshTrigger?: number;
}

export const TablaControlEmitidos: React.FC<TablaControlEmitidosProps> = ({
    empresaId,
    refreshTrigger = 0
}) => {
    const [resumen, setResumen] = useState<ResumenMensualEmitido[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchResumen = async () => {
            if (!empresaId) {
                setResumen([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);

                const response = await axios.get('/api/cfdi/emitidos/resumen-mensual', {
                    params: { empresaId }
                });

                if (response.data.success) {
                    setResumen(response.data.resumen);
                } else {
                    setError('Error al cargar resumen de emitidos');
                }
            } catch (err: any) {
                console.error('[TablaControlEmitidos] Error:', err);
                setError('Error al cargar resumen mensual de emitidos');
            } finally {
                setLoading(false);
            }
        };

        fetchResumen();
    }, [empresaId, refreshTrigger]);

    const formatMes = (mes: string) => {
        const [year, month] = mes.split('-');
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return `${meses[parseInt(month) - 1]} ${year}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="tabla-control-emitidos">
                <h3 className="titulo">📊 Control Mensual de CFDI EMITIDOS</h3>
                <div className="tabla-control-loading">
                    <div className="spinner"></div>
                    <p>Cargando resumen mensual...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tabla-control-emitidos">
                <h3 className="titulo">📊 Control Mensual de CFDI EMITIDOS</h3>
                <div className="tabla-control-error">
                    <p>⚠️ {error}</p>
                </div>
            </div>
        );
    }

    if (!empresaId || resumen.length === 0) {
        return (
            <div className="tabla-control-emitidos">
                <h3 className="titulo">📊 Control Mensual de CFDI EMITIDOS</h3>
                <div className="tabla-control-vacia">
                    <p>📂 Sin CFDIs emitidos registrados</p>
                    <p className="text-sm">Sube XMLs emitidos para ver el resumen aquí</p>
                </div>
            </div>
        );
    }

    // Calcular totales generales
    const totales = resumen.reduce((acc, row) => ({
        total: acc.total + row.total,
        importe: acc.importe + row.importe_total,
    }), { total: 0, importe: 0 });

    return (
        <div className="tabla-control-emitidos">
            <div className="header-tabla">
                <h3 className="titulo">📊 Control Mensual de CFDI EMITIDOS</h3>
                <p className="subtitulo">
                    {resumen.length} meses • {totales.total} CFDIs • {formatCurrency(totales.importe)}
                </p>
            </div>

            <div className="tabla-wrapper">
                <table className="tabla-resumen">
                    <thead>
                        <tr>
                            <th className="mes-col">Mes</th>
                            <th className="tipo-col" title="Ingresos">I</th>
                            <th className="importe-col">Total $</th>
                            <th className="clientes-col">Clientes</th>
                            <th className="total-col">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {resumen.map((row) => (
                            <tr key={row.mes}>
                                <td className="mes-col">
                                    {formatMes(row.mes)}
                                </td>
                                <td className={`tipo-col tipo-I ${row.I > 0 ? '' : 'vacia'}`}>
                                    {row.I || '—'}
                                </td>
                                <td className="importe-col">
                                    {formatCurrency(row.importe_total)}
                                </td>
                                <td className="clientes-col">
                                    {row.clientes}
                                </td>
                                <td className="total-col">
                                    <strong>{row.total}</strong>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="total-row">
                            <td><strong>Total</strong></td>
                            <td>{totales.total}</td>
                            <td><strong>{formatCurrency(totales.importe)}</strong></td>
                            <td>—</td>
                            <td><strong>{totales.total}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <style jsx>{`
                .tabla-control-emitidos {
                    margin-top: 24px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    padding: 20px;
                }

                .header-tabla {
                    margin-bottom: 16px;
                }

                .titulo {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0 0 4px 0;
                }

                .subtitulo {
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin: 0;
                }

                .tabla-wrapper {
                    overflow-x: auto;
                }

                .tabla-resumen {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.875rem;
                }

                .tabla-resumen th {
                    background: #f9fafb;
                    color: #374151;
                    font-weight: 600;
                    padding: 12px 8px;
                    text-align: center;
                    border-bottom: 2px solid #e5e7eb;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .tabla-resumen td {
                    padding: 12px 8px;
                    text-align: center;
                    border-bottom: 1px solid #f3f4f6;
                }

                .tabla-resumen tbody tr:hover {
                    background: #f9fafb;
                }

                .mes-col {
                    text-align: left !important;
                    font-weight: 500;
                    min-width: 120px;
                }

                .tipo-col {
                    min-width: 50px;
                    color: #28a745;
                    font-weight: 600;
                }

                .importe-col {
                    min-width: 120px;
                    font-weight: 600;
                    color: #1a7f3e;
                }

                .clientes-col {
                    min-width: 80px;
                    color: #6366f1;
                }

                .total-col {
                    background: #f1f3f5;
                    font-weight: 600;
                }

                .vacia {
                    color: #adb5bd;
                }

                .tipo-I { color: #28a745; }

                .total-row {
                    background: #f9fafb;
                    font-weight: 600;
                    border-top: 2px solid #e5e7eb;
                }

                .total-row td {
                    padding: 14px 8px;
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
                    border-top: 3px solid #4ade80;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 12px;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                .text-sm {
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin-top: 8px;
                }
            `}</style>
        </div>
    );
};

export default TablaControlEmitidos;
