import React from 'react';

interface ContextBarProps {
    empresaNombre: string;
    empresaRfc: string;
    periodoLabel: string;
    modo: string; // Dynamic from backend (EMITIDOS | RECIBIDOS | PAGOS)
    subModo: string;
    // Nuevos props para perfil fiscal dinámico
    perfilRiesgo?: string;
    sector?: string;
    regimenFiscal?: string;
    satStatus?: string;
    // Multi-Ejercicio
    ejercicioFiscal?: number;
    versionCfdi?: string;
}

// Mapeo de códigos SAT a nombres legibles
const SECTORES_SAT: Record<string, string> = {
    '484111': 'AUTOTRANSPORTE',
    '541': 'SERVICIOS PROFESIONALES',
    '722': 'SERVICIOS DE ALOJAMIENTO',
    '531': 'COMERCIO AL POR MENOR',
    '432': 'CONSTRUCCIÓN',
    '311': 'INDUSTRIA ALIMENTARIA',
    '621': 'SERVICIOS MÉDICOS',
    '811': 'SERVICIOS DE REPARACIÓN',
};

const ContextBar: React.FC<ContextBarProps> = ({
    empresaNombre,
    empresaRfc,
    periodoLabel,
    modo,
    sector,
    perfilRiesgo,
    satStatus,
    ejercicioFiscal,
    versionCfdi
}) => {
    // Determinar el perfil fiscal dinámicamente
    const getSectorDisplay = () => {
        if (!sector) return { code: '---', name: 'NO CLASIFICADO', icon: '⚠️', color: 'text-yellow-400' };

        const sectorName = SECTORES_SAT[sector] || sector.toUpperCase();
        const icon = sector === '484111' ? '⚓' : '🏢';

        return {
            code: sector,
            name: sectorName,
            icon,
            color: 'text-emerald-400'
        };
    };

    const sectorInfo = getSectorDisplay();
    // const regimenInfo = getRegimenDisplay(); // Removed as it was unused and causing lint warning

    const getStatusDisplay = () => {
        const labels: Record<string, string> = {
            'ACTIVE': 'CONEXIÓN ACTIVA',
            'ERROR': 'ERROR DE VÍNCULO',
            'CONFIGURED': 'CONFIGURADO',
            'DISCONNECTED': 'DESCONECTADO'
        };

        const label = labels[satStatus || ''] || 'DESCONNECTED';

        if (satStatus === 'ACTIVE') {
            return (
                <div className="badge-success">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                    {label}
                </div>
            );
        }

        if (satStatus === 'ERROR') {
            return (
                <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-rose-500"></span>
                    {label}
                </div>
            );
        }

        return (
            <div className="badge-primary">
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                {label}
            </div>
        );
    };

    // Determinar badge de ejercicio fiscal
    const getEjercicioBadge = () => {
        if (!ejercicioFiscal || !versionCfdi) return null;

        const isOld = ejercicioFiscal < 2022;
        const color = isOld ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-slate-50 border-[#0f172a]/10 text-[#0f172a]';

        return (
            <div className={`px-2.5 py-1 rounded-lg border text-[10px] font-black font-mono shadow-sm ${color}`}>
                EJERCICIO {ejercicioFiscal} – CFDI {versionCfdi}
            </div>
        );
    };

    return (
        <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200 px-8 py-5 flex flex-col md:flex-row md:items-center justify-between sticky top-16 z-10 shadow-sm">
            {/* BLOQUE IDENTIDAD */}
            <div className="flex items-center gap-5 min-w-0 flex-1">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 hidden md:block">
                    <svg className="w-5 h-5 text-[#0f172a]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div className="min-w-0">
                    <h2 className="text-slate-900 font-black text-sm tracking-tight truncate flex items-center gap-2 uppercase" title={empresaNombre}>
                        {empresaNombre || 'SELECCIONE EMPRESA'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[#0f172a] text-[10px] font-black font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200 tracking-tighter">
                            {empresaRfc || '---'}
                        </span>
                        {getStatusDisplay()}
                    </div>
                </div>
            </div>

            {/* SEPARADOR VISUAL */}
            <div className="hidden md:block w-px h-10 bg-slate-100 mx-8"></div>

            {/* BLOQUE PERFIL FISCAL (SENTINEL) - DINÁMICO */}
            <div className="hidden lg:flex flex-col min-w-[220px]">
                <span className="block text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Análisis Forense</span>
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${perfilRiesgo === 'CRÍTICO' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : perfilRiesgo === 'MEDIO' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                        <span className={`text-[11px] font-black uppercase tracking-widest ${perfilRiesgo === 'CRÍTICO' ? 'text-rose-600' : perfilRiesgo === 'MEDIO' ? 'text-amber-600' : 'text-emerald-600'}`}>
                            RIESGO: {perfilRiesgo || 'ANALIZANDO...'}
                        </span>
                    </div>
                    <span
                        className="text-slate-500 text-[10px] font-black truncate uppercase tracking-tight flex items-center gap-1.5"
                        title={`${sectorInfo.code} - ${sectorInfo.name}`}
                    >
                        <span className="p-1 bg-slate-50 rounded-md border border-slate-100">{sectorInfo.icon}</span> {sectorInfo.name}
                    </span>
                </div>
            </div>

            {/* SEPARADOR VISUAL */}
            <div className="hidden md:block w-px h-10 bg-slate-100 mx-8"></div>

            {/* BLOQUE CONTEXTO OPERATIVO */}
            <div className="flex items-center gap-8 mt-2 md:mt-0">
                <div className="text-right sm:text-left">
                    <span className="block text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Periodo Auditoría</span>
                    <span className="text-slate-900 font-bold text-xs block bg-white px-4 py-1.5 rounded-lg border border-slate-200 shadow-sm uppercase">
                        {(() => {
                            if (!periodoLabel || periodoLabel === 'HISTÓRICO GLOBAL') return 'HISTÓRICO GLOBAL';
                            const [year, month] = periodoLabel.split('-');
                            if (year && month) {
                                const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
                                return `${months[parseInt(month) - 1]} ${year}`;
                            }
                            return periodoLabel;
                        })()}
                    </span>
                </div>

                {/* BADGE EJERCICIO FISCAL */}
                {getEjercicioBadge()}

                <div className="text-right">
                    <span className="block text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2 text-right">Flujo Operativo</span>
                    <div className="flex items-center justify-end gap-3">
                        <span className={`w-2 h-2 rounded-full ${modo === 'EMITIDOS' || modo === 'VENTAS' ? 'bg-[#0f172a]' : 'bg-slate-400'}`}></span>
                        <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${modo === 'EMITIDOS' || modo === 'VENTAS' ? 'text-[#0f172a]' : 'text-slate-600'}`}>
                            {modo}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContextBar;
