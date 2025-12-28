/**
 * Mapeo de estados de defensa fiscal para la UI.
 * Alineado a Sentinel 2026 (RMF).
 * No cambia el diseño, solo interpreta los estados del backend para mostrarlos correctamente.
 */

export type DefenseStatus = 'VALID' | 'FISCAL_RISK' | 'PROBATORY_RISK' | 'CRITICAL';

export const getDefenseStatus = (
    isValid: boolean,
    riskLevel?: 'ALTO' | 'MEDIO' | 'BAJO',
    riskType?: 'FISCAL' | 'MATERIALIDAD' | 'DEDUCIBILIDAD'
): DefenseStatus => {
    if (!isValid) return 'CRITICAL';

    if (riskLevel === 'ALTO') return 'CRITICAL';

    if (riskType === 'FISCAL') return 'FISCAL_RISK';

    if (riskType === 'MATERIALIDAD') return 'PROBATORY_RISK';

    return 'VALID';
};

export const getStatusLabel = (status: DefenseStatus): string => {
    switch (status) {
        case 'VALID': return 'Técnicamente Correcto';
        case 'FISCAL_RISK': return 'Riesgo Fiscal RMF';
        case 'PROBATORY_RISK': return 'Materialidad Incompleta';
        case 'CRITICAL': return 'No Defendible';
        default: return 'Desconocido';
    }
};

export const getStatusColor = (status: DefenseStatus): string => {
    switch (status) {
        case 'VALID': return 'text-emerald-400';
        case 'FISCAL_RISK': return 'text-rose-400';
        case 'PROBATORY_RISK': return 'text-amber-400';
        case 'CRITICAL': return 'text-red-600 font-bold';
        default: return 'text-gray-400';
    }
};
