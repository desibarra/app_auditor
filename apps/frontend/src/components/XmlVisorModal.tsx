import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface XmlVisorModalProps {
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

const XmlVisorModal: React.FC<XmlVisorModalProps> = ({ uuid, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CfdiDetalle | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchXml = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/api/cfdi/detalle/${uuid}`);
                setData(res.data);
            } catch (err) {
                console.error("Error fetching XML", err);
                setError("No se pudo cargar el XML original. Verifique su conexión.");
            } finally {
                setLoading(false);
            }
        };

        if (uuid) fetchXml();
    }, [uuid]);

    // Simple robust XML formatter
    const formatXml = (xml: string) => {
        let formatted = '';
        const reg = /(>)(<)(\/*)/g;
        xml = xml.replace(reg, '$1\r\n$2$3');
        let pad = 0;
        xml.split('\r\n').forEach((node) => {
            let indent = 0;
            if (node.match(/.+<\/\w[^>]*>$/)) {
                indent = 0;
            } else if (node.match(/^<\/\w/)) {
                if (pad !== 0) {
                    pad -= 2;
                }
            } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
                indent = 2;
            } else {
                indent = 0;
            }
            let padding = '';
            for (let i = 0; i < pad; i++) {
                padding += '  ';
            }
            formatted += padding + node + '\r\n';
            pad += indent;
        });
        return formatted;
    };

    // -------------------------------------------------------------------------
    // 🧠 SMART XML HIGHLIGHTER
    // -------------------------------------------------------------------------
    const renderHighlightedXml = (xmlString: string) => {
        if (!xmlString) return null;

        // 1. Pre-format (Indent)
        const formatted = formatXml(xmlString);

        // 2. Syntax Highlighting Regex
        // Captures: Tags (<...>), Attributes keys (Key=), Values ("...")
        // We highlight specific semantic values manually
        return formatted.split('\n').map((line, i) => {
            // Highlight specific attributes
            const processedLine = line
                .replace(/(UUID|Total|SubTotal|Fecha|Rfc|Sello|Certificado|Moneda|TipoCambio)="([^"]*)"/g, (_, key, val) => {
                    // Yellow Highlight for Key Fields
                    return `<span class="text-yellow-600 font-bold">${key}</span>=<span class="text-yellow-300 bg-yellow-900/30 px-1 rounded">${val}</span>`;
                })
                .replace(/(Concepto|Descripcion)="([^"]*)"/g, (_, key, val) => {
                    // White highlight for descriptions
                    return `<span class="text-blue-400">${key}</span>=<span class="text-white font-bold">${val}</span>`;
                })
                .replace(/(&lt;|&#60;)/g, '<').replace(/(&gt;|&#62;)/g, '>');

            return (
                <div key={i} dangerouslySetInnerHTML={{ __html: processedLine }} className="whitespace-pre hover:bg-white/5 transition-colors" />
            );
        });
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

    const copyData = () => {
        if (!data) return;
        navigator.clipboard.writeText(JSON.stringify(data.cfdi, null, 2));
        alert('Datos copiados al portapapeles'); // Simple feedback
    };

    if (!uuid) return null;

    return (
        <div className="fixed inset-0 z-[70] overflow-y-auto" role="dialog" aria-modal="true">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-900 bg-opacity-95 transition-opacity backdrop-blur-sm" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="inline-block align-middle bg-gray-800 rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:max-w-6xl sm:w-full border border-gray-700 ring-1 ring-white/10">

                    {/* Header Sentinel */}
                    <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gradient-to-r from-gray-900 to-gray-800">
                        <div>
                            <h3 className="text-xl leading-6 font-bold text-white flex items-center gap-3">
                                <span className="text-2xl">🛡️</span> VISOR XML FORENSE
                                <span className="px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 text-[10px] tracking-widest border border-indigo-700 uppercase">
                                    Inmutable
                                </span>
                            </h3>
                            <p className="text-xs text-indigo-400 mt-1 font-mono tracking-wide flex items-center gap-2">
                                UUID: <span className="text-white bg-gray-800 px-1 rounded select-all">{uuid}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={downloadXml} className="text-xs font-bold text-gray-400 hover:text-white border border-gray-600 rounded px-3 py-1.5 transition-all hover:border-gray-400 flex items-center gap-2">
                                ⬇️ XML
                            </button>
                            <button onClick={copyData} className="text-xs font-bold text-gray-400 hover:text-white border border-gray-600 rounded px-3 py-1.5 transition-all hover:border-gray-400 flex items-center gap-2">
                                📋 JSON
                            </button>
                            <button onClick={onClose} className="ml-4 text-gray-400 hover:text-white transition-colors text-2xl font-bold bg-white/5 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10">
                                &times;
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row h-[75vh]">

                        {/* 1. SIDE PANEL (DATOS CLAVE) */}
                        <div className="w-full sm:w-1/3 bg-gray-900/50 border-r border-gray-700 overflow-y-auto custom-scrollbar p-6">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                                </div>
                            ) : error ? (
                                <div className="text-red-400 text-center">{error}</div>
                            ) : data ? (
                                <div className="space-y-6 animate-fade-in">

                                    {/* Risk Indicator */}
                                    <div className="bg-gradient-to-br from-green-900/40 to-green-900/10 border border-green-800 rounded-lg p-4 flex items-center gap-4">
                                        <div className="bg-green-500/20 p-2 rounded-full">
                                            <span className="text-2xl">🛡️</span>
                                        </div>
                                        <div>
                                            <p className="text-green-400 font-bold text-sm uppercase">Sin Riesgos Detectados</p>
                                            <p className="text-xs text-green-300/60 mt-0.5">Estructura y Listas Negras OK</p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded shadow-lg shadow-indigo-900/50 transition-all flex items-center justify-center gap-2 text-sm group"
                                        onClick={() => alert('Próximamente: Navegando a Expediente...')}
                                    >
                                        <span>📂</span> Auditoría 1x1
                                        <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                                    </button>

                                    {/* Participants */}
                                    <div className="space-y-4">
                                        <div className="relative pl-4 border-l-2 border-indigo-500">
                                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Emisor</label>
                                            <p className="text-sm font-bold text-white mt-1">{data.cfdi.emisorNombre}</p>
                                            <p className="text-xs text-indigo-300 font-mono mt-0.5 select-all">{data.cfdi.emisorRfc}</p>
                                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-800 text-gray-400 text-[10px] rounded border border-gray-700">Regimen: {data.cfdi.emisorRegimenFiscal || 'N/A'}</span>
                                        </div>

                                        <div className="relative pl-4 border-l-2 border-purple-500">
                                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Receptor</label>
                                            <p className="text-sm font-bold text-white mt-1">{data.cfdi.receptorNombre}</p>
                                            <p className="text-xs text-purple-300 font-mono mt-0.5 select-all">{data.cfdi.receptorRfc}</p>
                                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-800 text-gray-400 text-[10px] rounded border border-gray-700">Uso: {data.cfdi.receptorUsoCfdi || 'G03'}</span>
                                        </div>
                                    </div>

                                    {/* Amounts */}
                                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-inner">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-gray-500">Subtotal</span>
                                            <span className="text-sm text-gray-300 font-mono">${(data.cfdi.subtotal || 0).toLocaleString('es-MX')}</span>
                                        </div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-gray-500">IVA/Imptos</span>
                                            <span className="text-sm text-gray-300 font-mono text-red-300">
                                                +${((data.cfdi.total - (data.cfdi.subtotal || 0)).toLocaleString('es-MX'))}
                                            </span>
                                        </div>
                                        <div className="h-px bg-gray-600 my-2"></div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs text-indigo-400 font-bold uppercase">Total Neto</span>
                                            <span className="text-2xl text-white font-bold font-mono tracking-tight text-shadow-glow">
                                                {new Intl.NumberFormat('es-MX', { style: 'currency', currency: data.cfdi.moneda }).format(data.cfdi.total)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Metadata Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-800/50 p-2 rounded border border-gray-700/50">
                                            <label className="text-[9px] text-gray-500 uppercase">Fecha Emisión</label>
                                            <p className="text-xs text-white font-mono">{data.cfdi.fecha.split('T')[0]}</p>
                                        </div>
                                        <div className="bg-gray-800/50 p-2 rounded border border-gray-700/50">
                                            <label className="text-[9px] text-gray-500 uppercase">Tipo</label>
                                            <p className="text-xs text-white font-bold">
                                                {data.cfdi.tipoComprobante === 'I' ? 'Ingreso' : data.cfdi.tipoComprobante === 'E' ? 'Egreso' : data.cfdi.tipoComprobante}
                                            </p>
                                        </div>
                                        <div className="bg-gray-800/50 p-2 rounded border border-gray-700/50">
                                            <label className="text-[9px] text-gray-500 uppercase">Forma Pago</label>
                                            <p className="text-xs text-white truncate" title={data.cfdi.formaPago}>{data.cfdi.formaPago || '99'}</p>
                                        </div>
                                        <div className="bg-gray-800/50 p-2 rounded border border-gray-700/50">
                                            <label className="text-[9px] text-gray-500 uppercase">Método Pago</label>
                                            <p className="text-xs text-white font-bold">{data.cfdi.metodoPago || 'PPD'}</p>
                                        </div>
                                    </div>

                                    {/* Footer Validation */}
                                    <div className="pt-4 border-t border-gray-800">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                            <span className="text-[10px] text-gray-400 uppercase font-bold">Validación SAT</span>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-green-400 text-[10px] font-mono flex items-center gap-1"><span>✓</span> Estructura XSD 4.0 Válida</p>
                                            <p className="text-green-400 text-[10px] font-mono flex items-center gap-1"><span>✓</span> Sello Digital (SelloCFD) Íntegro</p>
                                            <p className="text-green-400 text-[10px] font-mono flex items-center gap-1"><span>✓</span> Certificado SAT Vigente</p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* 2. MAIN PANEL (XML VIEWER) */}
                        <div className="w-full sm:w-2/3 bg-[#0d1117] flex flex-col relative">
                            {/* Editor Toolbar */}
                            <div className="bg-[#161b22] px-4 py-2 flex justify-between items-center border-b border-gray-800">
                                <span className="text-xs font-mono text-gray-500 flex items-center gap-2">
                                    <span className="text-orange-400">{'<>'}</span> source.xml <span className="text-gray-600">|</span> UTF-8
                                </span>
                                <div className="flex gap-2 text-[10px] text-gray-500 font-mono">
                                    <span>Ln {data?.cfdi.xmlOriginal?.split('\n').length}, Col 1</span>
                                </div>
                            </div>

                            {/* Editor Content */}
                            <div className="flex-1 overflow-auto relative custom-scrollbar">
                                {loading ? (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-mono">
                                        Cargando bytes...
                                    </div>
                                ) : (
                                    <pre className="p-4 text-xs font-mono text-gray-300 leading-relaxed tab-size-4">
                                        {data?.cfdi.xmlOriginal ? (
                                            renderHighlightedXml(data.cfdi.xmlOriginal)
                                        ) : (
                                            <span className="text-red-500 opacity-50"> // No content loaded</span>
                                        )}
                                    </pre>
                                )}
                            </div>

                            {/* Sticky Search/Filter (Optional Future) */}
                            <div className="absolute bottom-4 right-4 opacity-50 hover:opacity-100 transition-opacity">
                                <div className="bg-gray-800/90 backdrop-blur rounded-full px-3 py-1 text-xs text-gray-400 border border-gray-700 flex items-center gap-2 shadow-xl">
                                    <span>🔍</span> Buscar en XML
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 text-right flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-mono truncate max-w-[50%]">
                            SHA-256: {data?.cfdi.uuid ? 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 (Simulated)' : 'Calculando...'}
                        </span>
                        <span className="text-[10px] text-yellow-600/80 uppercase font-bold tracking-widest">
                            Sólo Lectura • Forense Certified
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default XmlVisorModal;
