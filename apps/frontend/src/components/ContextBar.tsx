import React from 'react';

interface ContextBarProps {
    empresaNombre: string;
    empresaRfc: string;
    periodoLabel: string;
    modo: 'emitidos' | 'recibidos';
    subModo: string;
    // Nuevos props para perfil fiscal dinámico
    sector?: string;
    regimenFiscal?: string;
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

const REGIMENES_SAT: Record<string, string> = {
    '601': 'GENERAL DE LEY',
    '603': 'PERSONAS MORALES CON FINES NO LUCRATIVOS',
    '605': 'SUELDOS Y SALARIOS',
    '606': 'ARRENDAMIENTO',
    '607': 'RÉGIMEN DE ENAJENACIÓN',
    '608': 'DEMÁS INGRESOS',
    '610': 'RESIDENTES EN EL EXTRANJERO',
    '611': 'INGRESOS POR DIVIDENDOS',
    '612': 'PERSONAS FÍSICAS CON ACTIVIDADES EMPRESARIALES',
    '614': 'INGRESOS POR INTERESES',
    '615': 'RÉGIMEN DE LOS INGRESOS POR OBTENCIÓN DE PREMIOS',
    '616': 'SIN OBLIGACIONES FISCALES',
    '620': 'SOCIEDADES COOPERATIVAS DE PRODUCCIÓN',
    '621': 'INCORPORACIÓN FISCAL',
    '622': 'ACTIVIDADES AGRÍCOLAS, GANADERAS, SILVÍCOLAS Y PESQUERAS',
    '623': 'OPCIONAL PARA GRUPOS DE SOCIEDADES',
    '624': 'COORDINADOS',
    '625': 'RÉGIMEN DE LAS ACTIVIDADES EMPRESARIALES CON INGRESOS A TRAVÉS DE PLATAFORMAS TECNOLÓGICAS',
    '626': 'RÉGIMEN SIMPLIFICADO DE CONFIANZA',
};

const ContextBar: React.FC<ContextBarProps> = ({
    empresaNombre,
    empresaRfc,
    periodoLabel,
    modo,
    sector,
    regimenFiscal,
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

    const getRegimenDisplay = () => {
        if (!regimenFiscal) return { code: '---', name: 'NO DEFINIDO', color: 'text-gray-500' };

        const regimenName = REGIMENES_SAT[regimenFiscal] || regimenFiscal.toUpperCase();

        return {
            code: regimenFiscal,
            name: regimenName,
            color: 'text-gray-400'
        };
    };

    const sectorInfo = getSectorDisplay();
    const regimenInfo = getRegimenDisplay();

    // Determinar badge de ejercicio fiscal
    const getEjercicioBadge = () => {
        if (!ejercicioFiscal || !versionCfdi) return null;

        const isOld = ejercicioFiscal < 2022;
        const color = isOld ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400';

        return (
            <div className={`px-2 py-1 rounded border text-[10px] font-mono ${color}`}>
                Ejercicio {ejercicioFiscal} – CFDI {versionCfdi}
            </div>
        );
    };

    return (
        <div className="bg-[#0B0E14]/90 border-b border-gray-800 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between sticky top-16 z-10 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-[#0B0E14]/80 transition-all">
            {/* BLOQUE IDENTIDAD */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 hidden md:block">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div className="min-w-0">
                    <h2 className="text-gray-100 font-bold text-sm tracking-tight truncate flex items-center gap-2" title={empresaNombre}>
                        {empresaNombre || 'SELECCIONE EMPRESA'}
                    </h2>
                    <p className="text-gray-500 text-[10px] font-mono tracking-wider flex items-center gap-2 mt-0.5">
                        {empresaRfc || '---'}
                        {empresaRfc && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                                <span className="text-emerald-500 font-bold">ACTIVO</span>
                            </>
                        )}
                    </p>
                </div>
            </div>

            {/* SEPARADOR VISUAL */}
            <div className="hidden md:block w-px h-8 bg-gray-800/50 mx-6"></div>

            {/* BLOQUE PERFIL FISCAL (SENTINEL) - DINÁMICO */}
            <div className="hidden lg:flex flex-col min-w-[200px]">
                <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">PERFIL DE RIESGO</span>
                <div className="flex flex-col leading-tight">
                    <span
                        className={`${sectorInfo.color} text-xs font-bold font-mono truncate`}
                        title={`${sectorInfo.code} - ${sectorInfo.name}`}
                    >
                        {sectorInfo.icon} {sectorInfo.code}
                    </span>
                    <span
                        className={`text-gray-400 text-[10px] truncate`}
                        title={`${regimenInfo.code} - ${regimenInfo.name}`}
                    >
                        {regimenInfo.name}
                    </span>
                </div>
            </div>

            {/* SEPARADOR VISUAL */}
            <div className="hidden md:block w-px h-8 bg-gray-800/50 mx-6"></div>

            {/* BLOQUE CONTEXTO OPERATIVO */}
            <div className="flex items-center gap-6 mt-2 md:mt-0">
                <div>
                    <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">PERIODO</span>
                    <span className="text-gray-200 font-mono text-xs font-bold block bg-gray-800/50 px-2 py-0.5 rounded border border-gray-700">
                        {(() => {
                            if (!periodoLabel || periodoLabel === 'HISTÓRICO GLOBAL') return 'HISTÓRICO GLOBAL';
                            const [year, month] = periodoLabel.split('-');
                            if (year && month) {
                                const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
                                return `${months[parseInt(month) - 1]} ${year}`;
                            }
                            return periodoLabel;
                        })()}
                    </span>
                </div>

                {/* BADGE EJERCICIO FISCAL */}
                {getEjercicioBadge()}

                <div>
                    <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">VISTA ACTIVA</span>
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${modo === 'emitidos' ? 'bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]' : 'bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.5)]'}`}></span>
                        <span className="text-gray-300 text-xs font-bold uppercase tracking-tight">
                            {modo}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContextBar;
