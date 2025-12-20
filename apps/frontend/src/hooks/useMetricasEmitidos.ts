/**
 * 📊 HOOK: MÉTRICAS CFDI EMITIDOS
 * ===============================
 * 
 * Gestiona métricas en tiempo real de CFDIs EMITIDOS
 * - Consume /api/cfdi/emitidos/metricas
 * - Se actualiza cuando cambia empresa o mes
 * - Expone función refresh() para actualizar manualmente
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface MetricasEmitidos {
    cfdi_del_mes: number;
    importe_total_mes: number;
    clientes_activos: number;
    cargados_hoy: number;
    total_general: number;
}

interface UseMetricasEmitidosResult {
    metricas: MetricasEmitidos | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export const useMetricasEmitidos = (
    empresaId: string | null,
    mes?: string
): UseMetricasEmitidosResult => {
    const [metricas, setMetricas] = useState<MetricasEmitidos | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchMetricas = useCallback(async () => {
        if (!empresaId) {
            setMetricas(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const params: any = { empresaId };
            if (mes) params.mes = mes;

            const response = await axios.get('/api/cfdi/emitidos/metricas', { params });

            if (response.data.success) {
                setMetricas(response.data.metricas);
            } else {
                setError('Error al obtener métricas de emitidos');
            }
        } catch (err: any) {
            console.error('[useMetricasEmitidos] Error:', err);
            setError(err.response?.data?.message || 'Error al cargar métricas de emitidos');
        } finally {
            setLoading(false);
        }
    }, [empresaId, mes]);

    useEffect(() => {
        fetchMetricas();
    }, [fetchMetricas, refreshTrigger]);

    const refresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    return {
        metricas,
        loading,
        error,
        refresh,
    };
};

export default useMetricasEmitidos;
