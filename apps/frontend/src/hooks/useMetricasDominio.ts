/**
 * 📊 HOOK: MÉTRICAS POR DOMINIO (SAT-GRADE)
 * =========================================
 * 
 * Consume los endpoints segregados:
 * - /api/cfdi/emitidos/ingresos
 * - ...
 * 
 * Soporta filtros dinámicos (Mes o Rango de Fechas)
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface MetricasDominio {
    cfdi_del_mes: number;
    importe_total_mes: number;
    clientes_activos: number;
    cargados_hoy: number;
    total_general: number;
}

export interface ResumenMes {
    mes: string;
    total: number;
    importe_total: number;
    clientes: number;
}

export interface FiltrosDominio {
    mes?: string | null;
    fechaInicio?: string | null;
    fechaFin?: string | null;
}

interface UseMetricasDominioResult {
    metricas: MetricasDominio | null;
    resumen: ResumenMes[];
    dominio: string | null;
    rol: 'EMISOR' | 'RECEPTOR' | null;
    tipo: string | null;
    periodo: string | null;
    loading: boolean;
    error: string | null;
    refresh: () => void;
}

export const useMetricasDominio = (
    empresaId: string | null,
    endpoint: string,
    filtros: FiltrosDominio = {}
): UseMetricasDominioResult => {
    const [metricas, setMetricas] = useState<MetricasDominio | null>(null);
    const [resumen, setResumen] = useState<ResumenMes[]>([]);
    const [dominio, setDominio] = useState<string | null>(null);
    const [rol, setRol] = useState<'EMISOR' | 'RECEPTOR' | null>(null);
    const [tipo, setTipo] = useState<string | null>(null);
    const [periodo, setPeriodo] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchDatos = useCallback(async () => {
        if (!empresaId || !endpoint) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const params: any = { empresaId };

            // Lógica de Filtros (Prioridad: Rango > Mes)
            if (filtros.fechaInicio && filtros.fechaFin) {
                params.fechaInicio = filtros.fechaInicio;
                params.fechaFin = filtros.fechaFin;
                // Limpiamos mes si hay rango
                params.mes = undefined;
            } else if (filtros.mes) {
                params.mes = filtros.mes;
            }

            const response = await axios.get(endpoint, { params });

            if (response.data.success) {
                setMetricas(response.data.metricas);
                setResumen(response.data.resumen);
                setDominio(response.data.dominio);
                setRol(response.data.rol);
                setTipo(response.data.tipo);
                setPeriodo(response.data.periodo);
            } else {
                setError('Error al obtener datos del dominio');
            }
        } catch (err: any) {
            console.error('[useMetricasDominio] Error:', err);
            if (err.code === 'ERR_NETWORK') {
                setError('Error de conexión: No se pudo contactar al servidor. (Revise puerto 4000)');
            } else if (err.response) {
                // El servidor respondió con error (4xx, 5xx)
                setError(`Error del servidor (${err.response.status}): ${err.response.data?.message || 'Solicitud rechazada'}`);
            } else if (err.request) {
                // La petición se hizo pero no hubo respuesta
                setError('El servidor no responde. Verifique su conexión.');
            } else {
                setError(err.message || 'Error desconocido de aplicación');
            }
        } finally {
            setLoading(false);
        }
    }, [empresaId, endpoint, filtros.mes, filtros.fechaInicio, filtros.fechaFin]);

    useEffect(() => {
        fetchDatos();
    }, [fetchDatos, refreshTrigger]);

    const refresh = useCallback(() => {
        setRefreshTrigger(prev => prev + 1);
    }, []);

    return {
        metricas,
        resumen,
        dominio,
        rol,
        tipo,
        periodo,
        loading,
        error,
        refresh,
    };
};

export default useMetricasDominio;
