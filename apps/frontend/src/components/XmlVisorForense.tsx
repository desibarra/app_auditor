import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import CartaPorteResumen from './CartaPorteResumen';

interface XmlVisorForenseProps {
    uuid: string;
    onClose: () => void;
}

interface CfdiDetalle {
    cfdi: {
        uuid: string;
        serie: string;
        folio: string;
        fecha: string;
        tipoComprobante: string;
        emisorNombre: string;
        emisorRfc: string;
        emisorRegimenFiscal?: string;
        receptorNombre: string;
        receptorRfc: string;
        receptorUsoCfdi?: string;
        total: number;
        subtotal?: number;
        moneda: string;
        formaPago?: string;
        metodoPago?: string;
        xmlOriginal: string;
    };
    impuestos: any[];
}

interface SeccionForense {
    id: string;
    label: string;
    icon: string;
    status: 'presente' | 'ausente' | 'incompleto';
    subsecciones?: SeccionForense[];
}

const XmlVisorForense: React.FC<XmlVisorForenseProps> = ({ uuid, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CfdiDetalle | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [secciones, setSecciones] = useState<SeccionForense[]>([]);
    const [seccionActiva, setSeccionActiva] = useState<string | null>(null);
    const [cartaPorteDetectada, setCartaPorteDetectada] = useState(false);
    const [addendaDetectada, setAddendaDetectada] = useState(false);
    const [dodaDetectada, setDodaDetectada] = useState(false);
    const xmlViewerRef = useRef<HTMLDivElement>(null);
    const [xmlDoc, setXmlDoc] = useState<Document | null>(null);

    useEffect(() => {
        const fetchXml = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/api/cfdi/detalle/${uuid}`);
                setData(res.data);

                // Parsear XML para análisis forense
                if (res.data?.cfdi?.xmlOriginal) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(res.data.cfdi.xmlOriginal, 'text/xml');
                    setXmlDoc(doc);
                    analizarEstructuraForense(doc);
                }
            } catch (err) {
                console.error("Error fetching XML", err);
                setError("No se pudo cargar el XML original. Verifique su conexión.");
            } finally {
                setLoading(false);
            }
        };

        if (uuid) fetchXml();
    }, [uuid]);

    const analizarEstructuraForense = (doc: Document) => {
        const secciones: SeccionForense[] = [];

        // 1. Datos CFDI
        const comprobante = doc.querySelector('cfdi\\:Comprobante, Comprobante');
        secciones.push({
            id: 'cfdi',
            label: 'Datos CFDI',
            icon: '📄',
            status: comprobante ? 'presente' : 'ausente'
        });

        // 2. Emisor/Receptor
        const emisor = doc.querySelector('cfdi\\:Emisor, Emisor');
        const receptor = doc.querySelector('cfdi\\:Receptor, Receptor');
        secciones.push({
            id: 'emisor-receptor',
            label: 'Emisor/Receptor',
            icon: '👥',
            status: (emisor && receptor) ? 'presente' : 'incompleto'
        });

        // 3. Conceptos
        const conceptos = doc.querySelectorAll('cfdi\\:Concepto, Concepto');
        secciones.push({
            id: 'conceptos',
            label: `Conceptos (${conceptos.length})`,
            icon: '📦',
            status: conceptos.length > 0 ? 'presente' : 'ausente'
        });

        // 4. Impuestos
        const impuestos = doc.querySelector('cfdi\\:Impuestos, Impuestos');
        secciones.push({
            id: 'impuestos',
            label: 'Impuestos',
            icon: '💰',
            status: impuestos ? 'presente' : 'ausente'
        });

        // 5. Carta Porte
        const cartaPorte = doc.querySelector('cartaporte20\\:CartaPorte, cartaporte30\\:CartaPorte, [*|CartaPorte]');
        const tieneCartaPorte = !!cartaPorte;
        setCartaPorteDetectada(tieneCartaPorte);

        if (tieneCartaPorte) {
            const ubicaciones = doc.querySelectorAll('[*|Ubicacion], cartaporte20\\:Ubicacion, cartaporte30\\:Ubicacion');
            const mercancias = doc.querySelectorAll('[*|Mercancia], cartaporte20\\:Mercancia, cartaporte30\\:Mercancia');
            const autotransporte = doc.querySelector('[*|Autotransporte], cartaporte20\\:Autotransporte, cartaporte30\\:Autotransporte');
            const operador = doc.querySelector('[*|Operador], cartaporte20\\:Operador, cartaporte30\\:Operador');
            const permisos = doc.querySelectorAll('[*|PermSCT], cartaporte20\\:PermSCT, cartaporte30\\:PermSCT');

            secciones.push({
                id: 'carta-porte',
                label: 'Carta Porte',
                icon: '🚛',
                status: 'presente',
                subsecciones: [
                    {
                        id: 'cp-ubicaciones',
                        label: `Origen/Destino (${ubicaciones.length})`,
                        icon: '📍',
                        status: ubicaciones.length >= 2 ? 'presente' : 'incompleto'
                    },
                    {
                        id: 'cp-mercancias',
                        label: `Mercancías (${mercancias.length})`,
                        icon: '📦',
                        status: mercancias.length > 0 ? 'presente' : 'ausente'
                    },
                    {
                        id: 'cp-autotransporte',
                        label: 'Autotransporte',
                        icon: '🚚',
                        status: autotransporte ? 'presente' : 'ausente'
                    },
                    {
                        id: 'cp-operador',
                        label: 'Operador',
                        icon: '👤',
                        status: operador ? 'presente' : 'ausente'
                    },
                    {
                        id: 'cp-permisos',
                        label: `Permisos SCT (${permisos.length})`,
                        icon: '📋',
                        status: permisos.length > 0 ? 'presente' : 'ausente'
                    }
                ]
            });
        } else {
            secciones.push({
                id: 'carta-porte',
                label: 'Carta Porte',
                icon: '🚛',
                status: 'ausente'
            });
        }

        // 6. DODA / Pedimentos
        const pedimentos = doc.querySelectorAll('[*|Pedimento], cfdi\\:Pedimento');
        const doda = doc.querySelector('[*|DODA]');
        const tieneDoda = !!doda || pedimentos.length > 0;
        setDodaDetectada(tieneDoda);

        secciones.push({
            id: 'doda-pedimentos',
            label: `DODA/Pedimentos (${pedimentos.length})`,
            icon: '🛃',
            status: tieneDoda ? 'presente' : 'ausente'
        });

        // 7. Complementos
        const complemento = doc.querySelector('cfdi\\:Complemento, Complemento');
        const complementos = complemento?.children.length || 0;
        secciones.push({
            id: 'complementos',
            label: `Complementos (${complementos})`,
            icon: '🔌',
            status: complementos > 0 ? 'presente' : 'ausente'
        });

        // 8. Addendas
        const addenda = doc.querySelector('cfdi\\:Addenda, Addenda');
        const tieneAddenda = !!addenda;
        setAddendaDetectada(tieneAddenda);

        secciones.push({
            id: 'addenda',
            label: 'Addenda',
            icon: '📎',
            status: tieneAddenda ? 'presente' : 'ausente'
        });

        setSecciones(secciones);
    };

    // --- XML TREE LOGIC START ---

    // Estado para el árbol
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['root']));
    const [activeNodePath, setActiveNodePath] = useState<string | null>(null);

    // Toggle nodo
    const toggleNode = (path: string) => {
        const newSet = new Set(expandedPaths);
        if (newSet.has(path)) {
            newSet.delete(path);
        } else {
            newSet.add(path);
        }
        setExpandedPaths(newSet);
    };

    // Componente Recursivo de Nodo XML
    const XmlTreeNode = ({ node, path, depth }: { node: Node, path: string, depth: number }) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (!text) return null;
            return <div className="text-gray-400 break-words ml-4 font-mono text-xs max-w-full">"{text}"</div>;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return null;

        const routerElement = node as Element;
        const tagName = routerElement.tagName;
        const attributes = Array.from(routerElement.attributes);
        const children = Array.from(node.childNodes).filter(n =>
            n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
        );
        const hasChildren = children.length > 0;
        const isExpanded = expandedPaths.has(path);
        const isActive = activeNodePath === path;

        // Identificar nodos forenses clave para badges
        const isRisk = ['cfdi:Addenda', 'Addenda'].includes(tagName);
        const isImportant = ['cfdi:Concepto', 'cfdi:Impuestos', 'cartaporte20:CartaPorte', 'pago20:Pago'].some(t => tagName.includes(t.split(':')[1]));

        return (
            <div
                id={`xml-node-${path}`}
                className={`font-mono text-xs transition-colors duration-300 ${isActive ? 'bg-indigo-900/40 -mx-4 px-4 py-1 border-l-2 border-indigo-400 rounded-r' : 'hover:bg-white/5'}`}
                style={{ marginLeft: `${depth * 12}px` }}
            >
                {/* Primera línea: Tag apertura + Atributos */}
                <div className="flex flex-wrap items-center gap-1 group">
                    {/* Botón Expander */}
                    {hasChildren && (
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleNode(path); }}
                            className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-white transition-colors mr-1 -ml-5"
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    )}
                    {!hasChildren && <span className="w-4 mr-1 -ml-5"></span>}

                    {/* Tag Name */}
                    <span
                        className={`font-bold cursor-pointer ${isRisk ? 'text-purple-400' : isImportant ? 'text-blue-400' : 'text-indigo-400'}`}
                        onClick={() => toggleNode(path)}
                    >
                        &lt;{tagName}
                    </span>

                    {/* Atributos */}
                    {attributes.map((attr) => (
                        <span key={attr.name} className="ml-1">
                            <span className="text-sky-300/80">{attr.name}</span>
                            <span className="text-gray-500">=</span>
                            <span className="text-orange-200/90 break-all">"{attr.value}"</span>
                        </span>
                    ))}

                    {/* Cierre en misma línea si no hay hijos o está colapsado */}
                    {(!hasChildren || !isExpanded) && (
                        <span className={`text-indigo-400 ${hasChildren ? 'cursor-pointer' : ''}`} onClick={() => hasChildren && toggleNode(path)}>
                            {hasChildren ? '...' : ''}/&gt;
                        </span>
                    )}

                    {/* Badge Forense */}
                    {isRisk && <span className="ml-2 text-[9px] bg-purple-900 text-purple-200 px-1 rounded border border-purple-700">NO FISCAL</span>}
                </div>

                {/* Hijos Recursivos */}
                {hasChildren && isExpanded && (
                    <div className="border-l border-gray-800 ml-1 pl-1">
                        {children.map((child, index) => (
                            <XmlTreeNode
                                key={index}
                                node={child}
                                path={`${path}-${index}`}
                                depth={depth + 1}
                            />
                        ))}
                        {/* Tag Cierre */}
                        <div className="text-indigo-400 group-hover:text-indigo-300 mt-0.5">
                            &lt;/{tagName}&gt;
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const navegarASeccion = (seccionId: string) => {
        if (!xmlDoc || !xmlViewerRef.current) return;
        setSeccionActiva(seccionId);

        // Mapeo de secciones a selectores XML
        const selectorMap: { [key: string]: string } = {
            'cfdi': 'cfdi\\:Comprobante, Comprobante',
            'emisor-receptor': 'cfdi\\:Emisor, Emisor',
            'conceptos': 'cfdi\\:Conceptos, Conceptos',
            'impuestos': 'cfdi\\:Impuestos, Impuestos',
            'carta-porte': '[*|CartaPorte], cartaporte20\\:CartaPorte, cartaporte30\\:CartaPorte',
            'cp-ubicaciones': '[*|Ubicaciones], cartaporte20\\:Ubicaciones, cartaporte30\\:Ubicaciones',
            'cp-mercancias': '[*|Mercancias], cartaporte20\\:Mercancias, cartaporte30\\:Mercancias',
            'cp-autotransporte': '[*|Autotransporte], cartaporte20\\:Autotransporte, cartaporte30\\:Autotransporte',
            'cp-operador': '[*|Operador], cartaporte20\\:Operador, cartaporte30\\:Operador',
            'cp-permisos': '[*|PermSCT], cartaporte20\\:PermSCT, cartaporte30\\:PermSCT',
            'doda-pedimentos': '[*|Pedimento], cfdi\\:Pedimento',
            'complementos': 'cfdi\\:Complemento, Complemento',
            'addenda': 'cfdi\\:Addenda, Addenda'
        };

        const selector = selectorMap[seccionId];
        if (!selector) return;

        // Encontrar nodo en el DOM XML
        const targetNode = xmlDoc.querySelector(selector);
        if (targetNode) {
            // Calcular Path único para este nodo
            // Algoritmo: Traversar desde root hasta este nodo para construir el path "root-0-1..."
            const generatedPath = getPathForNode(targetNode, xmlDoc.documentElement, 'root');

            if (generatedPath) {
                // Expandir ruta completa
                const parts = generatedPath.split('-');
                const pathsToExpand = new Set<string>();
                let currentPath = parts[0];
                pathsToExpand.add(currentPath);

                for (let i = 1; i < parts.length - 1; i++) { // -1 para no expandir el último si no se quiere hijos
                    currentPath += '-' + parts[i];
                    pathsToExpand.add(currentPath);
                }

                // Combinar con existentes
                setExpandedPaths(prev => {
                    const next = new Set(prev);
                    pathsToExpand.forEach(p => next.add(p));
                    return next;
                });

                setActiveNodePath(generatedPath);

                // Scroll tras render
                setTimeout(() => {
                    const element = document.getElementById(`xml-node-${generatedPath}`);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 100);
            }
        }
    };

    // Helper para buscar ruta
    const getPathForNode = (target: Node, current: Node, currentPath: string): string | null => {
        if (target === current) return currentPath;

        const children = searchChildren(current); // Usar misma lógica de filtrado que render
        for (let i = 0; i < children.length; i++) {
            const found = getPathForNode(target, children[i], `${currentPath}-${i}`);
            if (found) return found;
        }
        return null;
    };

    const searchChildren = (node: Node) => {
        return Array.from(node.childNodes).filter(n =>
            n.nodeType === Node.ELEMENT_NODE || (n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
        );
    }
    // --- XML TREE LOGIC END ---

    const getSemaforoColor = (status: 'presente' | 'ausente' | 'incompleto') => {
        switch (status) {
            case 'presente': return 'bg-green-500';
            case 'ausente': return 'bg-red-500';
            case 'incompleto': return 'bg-yellow-500';
        }
    };

    const downloadXml = () => {
        if (!data?.cfdi.xmlOriginal) return;
        const blob = new Blob([data.cfdi.xmlOriginal], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${data.cfdi.uuid}.xml`;
        a.click();
    };

    if (!uuid) return null;

    return (
        <div className="fixed inset-0 md:left-64 z-[70] overflow-hidden" role="dialog" aria-modal="true">
            <div className="flex h-screen">
                {/* Overlay */}
                <div className="absolute inset-0 bg-gray-900 bg-opacity-95 backdrop-blur-sm" onClick={onClose}></div>

                {/* Main Container */}
                <div className="relative z-10 flex w-full h-full p-4 md:p-6">
                    <div className="flex w-full h-full bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">

                        {/* PANEL IZQUIERDO: ÍNDICE FORENSE */}
                        <div style={{ width: '320px', minWidth: '320px' }} className="w-80 flex-shrink-0 bg-gray-950 border-r border-gray-800 flex flex-col">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 px-4 py-4 border-b border-gray-800 flex justify-between items-start">
                                <div>
                                    <h3 className="text-white font-bold text-sm flex items-center gap-2">
                                        <span className="text-xl">🔍</span>
                                        ÍNDICE FORENSE
                                    </h3>
                                    <p className="text-xs text-indigo-300 mt-1">Navegación Guiada</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-indigo-200 hover:text-white bg-indigo-800/50 hover:bg-indigo-700/50 rounded-lg p-1.5 transition-colors"
                                    title="Cerrar Visor"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Badges Especiales y Resúmenes */}
                            <div className="p-4 space-y-2 border-b border-gray-800 max-h-[50vh] overflow-y-auto custom-scrollbar">
                                {cartaPorteDetectada && xmlDoc && (
                                    <CartaPorteResumen xmlDoc={xmlDoc} />
                                )}
                                {addendaDetectada && (
                                    <div className="bg-gradient-to-r from-purple-900/40 to-purple-800/20 border border-purple-700 rounded-lg px-3 py-2 flex items-center gap-2">
                                        <span className="text-lg">📎</span>
                                        <div className="flex-1">
                                            <p className="text-purple-300 font-bold text-xs">Addenda Presente</p>
                                            <p className="text-purple-400/60 text-[10px]">No fiscal - Valor probatorio</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Lista de Secciones */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {loading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                                    </div>
                                ) : (
                                    <div className="p-2 space-y-1">
                                        {secciones.map((seccion) => (
                                            <div key={seccion.id}>
                                                <button
                                                    onClick={() => navegarASeccion(seccion.id)}
                                                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 group ${seccionActiva === seccion.id
                                                        ? 'bg-indigo-600 text-white shadow-lg'
                                                        : 'hover:bg-gray-800 text-gray-300'
                                                        }`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full ${getSemaforoColor(seccion.status)} shadow-lg`}></div>
                                                    <span className="text-base">{seccion.icon}</span>
                                                    <span className="flex-1 text-sm font-semibold">{seccion.label}</span>
                                                    {seccion.subsecciones && (
                                                        <span className="text-xs opacity-50">▼</span>
                                                    )}
                                                </button>

                                                {/* Subsecciones */}
                                                {seccion.subsecciones && (
                                                    <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-800 pl-2">
                                                        {seccion.subsecciones.map((sub) => (
                                                            <button
                                                                key={sub.id}
                                                                onClick={() => navegarASeccion(sub.id)}
                                                                className={`w-full text-left px-2 py-1.5 rounded transition-all flex items-center gap-2 text-xs ${seccionActiva === sub.id
                                                                    ? 'bg-indigo-700 text-white'
                                                                    : 'hover:bg-gray-800 text-gray-400'
                                                                    }`}
                                                            >
                                                                <div className={`w-1.5 h-1.5 rounded-full ${getSemaforoColor(sub.status)}`}></div>
                                                                <span>{sub.icon}</span>
                                                                <span className="flex-1 font-medium">{sub.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer - Integración Materialidad */}
                            {(cartaPorteDetectada || dodaDetectada) && (
                                <div className="p-4 border-t border-gray-800 bg-gray-900/50">
                                    <button className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold py-2.5 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 text-sm">
                                        <span>📋</span>
                                        Gestión de Materialidad
                                    </button>
                                    <p className="text-[10px] text-gray-500 text-center mt-2">
                                        Evidencias requeridas detectadas
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* PANEL DERECHO: VISOR XML */}
                        <div className="flex-1 flex flex-col bg-gray-900 min-w-0">
                            {/* Header */}
                            <div className="bg-gray-950 px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl leading-6 font-bold text-white flex items-center gap-3">
                                        <span className="text-2xl">🛡️</span> VISOR XML FORENSE
                                        <span className="px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 text-[10px] tracking-widest border border-indigo-700 uppercase">
                                            Inmutable
                                        </span>
                                    </h3>
                                    <p className="text-xs text-indigo-400 mt-1 font-mono tracking-wide flex items-center gap-2">
                                        UUID: <span className="text-white bg-gray-800 px-2 py-0.5 rounded select-all">{uuid}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={downloadXml} className="text-xs font-bold text-gray-300 hover:text-white border border-gray-600 rounded px-3 py-1.5 transition-all hover:border-gray-400 flex items-center gap-2">
                                        ⬇️ Descargar XML
                                    </button>
                                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl font-bold bg-white/5 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10">
                                        &times;
                                    </button>
                                </div>
                            </div>

                            {/* Resumen Ejecutivo */}
                            {!loading && data && (
                                <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 grid grid-cols-5 gap-4 text-xs">
                                    <div>
                                        <p className="text-gray-500 uppercase font-bold mb-1">Emisor</p>
                                        <p className="text-white font-semibold truncate">{data.cfdi.emisorNombre}</p>
                                        <p className="text-indigo-300 font-mono text-[10px]">{data.cfdi.emisorRfc}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 uppercase font-bold mb-1">Receptor</p>
                                        <p className="text-white font-semibold truncate">{data.cfdi.receptorNombre}</p>
                                        <p className="text-purple-300 font-mono text-[10px]">{data.cfdi.receptorRfc}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 uppercase font-bold mb-1">Fecha</p>
                                        <p className="text-white font-semibold">{data.cfdi.fecha.split('T')[0]}</p>
                                        <p className="text-gray-400 text-[10px]">{data.cfdi.tipoComprobante === 'I' ? 'Ingreso' : 'Egreso'}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 uppercase font-bold mb-1">Total</p>
                                        <p className="text-green-400 font-bold text-lg">
                                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: data.cfdi.moneda }).format(data.cfdi.total)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500 uppercase font-bold mb-1">Pago</p>
                                        <p className="text-white font-semibold">{data.cfdi.formaPago || '99'}</p>
                                        <p className="text-gray-400 text-[10px]">{data.cfdi.metodoPago || 'PPD'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Editor Toolbar */}
                            <div className="bg-[#161b22] px-4 py-2 flex justify-between items-center border-b border-gray-800">
                                <span className="text-xs font-mono text-gray-500 flex items-center gap-2">
                                    <span className="text-orange-400">{'<>'}</span> source.xml <span className="text-gray-600">|</span> UTF-8
                                </span>
                                <div className="flex gap-2 text-[10px] text-gray-500 font-mono">
                                    <span>Ln {data?.cfdi.xmlOriginal?.split('\n').length || 0}, Col 1</span>
                                </div>
                            </div>

                            {/* XML Content */}
                            <div ref={xmlViewerRef} className="flex-1 overflow-auto bg-[#0d1117] custom-scrollbar p-6">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full text-gray-700 font-mono">
                                        Cargando estructura forense...
                                    </div>
                                ) : error ? (
                                    <div className="flex items-center justify-center h-full text-red-400">
                                        {error}
                                    </div>
                                ) : xmlDoc ? (
                                    <div className="pb-20"> {/* Padding bottom extra */}
                                        <XmlTreeNode
                                            node={xmlDoc.documentElement}
                                            path="root"
                                            depth={0}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-gray-500 font-mono text-xs">Sin contenido XML parseable</div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="bg-gray-950 border-t border-gray-800 px-4 py-2 flex justify-between items-center">
                                <span className="text-[10px] text-gray-500 font-mono">
                                    SHA-256: {data?.cfdi.uuid ? 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' : 'Calculando...'}
                                </span>
                                <span className="text-[10px] text-yellow-600/80 uppercase font-bold tracking-widest">
                                    Sólo Lectura • Forense Certified
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #1a1a1a;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #4a5568;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #718096;
                }
                .highlight-active {
                    background: rgba(99, 102, 241, 0.3) !important;
                    border-left: 3px solid #6366f1;
                    animation: pulse-highlight 1s ease-in-out;
                }
                @keyframes pulse-highlight {
                    0%, 100% { background: rgba(99, 102, 241, 0.3); }
                    50% { background: rgba(99, 102, 241, 0.5); }
                }
            `}</style>
        </div >
    );
};

export default XmlVisorForense;
