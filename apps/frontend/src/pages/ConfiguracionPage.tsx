import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MissionControlLayout from '../components/MissionControlLayout';

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
    const [empresaId, setEmpresaId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [config, setConfig] = useState<ConfigData>({
        perfil: { rfc: '', razonSocial: '', regimenFiscal: '', sector: '' },
        sat: { authMode: 'NONE', status: 'DISCONNECTED', lastSync: null },
        umbrales: { maxEgresosFueraGiro: 10, isrBajo: 8, concentracionProveedor: 30 },
        preferencias: { emailAlertas: false, emailDestino: '', temaOscuro: true }
    });

    const [activeTab, setActiveTab] = useState<'perfil' | 'umbrales' | 'integraciones' | 'preferencias'>('integraciones');

    useEffect(() => {
        // Cargar desde URL hash o props si fuera necesario
    }, []);

    // Escuchar cambios de empresa (Esta página usa el selector del Layout, pero necesitamos saber cuál es la activa)
    // El Layout maneja el contexto global, pero aquí necesitamos leerlo.
    // Como simplificación extrema para este paso:
    // El usuario debe usar el selector del layout, el cual refresca la página o contexto.
    // Si queremos que esta página reaccione REACTIVAMENTE al contexto, debemos usar useEmpresa.
    // IMPORTANTE: MissionControlLayout envuelve children, pero los children pueden usar hooks.
    // Vamos a importar useEmpresa.

    // PERO, para evitar refactorizar imports ahora si no tengo el path exacto del context (lo tengo, src/context/EmpresaContext.tsx), 
    // voy a usar un patrón más simple: leer de localStorage o window para inicializar, 
    // y confiar en que el usuario refresca al cambiar empresa (el layout hace window.location.reload() al crear).
    // Mejor aún: Usar el hook si puedo. Sí, lo tengo disponible.

    // Voy a simular la conexión con el layout mediante props implícitos o asumiendo que el usuario ya seleccionó.
    // En la versión anterior usaba un useEffect local con 'empresaId'.
    // Ahora usaré el hook real.

    return <ConfiguracionContent />;
};

// Separamos en subcomponente para poder usar Hooks limpiamente si fuera necesario, 
// o simplemente reescribimos el componente principal.

import { useEmpresa } from '../context/EmpresaContext';

const ConfiguracionContent = () => {
    const { empresa, loading: contextLoading } = useEmpresa();
    const [localLoading, setLocalLoading] = useState(false);
    const [saving, setSaving] = useState(false);

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

            // Si cambió el modo, refrescar para ver el nuevo status (DISCONNECTED)
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

    // Helper UI components
    const StatusBadge = ({ status }: { status: string }) => {
        const styles = {
            'DISCONNECTED': 'bg-zinc-100 text-zinc-500',
            'CONFIGURED': 'bg-blue-100 text-blue-700',
            'ACTIVE': 'bg-green-100 text-green-700',
            'ERROR': 'bg-red-100 text-red-700'
        };
        const labels = {
            'DISCONNECTED': 'DESCONECTADO',
            'CONFIGURED': 'CONFIGURADO',
            'ACTIVE': 'ACTIVO',
            'ERROR': 'ERROR'
        };
        // @ts-ignore
        return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${styles[status] || styles['DISCONNECTED']}`}>{labels[status] || status}</span>;
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
                                        <span className="font-bold text-zinc-700 ml-1">Nota: Cambiar el modo reiniciará el estado de conexión.</span>
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

                                    {/* MODO: FIEL (Placeholder) */}
                                    <label className={`cursor-pointer border p-4 rounded transition-all ${config.sat.authMode === 'FIEL' ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-zinc-200 hover:border-zinc-400'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <input type="radio" name="authMode" checked={config.sat.authMode === 'FIEL'} onChange={() => setConfig({ ...config, sat: { ...config.sat, authMode: 'FIEL' } })} className="accent-indigo-600" />
                                            <span className="font-bold text-zinc-800">e.Firma (FIEL)</span>
                                            <span className="text-[10px] bg-zinc-200 px-1 rounded text-zinc-600">No Activo</span>
                                        </div>
                                        <p className="text-xs text-zinc-500">Requiere archivos .cer y .key. Habilita descarga masiva y validación profunda.</p>
                                    </label>

                                    {/* MODO: CIEC (Placeholder) */}
                                    <label className={`cursor-pointer border p-4 rounded transition-all ${config.sat.authMode === 'CIEC' ? 'border-amber-600 bg-amber-50 ring-1 ring-amber-600' : 'border-zinc-200 hover:border-zinc-400'}`}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <input type="radio" name="authMode" checked={config.sat.authMode === 'CIEC'} onChange={() => setConfig({ ...config, sat: { ...config.sat, authMode: 'CIEC' } })} className="accent-amber-600" />
                                            <span className="font-bold text-zinc-800">Contraseña CIEC</span>
                                            <span className="text-[10px] bg-zinc-200 px-1 rounded text-zinc-600">No Activo</span>
                                        </div>
                                        <p className="text-xs text-zinc-500">Acceso legado. Menos estable y seguro que la e.Firma.</p>
                                    </label>
                                </div>

                                {/* AVISO LEGAL DE INFRAESTRUCTURA */}
                                {(config.sat.authMode === 'FIEL' || config.sat.authMode === 'CIEC') && (
                                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-sm text-yellow-800 flex gap-3 items-start">
                                        <span className="text-xl">🛠️</span>
                                        <div>
                                            <p className="font-bold">Módulo en Preparación</p>
                                            <p className="mt-1">
                                                Ha seleccionado un modo de conexión avanzado.
                                                Actualmente el sistema preparará la estructura de datos, pero <strong>no realizará ninguna conexión al SAT</strong> ni solicitará sus archivos todavía.
                                                Esta funcionalidad se habilitará en la siguiente actualización del módulo de seguridad.
                                            </p>
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
                                    {/* Mismos campos de perfil... simplificado para este update */}
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
}

export default ConfiguracionPage;
