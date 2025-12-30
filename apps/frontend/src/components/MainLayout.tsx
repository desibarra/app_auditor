import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface MainLayoutProps {
    children: ReactNode;
    health?: any;
}

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Auditoría Detallada', path: '/auditoria' },
    { label: 'Expedientes & Riesgos', path: '/expedientes' },
    { label: 'Conciliación Bancaria', path: '/bancos' },
    { label: 'Devoluciones', path: '/devoluciones' },
];

export function MainLayout({ children, health }: MainLayoutProps) {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-zinc-100 text-zinc-900 font-sans text-sm selection:bg-zinc-200">
            {/* Header Utilitario tipo SAP/Oracle */}
            <div className="bg-white border-b border-zinc-300 px-6 py-2 sticky top-0 z-20 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex justify-between items-center h-10">
                    <div className="flex items-center gap-6">
                        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <span className="font-bold tracking-tight text-zinc-800">SENTINEL</span>
                            <span className="px-1.5 py-0.5 bg-zinc-100 border border-zinc-200 text-[10px] font-mono text-zinc-500 rounded-sm">
                                AUDIT MODE
                            </span>
                        </Link>
                        <div className="h-4 w-px bg-zinc-300 mx-2"></div>
                        <nav className="flex gap-6 text-xs font-medium text-zinc-600">
                            {NAV_ITEMS.map((item) => {
                                const isActive = location.pathname.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`transition-colors ${isActive
                                                ? 'text-zinc-900 border-b-2 border-zinc-900 pb-[13px]'
                                                : 'hover:text-zinc-900'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex flex-col items-end">
                            <span className="font-semibold text-zinc-700">Empresa Demo S.A. de C.V.</span>
                            <span className="text-zinc-400 text-[10px]">RFC: DEMO010101AAA</span>
                        </div>
                        <div
                            className={`w-2 h-2 rounded-full ${health ? 'bg-emerald-500' : 'bg-red-500'}`}
                            title={health ? 'Sistema Operativo' : 'Desconectado'}
                        ></div>
                        <Link to="/config" className="text-zinc-400 hover:text-zinc-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </Link>
                    </div>
                </div>
            </div>

            <main className="max-w-[1600px] mx-auto px-6 py-6">
                {children}
            </main>
        </div>
    );
}
