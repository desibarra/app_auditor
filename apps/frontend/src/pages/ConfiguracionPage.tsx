import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MissionControlLayout from '../components/MissionControlLayout';
import SelectorEmpresa from '../components/SelectorEmpresa';

// Interfaces for UI only (Mapping from Backend)
interface ConfigData {
    perfil: {
        rfc: string;
        razonSocial: string;
        regimenFiscal: string;
        sector: string;
    };
    umbrales: {
        maxEgresosFueraGiro: number;
        isrBajo: number;
        concentracionProveedor: number;
    };
    integraciones: {
        pacUser: string;
        satToken: string;
    };
    preferencias: {
        emailAlertas: boolean;
        emailDestino: string;
        temaOscuro: boolean;
    };
}

const SECTORES = [
    { id: 'autotransporte', label: 'Autotransporte de Carga' },
    { id: 'manufactura', label: 'Manufactura / Industrial' },
    { id: 'servicios', label: 'Servicios Profesionales' },
    { id: 'comercio', label: 'Comercio General' },
    { id: 'construccion', label: 'Construcción' },
    { id: 'tecnologia', label: 'Tecnología / Software' },
];

const ConfiguracionPage: React.FC = () => {
    const [empresaId, setEmpresaId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    // Flat state for editing
    const [config, setConfig] = useState<ConfigData>({
        perfil: { rfc: '', razonSocial: '', regimenFiscal: '', sector: '' },
        umbrales: { maxEgresosFueraGiro: 10, isrBajo: 8, concentracionProveedor: 30 },
        integraciones: { pacUser: '', satToken: '' },
        preferencias: { emailAlertas: false, emailDestino: '', temaOscuro: true }
    });
    const [activeTab, setActiveTab] = useState<'perfil' | 'umbrales' | 'integraciones' | 'preferencias' | 'empresas'>('perfil');

    // Fetch Config on Empresa Change
    useEffect(() => {
        if (!empresaId) return;
        fetchConfig();
    }, [empresaId]);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/api/empresas/${empresaId}`);
            const data = res.data;
            const conf = data.configuracion || {};

            setConfig({
                perfil: {
                    rfc: data.rfc,
                    razonSocial: data.razonSocial,
                    regimenFiscal: data.regimenFiscal || '',
                    sector: data.sector || ''
                },
                umbrales: {
                    maxEgresosFueraGiro: conf.umbrales?.maxEgresosFueraGiro ?? 10,
                    isrBajo: conf.umbrales?.isrBajo ?? 8,
                    concentracionProveedor: conf.umbrales?.concentracionProveedor ?? 30
                },
                integraciones: {
                    pacUser: conf.integraciones?.pacUser ?? '',
                    satToken: conf.integraciones?.satToken ?? ''
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
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!empresaId) return;
        try {
            setSaving(true);

            // Construct Payload
            // Profile fields go to root, others to 'configuracion' JSON
            const payload = {
                razonSocial: config.perfil.razonSocial,
                regimenFiscal: config.perfil.regimenFiscal,
                sector: config.perfil.sector,
                configuracion: {
                    umbrales: config.umbrales,
                    integraciones: config.integraciones,
                    preferencias: config.preferencias
                }
            };

            await axios.put(`/api/empresas/${empresaId}`, payload);
            alert('Configuración guardada exitosamente');
        } catch (error) {
            console.error("Error saving config", error);
            alert('Error al guardar configuración');
        } finally {
            setSaving(false);
        }
    };

    // Render Helpers
    const TabButton = ({ id, label, icon }: { id: typeof activeTab, label: string, icon: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-bold w-full rounded-md transition-colors ${activeTab === id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
        >
            <span>{icon}</span> {label}
        </button>
    );

    return (
        <MissionControlLayout title="Configuración de Sistema">
            <div className="flex flex-col h-full max-w-7xl mx-auto space-y-6">

                {/* Top Control: Empresa Selection */}
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-gray-900 rounded-lg">
                            <span className="text-2xl">🏢</span>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Empresa Activa</p>
                            <div className="w-80 mt-1">
                                <SelectorEmpresa
                                    empresaSeleccionada={empresaId}
                                    onSeleccionar={setEmpresaId}
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Guardando...' : '💾 Guardar Cambios'}
                        </button>
                    </div>
                </div>

                <div className="flex gap-8 flex-1">
                    {/* Sidebar Nav */}
                    <div className="w-64 space-y-2">
                        <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Secciones</p>
                        <TabButton id="perfil" label="Perfil Fiscal" icon="⚖️" />
                        <TabButton id="umbrales" label="Umbrales de Riesgo" icon="🛡️" />
                        <TabButton id="integraciones" label="Integraciones" icon="🔗" />
                        <TabButton id="preferencias" label="Preferencias" icon="⚙️" />
                        <TabButton id="empresas" label="Multiempresa" icon="🏢" />
                    </div>

                    {/* Content Panel */}
                    <div className="flex-1 bg-[#161b22] rounded-xl border border-gray-800 p-8 shadow-inner overflow-y-auto">

                        {loading && (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                            </div>
                        )}

                        {!loading && activeTab === 'perfil' && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="text-indigo-400">#</span> Perfil Fiscal
                                </h2>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">RFC (Solo Lectura)</label>
                                        <input
                                            type="text"
                                            value={config.perfil.rfc}
                                            disabled
                                            className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-gray-500 font-mono cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">Razón Social</label>
                                        <input
                                            type="text"
                                            value={config.perfil.razonSocial}
                                            onChange={(e) => setConfig({ ...config, perfil: { ...config.perfil, razonSocial: e.target.value } })}
                                            className="w-full bg-gray-800 border border-gray-600 focus:border-indigo-500 rounded px-4 py-2 text-white outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Régimen Fiscal</label>
                                        <select
                                            value={config.perfil.regimenFiscal}
                                            onChange={(e) => setConfig({ ...config, perfil: { ...config.perfil, regimenFiscal: e.target.value } })}
                                            className="w-full bg-gray-800 border border-gray-600 focus:border-indigo-500 rounded px-4 py-2 text-white outline-none transition-colors appearance-none"
                                        >
                                            <option value="">Seleccione Régimen...</option>
                                            <option value="601">601 - General de Ley Personas Morales</option>
                                            <option value="603">603 - Personas Morales con Fines no Lucrativos</option>
                                            <option value="605">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</option>
                                            <option value="606">606 - Arrendamiento</option>
                                            <option value="607">607 - Régimen de Enajenación o Adquisición de Bienes</option>
                                            <option value="608">608 - Demás ingresos</option>
                                            <option value="609">609 - Consolidación</option>
                                            <option value="610">610 - Residentes en el Extranjero sin Establecimiento Permanente en México</option>
                                            <option value="611">611 - Ingresos por Dividendos (socios y accionistas)</option>
                                            <option value="612">612 - Personas Físicas con Actividades Empresariales y Profesionales</option>
                                            <option value="614">614 - Ingresos por intereses</option>
                                            <option value="615">615 - Régimen de los ingresos por obtención de premios</option>
                                            <option value="616">616 - Sin obligaciones fiscales</option>
                                            <option value="620">620 - Sociedades Cooperativas de Producción que optan por diferir sus ingresos</option>
                                            <option value="621">621 - Incorporación Fiscal</option>
                                            <option value="622">622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras</option>
                                            <option value="623">623 - Opcional para Grupos de Sociedades</option>
                                            <option value="624">624 - Coordinados</option>
                                            <option value="625">625 - Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas</option>
                                            <option value="626">626 - Régimen Simplificado de Confianza (RESICO)</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-bold text-indigo-400 uppercase mb-2">Sector / Giro Principal</label>
                                        <select
                                            value={config.perfil.sector}
                                            onChange={(e) => setConfig({ ...config, perfil: { ...config.perfil, sector: e.target.value } })}
                                            className="w-full bg-gray-800 border border-gray-600 focus:border-indigo-500 rounded px-4 py-2 text-white outline-none transition-colors appearance-none"
                                        >
                                            <option value="">Seleccione un sector...</option>
                                            {SECTORES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                        </select>
                                        <p className="text-[10px] text-gray-500 mt-2">
                                            * Define las reglas de deducibilidad y análisis de riesgo.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!loading && activeTab === 'umbrales' && (
                            <div className="space-y-8 animate-fade-in">
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="text-red-400">#</span> Umbrales de Riesgo
                                </h2>

                                <div className="space-y-8">
                                    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                                        <div className="flex justify-between mb-2">
                                            <label className="text-sm font-bold text-white">Egresos Fuera de Giro (Máximo Permitido)</label>
                                            <span className="text-indigo-400 font-bold">{config.umbrales.maxEgresosFueraGiro}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="50"
                                            value={config.umbrales.maxEgresosFueraGiro}
                                            onChange={(e) => setConfig({ ...config, umbrales: { ...config.umbrales, maxEgresosFueraGiro: parseInt(e.target.value) } })}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Si los gastos no relacionados superan este %, se activa una Alerta Roja.</p>
                                    </div>

                                    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                                        <div className="flex justify-between mb-2">
                                            <label className="text-sm font-bold text-white">Tasa Efectiva ISR Mínima</label>
                                            <span className="text-yellow-400 font-bold">{config.umbrales.isrBajo}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="35"
                                            value={config.umbrales.isrBajo}
                                            onChange={(e) => setConfig({ ...config, umbrales: { ...config.umbrales, isrBajo: parseInt(e.target.value) } })}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Alerta si el ISR pagado respecto a ingresos es menor a este umbral.</p>
                                    </div>

                                    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                                        <div className="flex justify-between mb-2">
                                            <label className="text-sm font-bold text-white">Concentración Máxima por Proveedor</label>
                                            <span className="text-red-400 font-bold">{config.umbrales.concentracionProveedor}%</span>
                                        </div>
                                        <input
                                            type="range" min="10" max="100"
                                            value={config.umbrales.concentracionProveedor}
                                            onChange={(e) => setConfig({ ...config, umbrales: { ...config.umbrales, concentracionProveedor: parseInt(e.target.value) } })}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Dependencia excesiva de un solo proveedor.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!loading && activeTab === 'integraciones' && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-2xl font-bold text-white mb-6">Integraciones Externas</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Usuario PAC (Proveedor Autorizado)</label>
                                        <input
                                            type="text"
                                            value={config.integraciones.pacUser}
                                            onChange={(e) => setConfig({ ...config, integraciones: { ...config.integraciones, pacUser: e.target.value } })}
                                            className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                                            placeholder="Usuario API"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Token API SAT (CIEC / FIEL Encrypted)</label>
                                        <input
                                            type="password"
                                            value={config.integraciones.satToken}
                                            onChange={(e) => setConfig({ ...config, integraciones: { ...config.integraciones, satToken: e.target.value } })}
                                            className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white"
                                            placeholder="••••••••••••••••"
                                        />
                                    </div>
                                    <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded text-yellow-500 text-xs">
                                        ⚠️ Las credenciales se almacenan encriptadas. Se utilizan únicamente para validar estatus de CFDI y listas negras.
                                    </div>
                                </div>
                            </div>
                        )}

                        {!loading && activeTab === 'preferencias' && (
                            <div className="space-y-6 animate-fade-in">
                                <h2 className="text-2xl font-bold text-white mb-6">Preferencias de Usuario</h2>

                                <div className="flex items-center justify-between p-4 bg-gray-800 rounded border border-gray-700">
                                    <div>
                                        <p className="font-bold text-white">Modo Oscuro</p>
                                        <p className="text-xs text-gray-500">Interfaz optimizada para baja luminosidad.</p>
                                    </div>
                                    <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                        <input
                                            type="checkbox"
                                            checked={config.preferencias.temaOscuro}
                                            onChange={(e) => setConfig({ ...config, preferencias: { ...config.preferencias, temaOscuro: e.target.checked } })}
                                            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-green-400"
                                            id="toggle-dark"
                                        />
                                        <label htmlFor="toggle-dark" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${config.preferencias.temaOscuro ? 'bg-green-600' : 'bg-gray-300'}`}></label>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-800 rounded border border-gray-700 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-white">Alertas por Email</p>
                                            <p className="text-xs text-gray-500">Recibir notificaciones de riesgos altos.</p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={config.preferencias.emailAlertas}
                                            onChange={(e) => setConfig({ ...config, preferencias: { ...config.preferencias, emailAlertas: e.target.checked } })}
                                            className="w-5 h-5 accent-indigo-500 cursor-pointer"
                                        />
                                    </div>
                                    {config.preferencias.emailAlertas && (
                                        <input
                                            type="email"
                                            value={config.preferencias.emailDestino}
                                            onChange={(e) => setConfig({ ...config, preferencias: { ...config.preferencias, emailDestino: e.target.value } })}
                                            placeholder="correo@empresa.com"
                                            className="w-full bg-gray-900 border border-gray-600 rounded px-4 py-2 text-white text-sm"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {!loading && activeTab === 'empresas' && (
                            <div className="text-center py-20">
                                <span className="text-4xl">🏢</span>
                                <h3 className="text-xl font-bold text-white mt-4">Gestión Multiempresa</h3>
                                <p className="text-gray-500 mt-2 max-w-md mx-auto">
                                    Utilice el Selector de Empresa superior para agregar nuevas empresas o cambiar la activa.
                                    Esta sección mostrará el listado completo y estado de suscripción próximamente.
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </MissionControlLayout>
    );
};

export default ConfiguracionPage;
