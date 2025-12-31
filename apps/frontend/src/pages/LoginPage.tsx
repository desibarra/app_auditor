import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulación de login para demostración de UI
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-slate-100 rounded-full blur-[120px] -mr-96 -mt-96 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-[100px] -ml-64 -mb-64 opacity-30"></div>

            <div className="relative z-10 w-full max-w-[480px] px-6 py-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">

                <div className="flex flex-col items-center mb-12">
                    <div className="w-20 h-20 bg-[#0f172a] rounded-[2rem] flex items-center justify-center text-white text-4xl shadow-2xl shadow-slate-900/20 mb-6 group hover:scale-110 transition-transform duration-500">
                        🛡️
                    </div>
                    <h1 className="text-4xl font-black text-[#0f172a] tracking-tight uppercase">
                        SENTINEL<span className="text-slate-200"> v2.0</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-3">
                        Terminal de Inteligencia Fiscal
                    </p>
                </div>

                <div className="bg-white border border-slate-100 rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-slate-200/60">
                    <div className="mb-10 text-center">
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Acceso de Auditor</h2>
                        <p className="text-[10px] text-slate-400 font-medium uppercase mt-1">Ingrese sus credenciales de bóveda autorizadas</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Identificador (Email)</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl opacity-30 grayscale group-focus-within:grayscale-0 group-focus-within:opacity-100 transition-all duration-300">📧</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="usuario@protocolo.com"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-500/5 focus:border-[#0f172a] outline-none transition-all shadow-inner placeholder:text-slate-300 placeholder:font-bold"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Clave de Acceso</label>
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl opacity-30 grayscale group-focus-within:grayscale-0 group-focus-within:opacity-100 transition-all duration-300">🔑</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-14 pr-6 py-4 text-sm font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-500/5 focus:border-[#0f172a] outline-none transition-all shadow-inner placeholder:text-slate-300"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                className="w-full bg-[#0f172a] text-white py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-slate-900/30 hover:bg-black hover:-translate-y-1 active:scale-95 active:translate-y-0 transition-all duration-500"
                            >
                                INICIAR SESIÓN EN BÓVEDA
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.2em]">
                            Protegido por Cifrado de Grado Forense
                        </p>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <button className="text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-[#0f172a] transition-colors">
                        Protocolo de Recuperación de Identidad
                    </button>
                </div>

            </div>
        </div>
    );
};

export default LoginPage;

