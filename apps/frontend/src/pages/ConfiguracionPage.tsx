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
            const conf = data.configuracion ? JSON.parse(data.configuracion) : {};

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
        const styles = {
            'DISCONNECTED': 'bg-zinc-100 text-zinc-500',
            'CONFIGURED': 'bg-blue-100 text-blue-700',
            'ACTIVE': 'bg-green-100 text-green-700 font-bold',
            'ERROR': 'bg-red-100 text-red-700'
        };
        const labels = {
            'DISCONNECTED': 'DESCONECTADO',
            'CONFIGURED': 'CONFIGURADO',
            'ACTIVE': 'ACTIVO',
            'ERROR': 'ERROR'
        };
        // @ts-ignore
        return <span className={`text-[10px] px-2 py-0.5 rounded-full ${styles[status] || styles['DISCONNECTED']}`}>{labels[status] || status}</span>;
    };

    return (
        <MissionControlLayout title="Configuración de Sistema">
            <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6">

                {/* Header Actions */}
                <div className="bg-white p-4 rounded-sm border border-zinc-200 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-zinc-100 rounded-sm">
                            <span className="text-2xl">⚙️</span>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Empresa Activa</p>
                            <div className="mt-1">
                                {empresa ? (
                                    <>
                                        <div className="font-bold text-lg text-zinc-800">{empresa.razonSocial}</div>
                                        <div className="text-xs text-zinc-400 font-mono flex items-center gap-2">
                                            {empresa.rfc}
                                            <StatusBadge status={config.sat.status} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-zinc-400">Seleccione una empresa...</div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={handleSave}
                            disabled={saving || !empresa}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2 px-6 rounded-sm shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                        </button>
                    </div>
                </div>

                <div className="flex gap-8 flex-1">
                    {/* Sidebar */}
                    <div className="w-64 space-y-1 pt-4">
                        <button
                            onClick={() => setActiveTab('integraciones')}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-bold w-full rounded-md transition-colors ${activeTab === 'integraciones' ? 'bg-zinc-800 text-white border-l-4 border-indigo-500' : 'text-zinc-500 hover:bg-zinc-100'}`}
                        >
                            <span>🔐</span> Conexión SAT
                        </button>
                        <button
                            onClick={() => setActiveTab('perfil')}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-bold w-full rounded-md transition-colors ${activeTab === 'perfil' ? 'bg-zinc-800 text-white border-l-4 border-indigo-500' : 'text-zinc-500 hover:bg-zinc-100'}`}
                        >
                            <span>⚖️</span> Perfil Fiscal
                        </button>
                    </div>

                    {/* Content Panel */}
                    <div className="flex-1 bg-white rounded-sm border border-zinc-200 p-8 shadow-sm overflow-y-auto min-h-[600px]">

                        {isLoading && (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
                            </div>
                        )}

                        {!isLoading && activeTab === 'integraciones' && (
                            <div className="space-y-8 animate-fade-in">
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-900 mb-2">Modo de Autenticación</h2>
                                    <p className="text-sm text-zinc-500">
                                        Seleccione el nivel de integración deseado.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">

                                    {/* MODO: NONE */}
                                    <label className={`cursor-pointer border p-4 rounded transition-all ${config.sat.authMode === 'NONE' ? 'border-zinc-800 bg-zinc-50 ring-1 ring-zinc-800' : 'border-zinc-200 hover:border-zinc-400'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <input type="radio" name="authMode" checked={config.sat.authMode === 'NONE'} onChange={() => setConfig({ ...config, sat: { ...config.sat, authMode: 'NONE' } })} className="accent-zinc-900" />
                                            <span className="font-bold text-zinc-800">Sin Conexión SAT</span>
                                        </div>
                                        <p className="text-xs text-zinc-500">Operación manual exclusivamente. Usted carga los XML.</p>
                                    </label>

                                    {/* MODO: RFC_ONLY */}
                                    <label className={`cursor-pointer border p-4 rounded transition-all ${config.sat.authMode === 'RFC_ONLY' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-zinc-200 hover:border-zinc-400'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <input type="radio" name="authMode" checked={config.sat.authMode === 'RFC_ONLY'} onChange={() => setConfig({ ...config, sat: { ...config.sat, authMode: 'RFC_ONLY' } })} className="accent-blue-600" />
                                            <span className="font-bold text-zinc-800">Consulta Pasiva (RFC)</span>
                                        </div>
                                        <p className="text-xs text-zinc-500">Consulta pública de listas negras y metadatos públicos sin credenciales.</p>
                                    </label>

                                    {/* MODO: FIEL */}
                                    <label className={`cursor-pointer border p-4 rounded transition-all ${config.sat.authMode === 'FIEL' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-zinc-200 hover:border-zinc-400'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <input type="radio" name="authMode" checked={config.sat.authMode === 'FIEL'} onChange={() => setConfig({ ...config, sat: { ...config.sat, authMode: 'FIEL' } })} className="accent-indigo-600" />
                                            <span className="font-bold text-zinc-800">e.Firma (FIEL)</span>
                                            {config.sat.status === 'ACTIVE' && config.sat.authMode === 'FIEL' && (
                                                <span className="text-[10px] bg-green-200 px-1 rounded text-green-700 font-bold uppercase transition-all animate-bounce">Vinculada</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-500">Requiere archivos .cer y .key. Habilita descarga masiva y validación profunda.</p>
                                    </label>

                                    {/* MODO: CIEC */}
                                    <label className={`cursor-pointer border p-4 rounded transition-all ${config.sat.authMode === 'CIEC' ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600' : 'border-zinc-200 hover:border-zinc-400'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <input type="radio" name="authMode" checked={config.sat.authMode === 'CIEC'} onChange={() => setConfig({ ...config, sat: { ...config.sat, authMode: 'CIEC' } })} className="accent-amber-600" />
                                            <span className="font-bold text-zinc-800">Contraseña CIEC</span>
                                        </div>
                                        <p className="text-xs text-zinc-500">Acceso legado. Menos estable y seguro que la e.Firma.</p>
                                    </label>
                                </div>

                                {/* FORMULARIO DE CARGA FIEL / CIEC */}
                                {(config.sat.authMode === 'FIEL' || config.sat.authMode === 'CIEC') && (
                                    <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-sm space-y-6 animate-fade-in shadow-inner">
                                        <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">🔐</span>
                                                <div>
                                                    <h3 className="font-bold text-zinc-900">Configuración de Credenciales SAT</h3>
                                                    <p className="text-xs text-zinc-500">Cargue sus archivos de firma electrónica para habilitar la sincronización real.</p>
                                                </div>
                                            </div>
                                            {config.sat.status === 'ACTIVE' && (
                                                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 animate-pulse">
                                                    <span>●</span> CONECTADO
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Sección FIEL */}
                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">e.Firma (FIEL)</h4>

                                                <div>
                                                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Archivo Certificado (.cer)</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="file"
                                                            id="fileCer"
                                                            accept=".cer"
                                                            onChange={(e) => setFileCer(e.target.files?.[0] || null)}
                                                            className="hidden"
                                                        />
                                                        <label htmlFor="fileCer" className="bg-zinc-900 text-white px-3 py-2 rounded-sm text-[10px] font-bold cursor-pointer hover:bg-zinc-800 transition-colors">
                                                            {fileCer ? 'CAMBIAR' : 'SELECCIONAR .CER'}
                                                        </label>
                                                        <span className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                                                            {fileCer ? fileCer.name : 'Ninguno seleccionado'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Archivo Llave Privada (.key)</label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="file"
                                                            id="fileKey"
                                                            accept=".key"
                                                            onChange={(e) => setFileKey(e.target.files?.[0] || null)}
                                                            className="hidden"
                                                        />
                                                        <label htmlFor="fileKey" className="bg-zinc-900 text-white px-3 py-2 rounded-sm text-[10px] font-bold cursor-pointer hover:bg-zinc-800 transition-colors">
                                                            {fileKey ? 'CAMBIAR' : 'SELECCIONAR .KEY'}
                                                        </label>
                                                        <span className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                                                            {fileKey ? fileKey.name : 'Ninguno seleccionado'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Contraseña de la Llave</label>
                                                    <input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={passFiel}
                                                        onChange={(e) => setPassFiel(e.target.value)}
                                                        className="w-full border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-zinc-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* Sección CIEC */}
                                            <div className="space-y-4 border-l border-zinc-200 pl-6">
                                                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Contraseña CIEC</h4>

                                                <div className="pt-2">
                                                    <label className="block text-[11px] font-bold text-zinc-700 mb-1">Contraseña CIEC (8 caracteres)</label>
                                                    <input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={passCiec}
                                                        onChange={(e) => setPassCiec(e.target.value)}
                                                        className="w-full border border-zinc-300 rounded-sm px-3 py-2 text-xs outline-none focus:border-zinc-500"
                                                    />
                                                    <p className="text-[10px] text-zinc-400 mt-2">
                                                        La contraseña CIEC permite consultar metadatos y listas negras en tiempo real.
                                                    </p>
                                                </div>

                                                <div className="bg-blue-50 p-3 rounded-sm border border-blue-100 mt-4">
                                                    <p className="text-[10px] text-blue-700 font-medium leading-relaxed">
                                                        <span className="font-bold text-blue-800">Cifrado de Seguridad:</span> Sus credenciales nunca se almacenan en texto plano y solo se usan para autenticar ante el SAT.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-zinc-200 flex justify-end">
                                            <button
                                                onClick={handleFielUpload}
                                                disabled={uploading || !empresa}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-8 rounded-sm shadow-md transition-all text-xs disabled:opacity-50"
                                            >
                                                {uploading ? 'Procesando...' : '🚀 Finalizar Configuración Real'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-8 pt-8 border-t border-zinc-100 text-center">
                                    <p className="text-[10px] text-zinc-400 uppercase tracking-widest">
                                        Infraestructura lista para conexión auditada v1.0
                                    </p>
                                </div>

                            </div>
                        )}

                        {!isLoading && activeTab === 'perfil' && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-xl font-bold text-zinc-900">Perfil Fiscal</h2>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">RFC</label>
                                        <input type="text" value={config.perfil.rfc} disabled className="w-full bg-zinc-100 border border-zinc-200 rounded px-4 py-2 text-zinc-500 font-mono cursor-not-allowed" />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-zinc-900 uppercase mb-2">Razón Social</label>
                                        <input type="text" value={config.perfil.razonSocial} onChange={(e) => setConfig({ ...config, perfil: { ...config.perfil, razonSocial: e.target.value } })} className="w-full border border-zinc-300 focus:border-indigo-500 rounded px-4 py-2 text-zinc-800 outline-none" />
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
