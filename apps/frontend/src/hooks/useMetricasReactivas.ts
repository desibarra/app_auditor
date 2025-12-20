/**
 * 📈 HOOK DE MÉTRICAS REACTIVAS
 * ==============================
 * 
 * Hook custom para manejar métricas de dashboard
 * Se actualiza automáticamente después de cargar XML
 * NO usa cache - siempre recalcula desde BD
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface Metricas {
    cfdi_del_mes: number;
    alertas_activas: number;
    expedientes_incompletos: number;
    total_general: number;
    meses_incompletos: number;  // 🆕 NUEVO KPI
}

export interface DesgloseTipos {
    I: number;
    E: number;
    P: number;
    N: number;
    T: number;
}

export interface MetricasResponse {
    success: boolean;
    mes: string;
    empresaId: string;
    metricas: Metricas;
    desglose_tipos: DesgloseTipos;
    timestamp: string;
}

export function useMetricasReactivas(empresaId: string | null, mes?: string) {
    const [metricas, setMetricas] = useState<Metricas | null>(null);
    const [desglose, setDesglose] = useState<DesgloseTipos | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * 🔄 Carga métricas desde backend
     * SIEMPRE recalcula desde BD
     */
    const cargarMetricas = useCallback(async () => {
        if (!empresaId) {
            setMetricas(null);
            setDesglose(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const params: any = { empresaId };
            if (mes) {
                params.mes = mes;
            }

            const response = await axios.get<MetricasResponse>('/api/cfdi/metricas', { params });

            if (response.data.success) {
                setMetricas(response.data.metricas);
                setDesglose(response.data.desglose_tipos);
            }
        } catch (err: any) {
            console.error('Error cargando métricas:', err);
            setError(err.response?.data?.message || 'Error al cargar métricas');
        } finally {
            setLoading(false);
        }
    }, [empresaId, mes]);

    /**
     * ✅ Forzar recarga (llamar después de importar XML)
     */
    const refresh = useCallback(() => {
        cargarMetricas();
    }, [cargarMetricas]);

    // Cargar al montar y cuando cambia empresa o mes
    useEffect(() => {
        cargarMetricas();
    }, [cargarMetricas]);

    return {
        metricas,
        desglose,
        loading,
        error,
        refresh, // 🔄 Exponer para refresh manual
    };
}

export default useMetricasReactivas;
