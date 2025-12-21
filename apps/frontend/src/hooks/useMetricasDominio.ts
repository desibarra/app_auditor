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
import { DEMO_METRICAS, DEMO_RESUMEN } from '../data/demoData'; // IMPORT DEMO DATA

const USE_DEMO_MODE = false; // ACTIVAR MODO DEMO

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
        if (!empresaId) return;

        // --- DEMO MODE INJECTION ---
        if (USE_DEMO_MODE) {
            setLoading(true);
            setTimeout(() => {
                setMetricas(DEMO_METRICAS);
                setResumen(DEMO_RESUMEN);
                setDominio("demo-forense.com.mx");
                setRol("EMISOR");
                setTipo("Ingresos");
                setPeriodo("Septiembre 2025");
                setError(null);
                setLoading(false);
            }, 500);
            return;
        }
        // ---------------------------

        if (!endpoint) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // Construir Query Params
            const params = new URLSearchParams();
            if (filtros.mes) params.append('mes', filtros.mes);
            if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
            if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
            params.append('empresaId', empresaId); // 👈 FIXED: Backend expects Query Param

            const url = `${endpoint}?${params.toString()}`;

            const response = await axios.get(url);

            const data = response.data;
            setMetricas(data.metricas);
            setResumen(data.resumen);
            setDominio(data.dominio);
            setRol(data.rol);
            setTipo(data.tipo);
            setPeriodo(data.periodo);
            setError(null);

        } catch (err) {
            console.error('Error fetching metricas dominio:', err);
            setError('No se pudieron cargar las métricas');
        } finally {
            setLoading(false);
        }
    }, [empresaId, endpoint, JSON.stringify(filtros), refreshTrigger]);

    useEffect(() => {
        fetchDatos();
    }, [fetchDatos]);

    const refresh = () => setRefreshTrigger(prev => prev + 1);

    return { metricas, resumen, dominio, rol, tipo, periodo, loading, error, refresh };
};
