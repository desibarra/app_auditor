import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MissionControlLayout from '../components/MissionControlLayout';
import { useEmpresa } from '../context/EmpresaContext';

// Interfaces for UI only (Mapping from Backend)
interface ConfigData {
    perfil: {
        rfc: string;
        razonSocial: string;
        regimenFiscal: string;
        sector: string;
    };
    sat: {
        authMode: 'NONE' | 'RFC_ONLY' | 'CIEC' | 'FIEL';
        status: 'DISCONNECTED' | 'CONFIGURED' | 'ACTIVE' | 'ERROR';
        lastSync: string | null;
    };
    umbrales: {
        maxEgresosFueraGiro: number;
        isrBajo: number;
        concentracionProveedor: number;
    };
    preferencias: {
        emailAlertas: boolean;
        emailDestino: string;
        temaOscuro: boolean;
    };
}

const ConfiguracionPage: React.FC = () => {
    const { empresa, loading: contextLoading, refreshEmpresas } = useEmpresa();
    const [localLoading, setLocalLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Estados para archivos y credenciales
    const [fileCer, setFileCer] = useState<File | null>(null);
    const [fileKey, setFileKey] = useState<File | null>(null);
    const [passFiel, setPassFiel] = useState('');
    const [passCiec, setPassCiec] = useState('');

    const [config, setConfig] = useState<ConfigData>({
        perfil: { rfc: '', razonSocial: '', regimenFiscal: '', sector: '' },
        sat: { authMode: 'NONE', status: 'DISCONNECTED', lastSync: null },
        umbrales: { maxEgresosFueraGiro: 10, isrBajo: 8, concentracionProveedor: 30 },
        preferencias: { emailAlertas: false, emailDestino: '', temaOscuro: true }
    });

    const [activeTab, setActiveTab] = useState<'perfil' | 'umbrales' | 'integraciones' | 'preferencias'>('integraciones');

    useEffect(() => {
        if (empresa?.id) {
            fetchConfig(empresa.id);
        }
    }, [empresa]);

    const fetchConfig = async (id: string) => {
        try {
            setLocalLoading(true);
            const res = await axios.get(`/api/empresas/${id}`);
            const data = res.data;
            const conf = typeof data.configuracion === 'string' ? JSON.parse(data.configuracion) : (data.configuracion || {});

            setConfig({
                perfil: {
                    rfc: data.rfc,
                    razonSocial: data.razonSocial,
                    regimenFiscal: data.regimenFiscal || '',
                    sector: data.sector || ''
                },
                sat: {
                    authMode: data.satAuthMode || 'NONE',
                    status: data.satStatus || 'DISCONNECTED',
                    lastSync: data.lastSatSyncAt || null
                },
                umbrales: {
                    maxEgresosFueraGiro: conf.umbrales?.maxEgresosFueraGiro ?? 10,
                    isrBajo: conf.umbrales?.isrBajo ?? 8,
                    concentracionProveedor: conf.umbrales?.concentracionProveedor ?? 30
                },
                preferencias: {
                    emailAlertas: conf.preferencias?.emailAlertas ?? false,
                    emailDestino: conf.preferencias?.emailDestino ?? '',
                    temaOscuro: conf.preferencias?.temaOscuro ?? true
                }
            });
        } catch (error) {
            console.error("Error loading config", error);
        } finally {
            setLocalLoading(false);
        }
    };

    const handleFielUpload = async () => {
        if (!empresa?.id) return;
        if (!fileCer || !fileKey || !passFiel) {
            alert('Por favor cargue el certificado (.cer), la llave (.key) y la contraseña de la FIEL.');
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('cer', fileCer);
            formData.append('key', fileKey);
            formData.append('passwordFiel', passFiel);
            if (passCiec) formData.append('passwordCiec', passCiec);

            const res = await axios.post(`/api/empresas/${empresa.id}/fiel`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                alert('¡Configuración Exitosa! La empresa ahora está vinculada legalmente.');
                await fetchConfig(empresa.id);
                if (refreshEmpresas) await refreshEmpresas();
            }
        } catch (error: any) {
            console.error("Error uploading FIEL", error);
            alert('Error al procesar los certificados: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!empresa?.id) return;
        try {
            setSaving(true);
            const payload = {
                razonSocial: config.perfil.razonSocial,
                regimenFiscal: config.perfil.regimenFiscal,
                sector: config.perfil.sector,
                satAuthMode: config.sat.authMode,
                configuracion: {
                    umbrales: config.umbrales,
                    preferencias: config.preferencias
                }
            };
            await axios.put(`/api/empresas/${empresa.id}`, payload);
            await fetchConfig(empresa.id);
            alert('Configuración actualizada correctamente');
        } catch (error) {
            console.error("Error saving config", error);
            alert('Error al guardar configuración');
        } finally {
            setSaving(false);
        }
    };

    const isLoading = contextLoading || localLoading;

    const StatusBadge = ({ status }: { status: string }) => {
        const labels = {
            'DISCONNECTED': 'DESCONECTADO',
            'CONFIGURED': 'CONFIGURADO',
            'ACTIVE': 'CONEXIÓN ACTIVA',
            'ERROR': 'ERROR DE VÍNCULO'
        };

        if (status === 'ACTIVE') return <div className="badge-success"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{labels['ACTIVE']}</div>;
        if (status === 'ERROR') return <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-100 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>{labels['ERROR']}</div>;

        return <div className="badge-primary"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>{labels[status as keyof typeof labels] || status}</div>;
    };

    return (
        <MissionControlLayout title="Configuración de Sistema">
            <div className="flex flex-col h-full max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">

                {/* Header Actions */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 flex items-center justify-between shadow-2xl shadow-slate-200/40 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-slate-50 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none group-hover:bg-slate-100/50 transition-all duration-1000"></div>

                    <div className="flex items-center gap-8 relative z-10 flex-1">
                        <div className="p-5 bg-[#0f172a] rounded-[2rem] text-white shadow-xl shadow-slate-900/20">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-1">Unidad Corporativa Activa</p>
                            <div className="flex flex-col">
                                {empresa ? (
                                    <>
                                        <div className="font-black text-3xl text-slate-900 tracking-tighter uppercase">{empresa.razonSocial}</div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl font-black text-xs font-mono text-slate-600 shadow-inner">{empresa.rfc}</span>
                                            <StatusBadge status={config.sat.status} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-slate-400 font-bold uppercase text-xs tracking-widest italic flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-slate-300 rounded-full"></span>
                                        No hay ninguna empresa seleccionada en el protocolo actual
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <button
                            onClick={handleSave}
                            disabled={saving || !empresa}
                            className="btn-primary py-4 px-10 shadow-xl shadow-slate-900/10 min-w-[200px]"
                        >
                            {saving ? (
                                <div className="h-4 w-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                            ) : <span>💾</span>}
                            {saving ? 'GUARDANDO PROTOCOLO...' : 'GUARDAR CAMBIOS'}
                        </button>
                    </div>
                </div>

                <div className="flex gap-12 flex-1">
                    {/* Sidebar Navigation */}
                    <div className="w-72 space-y-3 pt-4">
                        <p className="px-6 pb-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Protocolos de Gestión</p>
                        <button
                            onClick={() => setActiveTab('integraciones')}
                            className={`flex items-center justify-between px-7 py-4.5 text-[11px] font-black uppercase tracking-widest w-full rounded-[2rem] transition-all border ${activeTab === 'integraciones' ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-2xl shadow-slate-900/20 active:scale-95' : 'text-slate-500 bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`text-xl ${activeTab === 'integraciones' ? 'opacity-100' : 'opacity-40 grayscale group-hover:opacity-100 transition-all'}`}>🔐</span>
                                <span>Conexión SAT</span>
                            </div>
                            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'integraciones' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-200'}`}></div>
                        </button>
                        <button
                            onClick={() => setActiveTab('perfil')}
                            className={`flex items-center justify-between px-7 py-4.5 text-[11px] font-black uppercase tracking-widest w-full rounded-[2rem] transition-all border ${activeTab === 'perfil' ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-2xl shadow-slate-900/20 active:scale-95' : 'text-slate-500 bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-300'}`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`text-xl ${activeTab === 'perfil' ? 'opacity-100' : 'opacity-40 grayscale group-hover:opacity-100 transition-all'}`}>⚖️</span>
                                <span>Perfil Fiscal</span>
                            </div>
                            <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'perfil' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-200'}`}></div>
                        </button>
                    </div>

                    {/* Content Panel */}
                    <div className="flex-1 bg-white rounded-[3rem] border border-slate-100 p-12 shadow-2xl shadow-slate-200/40 min-h-[650px] relative transition-all duration-500">

                        {isLoading && (
                            <div className="flex flex-col items-center justify-center h-full gap-5">
                                <div className="w-14 h-14 border-x-4 border-slate-100 border-t-4 border-t-[#0f172a] rounded-2xl animate-spin"></div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Accediendo a Bóveda de Configuración...</p>
                            </div>
                        )}

                        {!isLoading && activeTab === 'integraciones' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Nivel de Integración Fiscal</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Establezca el protocolo de comunicación con la plataforma del SAT</p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">

                                    {/* MODO: NONE */}
                                    <label className={`cursor-pointer border-2 p-8 rounded-[2.5rem] transition-all relative group overflow-hidden ${config.sat.authMode === 'NONE' ? 'border-[#0f172a] bg-slate-50 shadow-inner' : 'border-slate-50 hover:border-slate-200 bg-slate-50/20'}`}>
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${config.sat.authMode === 'NONE' ? 'bg-[#0f172a] text-white' : 'bg-white border border-slate-100 text-slate-300'} group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                                </div>
                                                <span className={`font-black uppercase text-xs tracking-widest ${config.sat.authMode === 'NONE' ? 'text-slate-900' : 'text-slate-400'}`}>Operación Manual</span>
                                            </div>
                                            <input type="radio" name="authMode" checked={config.sat.authMode === 'NONE'} onChange={() => setConfig({ ...config, sat: { ...config.sat, authMode: 'NONE' } })} className="w-5 h-5 accent-[#0f172a] cursor-pointer" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium leading-[1.8] uppercase">Auditorías discretas basadas exclusivamente en la carga manual de archivos XML.</p>
                                    </label>

                                    {/* MODO: RFC_ONLY */}
                                    <label className={`cursor-pointer border-2 p-8 rounded-[2.5rem] transition-all relative group overflow-hidden ${config.sat.authMode === 'RFC_ONLY' ? 'border-[#0f172a] bg-slate-50 shadow-inner' : 'border-slate-50 hover:border-slate-200 bg-slate-50/20'}`}>
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${config.sat.authMode === 'RFC_ONLY' ? 'bg-[#0f172a] text-white' : 'bg-white border border-slate-100 text-slate-300'} group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                                </div>
                                                <span className={`font-black uppercase text-xs tracking-widest ${config.sat.authMode === 'RFC_ONLY' ? 'text-slate-900' : 'text-slate-400'}`}>Consulta Pública</span>
                                            </div>
                                            <input type="radio" name="authMode" checked={config.sat.authMode === 'RFC_ONLY'} onChange={() => setConfig({ ...config, sat: { ...config.sat, authMode: 'RFC_ONLY' } })} className="w-5 h-5 accent-[#0f172a] cursor-pointer" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium leading-[1.8] uppercase">Validación automática de estatus ante listas negras y metadatos públicos sin e.Firma.</p>
                                    </label>

                                    {/* MODO: FIEL */}
                                    <label className={`cursor-pointer border-2 p-8 rounded-[2.5rem] transition-all relative group overflow-hidden ${config.sat.authMode === 'FIEL' ? 'border-[#0f172a] bg-slate-50 shadow-inner' : 'border-slate-50 hover:border-slate-200 bg-slate-50/20'}`}>
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${config.sat.authMode === 'FIEL' ? 'bg-[#0f172a] text-white' : 'bg-white border border-slate-100 text-slate-300'} group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.113-2.057-.382-3.041z"></path></svg>
                                                </div>
                                                <span className={`font-black uppercase text-xs tracking-widest ${config.sat.authMode === 'FIEL' ? 'text-slate-900' : 'text-slate-400'}`}>Vínculo e.Firma</span>
                                            </div>
                                            <input type="radio" name="authMode" checked={config.sat.authMode === 'FIEL'} onChange={() => setConfig({ ...config, sat: { ...config.sat, authMode: 'FIEL' } })} className="w-5 h-5 accent-[#0f172a] cursor-pointer" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium leading-[1.8] uppercase">Conexión total y descarga masiva de CFDI. Nivel más alto de integridad y seguridad.</p>
                                        {config.sat.status === 'ACTIVE' && config.sat.authMode === 'FIEL' && (
                                            <div className="absolute -right-12 top-6 bg-emerald-500 text-white px-20 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.3em] rotate-45 shadow-lg shadow-emerald-500/20">Vinculado</div>
                                        )}
                                    </label>

                                    {/* MODO: CIEC */}
                                    <label className={`cursor-pointer border-2 p-8 rounded-[2.5rem] transition-all relative group overflow-hidden ${config.sat.authMode === 'CIEC' ? 'border-amber-500 bg-amber-50 shadow-inner' : 'border-slate-50 hover:border-slate-200 bg-slate-50/20'}`}>
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${config.sat.authMode === 'CIEC' ? 'bg-amber-600 text-white' : 'bg-white border border-slate-100 text-slate-300'} group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                                                </div>
                                                <span className={`font-black uppercase text-xs tracking-widest ${config.sat.authMode === 'CIEC' ? 'text-amber-800' : 'text-slate-400'}`}>Acceso CIEC</span>
                                            </div>
                                            <input type="radio" name="authMode" checked={config.sat.authMode === 'CIEC'} onChange={() => setConfig({ ...config, sat: { ...config.sat, authMode: 'CIEC' } })} className="w-5 h-5 accent-amber-600 cursor-pointer" />
                                        </div>
                                        <p className="text-[11px] text-slate-500 font-medium leading-[1.8] uppercase">Sincronización simplificada vía contraseña. Útil para verificaciones rápidas del portal.</p>
                                    </label>
                                </div>

                                {/* FORMULARIO DE CARGA FIEL / CIEC */}
                                {(config.sat.authMode === 'FIEL' || config.sat.authMode === 'CIEC') && (
                                    <div className="bg-slate-50 border border-slate-100 p-10 rounded-[3rem] space-y-10 animate-in slide-in-from-top-6 duration-700 shadow-inner">
                                        <div className="flex items-center justify-between border-b border-slate-200 pb-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center shadow-xl border border-slate-100 text-3xl">🛡️</div>
                                                <div>
                                                    <h3 className="font-black text-slate-900 tracking-tighter uppercase text-lg">Bóveda de Identidad Fiscal</h3>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Safe Vault: Tratamiento de archivos bajo estándares bancarios.</p>
                                                </div>
                                            </div>
                                            {config.sat.status === 'ACTIVE' && (
                                                <div className="bg-[#0f172a] text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-xl shadow-slate-900/10">
                                                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span> CONEXIÓN ESTABLECIDA
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                            {/* Sección FIEL */}
                                            <div className="space-y-8">
                                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <span className="w-1.5 h-4 bg-[#0f172a] rounded-full"></span> Configuración e.Firma
                                                </h4>

                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">Certificado Forense (.cer)</label>
                                                        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                                                            <input type="file" id="fileCer" accept=".cer" onChange={(e) => setFileCer(e.target.files?.[0] || null)} className="hidden" />
                                                            <label htmlFor="fileCer" className="px-5 py-2.5 bg-[#0f172a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black transition-all shadow-md active:scale-95">
                                                                {fileCer ? 'REEMPLAZAR' : 'CARGAR CER'}
                                                            </label>
                                                            <span className="text-[10px] text-slate-500 font-black font-mono truncate max-w-[150px] uppercase">
                                                                {fileCer ? fileCer.name : 'PENDIENTE DE CARGA'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">Llave Privada de Cifrado (.key)</label>
                                                        <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                                                            <input type="file" id="fileKey" accept=".key" onChange={(e) => setFileKey(e.target.files?.[0] || null)} className="hidden" />
                                                            <label htmlFor="fileKey" className="px-5 py-2.5 bg-[#0f172a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-black transition-all shadow-md active:scale-95">
                                                                {fileKey ? 'REEMPLAZAR' : 'CARGAR KEY'}
                                                            </label>
                                                            <span className="text-[10px] text-slate-500 font-black font-mono truncate max-w-[150px] uppercase">
                                                                {fileKey ? fileKey.name : 'PENDIENTE DE CARGA'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">Contraseña de Protocolo</label>
                                                        <input
                                                            type="password"
                                                            placeholder="Ingrese Contraseña Privada..."
                                                            value={passFiel}
                                                            onChange={(e) => setPassFiel(e.target.value)}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-slate-500/5 focus:border-[#0f172a] outline-none transition-all shadow-sm placeholder:text-slate-300 font-mono"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sección CIEC */}
                                            <div className="space-y-8 lg:border-l lg:border-slate-200 lg:pl-12">
                                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span> Acceso Simplificado (CIEC)
                                                </h4>

                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="block text-[10px] font-black text-slate-900 mb-3 uppercase tracking-widest">Clave Dinámica SAT</label>
                                                        <input
                                                            type="password"
                                                            placeholder="CONTRASEÑA PORTAL..."
                                                            value={passCiec}
                                                            onChange={(e) => setPassCiec(e.target.value)}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-900 focus:ring-4 focus:ring-slate-500/5 focus:border-amber-500 outline-none transition-all shadow-sm placeholder:text-slate-300 font-mono"
                                                        />
                                                    </div>
                                                    <div className="p-6 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl">
                                                        <div className="flex gap-4">
                                                            <span className="text-2xl">⚡</span>
                                                            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.2em] leading-[1.8]">
                                                                Protocolo de Seguridad: Sus credenciales se transmiten vía túnel SSH con cifrado end-to-end (Grade Military AES-256). Jamás son almacenadas en texto plano.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t border-slate-200 flex justify-end">
                                            <button
                                                onClick={handleFielUpload}
                                                disabled={uploading || !empresa}
                                                className="btn-primary py-4 px-12 shadow-2xl shadow-slate-900/20 active:scale-95"
                                            >
                                                {uploading ? (
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-5 w-5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
                                                        <span>SINCRONIZANDO CON EL SAT...</span>
                                                    </div>
                                                ) : "VINCULAR Y ESTABLECER CONEXIÓN"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-16 pt-10 border-t border-slate-100 text-center">
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="h-px w-20 bg-slate-100"></div>
                                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">
                                            Sentinel Forensic Intelligence v2.0
                                        </p>
                                        <div className="h-px w-20 bg-slate-100"></div>
                                    </div>
                                </div>

                            </div>
                        )}

                        {!isLoading && activeTab === 'perfil' && (
                            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Identidad Fiscal del Contribuyente</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Gestión de datos maestros de la entidad auditada</p>
                                </div>
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="md:col-span-1">
                                        <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-3">Registro Federal de Contribuyentes (RFC)</label>
                                        <div className="relative group">
                                            <input type="text" value={config.perfil.rfc} disabled className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-slate-400 font-black font-mono text-sm cursor-not-allowed uppercase shadow-inner" />
                                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-200 group-hover:text-slate-300 transition-colors">🔒</div>
                                        </div>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-[11px] font-black text-slate-900 uppercase tracking-widest mb-3">Denominación o Razón Social</label>
                                        <input type="text" value={config.perfil.razonSocial} onChange={(e) => setConfig({ ...config, perfil: { ...config.perfil, razonSocial: e.target.value } })} className="w-full bg-white border border-slate-200 focus:border-[#0f172a] focus:ring-4 focus:ring-slate-500/5 rounded-2xl px-6 py-4 text-slate-900 font-black uppercase text-sm outline-none transition-all shadow-sm" />
                                    </div>
                                </div>

                                <div className="mt-12 p-10 bg-slate-50 rounded-[3rem] border border-slate-100 border-dashed">
                                    <div className="flex flex-col items-center text-center gap-6">
                                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-slate-200/50">🏗️</div>
                                        <div>
                                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Protocolos de Regímenes Especiales</h4>
                                            <p className="text-[10px] text-slate-400 font-medium uppercase mt-2 max-w-sm leading-relaxed">Próximamente: Historial de modificaciones de régimen y sectorización automática mediante IA.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </MissionControlLayout>
    );
};

export default ConfiguracionPage;
