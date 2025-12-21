import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
    children: ReactNode;
    title: string;
}

const MissionControlLayout: React.FC<LayoutProps> = ({ children, title }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { label: 'CONTROL FISCAL', path: '/dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
        { label: 'EXPEDIENTES', path: '/expedientes', icon: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z' },
        { label: 'BANCOS', path: '/bancos', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' }, // Icono genérico banco
        { label: 'CONFIGURACIÓN', path: '/config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    ];

    return (
        <div className="flex min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-emerald-500 selection:text-white">
            {/* SIDEBAR - MISSION CONTROL STYLE */}
            <aside className="w-64 bg-black border-r border-gray-800 flex flex-col fixed h-full z-30">
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-gray-800 bg-black/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-emerald-600 rounded flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                            <span className="text-white font-bold text-lg">K</span>
                        </div>
                        <span className="font-bold tracking-widest text-emerald-400 text-sm">SENTINEL</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 space-y-2 px-3">
                    {menuItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center px-4 py-3 text-xs font-bold tracking-wider rounded-lg transition-all duration-200 group ${isActive
                                        ? 'bg-gray-800 text-emerald-400 border-l-4 border-emerald-500 shadow-lg'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <svg
                                    className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-white'}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                                </svg>
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer User Info */}
                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div className="text-xs">
                            <p className="text-gray-300 font-medium">SISTEMA ONLINE</p>
                            <p className="text-gray-600 font-mono text-[10px]">v2.4.0 SAT-L5</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 ml-64 flex flex-col min-h-screen bg-[#0a0a0a]">

                {/* Header Contextual */}
                <header className="h-16 border-b border-gray-800 bg-gray-900/95 sticky top-0 z-20 px-8 flex items-center justify-between backdrop-blur">
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                            {title.toUpperCase()}
                        </h1>
                    </div>

                    {/* Status Bar Global */}
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 px-3 py-1 rounded bg-black/30 border border-gray-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            <span className="text-gray-400 font-mono text-xs">ULT. ACT: HOY 14:02</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs font-bold">SEGURIDAD:</span>
                            <span className="text-emerald-500 font-bold tracking-wider">SECURE</span>
                        </div>
                    </div>
                </header>

                {/* Content Injection */}
                <main className="flex-1 p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MissionControlLayout;
