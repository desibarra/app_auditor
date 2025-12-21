import React from 'react';

interface ContextBarProps {
    empresaNombre: string;
    empresaRfc: string;
    periodoLabel: string;
    modo: 'emitidos' | 'recibidos';
    subModo: string;
}

const ContextBar: React.FC<ContextBarProps> = ({ empresaNombre, empresaRfc, periodoLabel, modo, subModo }) => {
    return (
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between sticky top-16 z-10 shadow-md backdrop-blur-md bg-opacity-95">
            {/* BLOQUE IDENTIDAD */}
            <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="bg-emerald-900/30 p-2 rounded border border-emerald-900/50 hidden md:block">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div className="min-w-0">
                    <h2 className="text-white font-bold text-sm tracking-wide truncate" title={empresaNombre}>
                        {empresaNombre || 'SELECCIONE EMPRESA'}
                    </h2>
                    <p className="text-gray-400 text-xs font-mono tracking-wider flex items-center gap-2">
                        {empresaRfc || '---'}
                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                        <span className="text-emerald-500 font-bold">ACTIVO</span>
                    </p>
                </div>
            </div>



            {/* SEPARADOR VISUAL */}
            <div className="hidden md:block w-px h-8 bg-gray-700 mx-6"></div>

            {/* BLOQUE PERFIL FISCAL (SENTINEL) */}
            <div className="hidden lg:flex flex-col min-w-[200px]">
                <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest">PERFIL FISCAL SENTINEL</span>
                <div className="flex flex-col leading-tight">
                    <span className="text-emerald-400 text-xs font-bold font-mono truncate" title="484111 - Autotransporte de carga general">
                        ⚓ 484111 - AUTOTRANSPORTE
                    </span>
                    <span className="text-gray-400 text-[10px] truncate" title="601 - General de Ley Personas Morales">
                        ⚖️ 601 - GENERAL DE LEY
                    </span>
                </div>
            </div>

            {/* SEPARADOR VISUAL */}
            <div className="hidden md:block w-px h-8 bg-gray-700 mx-6"></div>

            {/* BLOQUE CONTEXTO OPERATIVO */}
            <div className="flex items-center gap-6 mt-2 md:mt-0">
                <div>
                    <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest">PERIODO</span>
                    <span className="text-gray-200 font-mono text-sm font-bold">
                        {(() => {
                            if (!periodoLabel || periodoLabel === 'HISTÓRICO GLOBAL') return 'HISTÓRICO GLOBAL';
                            // Intenta parsear YYYY-MM
                            const [year, month] = periodoLabel.split('-');
                            if (year && month) {
                                const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
                                return `${months[parseInt(month) - 1]} ${year}`;
                            }
                            return periodoLabel;
                        })()}
                    </span>
                </div>
                <div>
                    <span className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest">VISUALIZACIÓN</span>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${modo === 'emitidos' ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                        <span className="text-white text-sm font-bold uppercase">
                            {modo} <span className="text-gray-500">/</span> {subModo}
                        </span>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ContextBar;
