import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
    children: ReactNode;
    title: string;
    lastUpdate?: Date | null;
}

const MissionControlLayout: React.FC<LayoutProps> = ({ children, title, lastUpdate }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { label: 'DASHBOARD', path: '/dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { label: 'AUDITORÍA', path: '/auditoria', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
        { label: 'DEVOLUCIONES IVA', path: '/devoluciones', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.407 2.67 1a2.4 2.4 0 01.4 0M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.407-2.67-1a2.4 2.4 0 01-.4 0M12 16v1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
        { label: 'EXPEDIENTES', path: '/expedientes', icon: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z' },
        { label: 'BANCOS', path: '/bancos', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
        { label: 'CONFIGURACIÓN', path: '/config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    ];

    // Formatear última actualización
    const formatLastUpdate = () => {
        if (!lastUpdate) {
            return 'Aún no se han importado datos';
        }

        const now = new Date();
        const diff = now.getTime() - lastUpdate.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours < 1) {
            return `HACE ${minutes} MIN`;
        } else if (hours < 24) {
            return `HOY ${lastUpdate.getHours().toString().padStart(2, '0')}:${lastUpdate.getMinutes().toString().padStart(2, '0')}`;
        } else {
            const day = lastUpdate.getDate().toString().padStart(2, '0');
            const month = (lastUpdate.getMonth() + 1).toString().padStart(2, '0');
            return `${day}/${month} ${lastUpdate.getHours().toString().padStart(2, '0')}:${lastUpdate.getMinutes().toString().padStart(2, '0')}`;
        }
    };

    return (
        <div className="flex min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-primary)] font-sans">
            {/* SIDEBAR - MISSION CONTROL STYLE */}
            <aside className="w-64 bg-[#050505] border-r border-gray-800 flex flex-col fixed h-full z-30 shadow-2xl">
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-gray-800 bg-[#050505]">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)] group-hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all">
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold tracking-tight text-white text-sm">FiscalAlly</span>
                            <span className="text-[10px] text-gray-400 font-medium tracking-wide">DEFENSA 2026</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 space-y-1 px-3">
                    {menuItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center px-4 py-3 text-xs font-bold tracking-wide rounded-md transition-all duration-200 group relative overflow-hidden ${isActive
                                    ? 'bg-[#1A1F2E] text-blue-400 border-l-[3px] border-blue-500'
                                    : 'text-gray-400 hover:bg-[#1A1F2E] hover:text-gray-200'
                                    }`}
                            >
                                <svg
                                    className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                                {item.label}
                                {isActive && (
                                    <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer User Info */}
                <div className="p-4 border-t border-gray-800 bg-[#080a0f]">
                    <div className="flex items-center gap-3 px-2">
                        <div className="relative">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
                        </div>
                        <div className="text-xs">
                            <p className="text-gray-300 font-medium">SISTEMA ACTIVO</p>
                            <p className="text-gray-500 font-mono text-[10px]">v2.4.0 SAT-L5</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen">

                {/* Header Contextual */}
                <header className="h-16 border-b border-gray-800 bg-[#0B0E14]/95 sticky top-0 z-20 px-8 flex items-center justify-between backdrop-blur-md supports-[backdrop-filter]:bg-[#0B0E14]/80">
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                            {title.toUpperCase()}
                        </h1>
                    </div>

                    {/* Status Bar Global */}
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-900 border border-gray-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                            <span className="text-gray-400 font-mono text-[10px] font-bold uppercase tracking-wider">
                                ULT. ACT: {formatLastUpdate()}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">SEGURIDAD:</span>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                                <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                <span className="text-emerald-500 font-bold text-[10px] tracking-wider">BLINDADO</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Injection */}
                <main className="flex-1 p-8 overflow-y-auto bg-[var(--color-bg-app)]">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MissionControlLayout;
