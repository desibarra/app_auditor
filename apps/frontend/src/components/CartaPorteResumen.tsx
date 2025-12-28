import React from 'react';

interface CartaPorteResumenProps {
    xmlDoc: Document;
}

interface UbicacionInfo {
    tipo: string;
    nombre: string;
    ciudad: string;
    estado: string;
    fecha: string;
}

interface MercanciaInfo {
    descripcion: string;
    cantidad: string;
    peso: string;
    valor: string;
}

interface AutotransporteInfo {
    permiso: string;
    placas: string;
    modelo: string;
    seguro: string;
}

interface OperadorInfo {
    nombre: string;
    licencia: string;
    rfc: string;
}

const CartaPorteResumen: React.FC<CartaPorteResumenProps> = ({ xmlDoc }) => {
    const extraerUbicaciones = (): UbicacionInfo[] => {
        const ubicaciones: UbicacionInfo[] = [];
        const nodes = xmlDoc.querySelectorAll('[*|Ubicacion], cartaporte20\\:Ubicacion, cartaporte30\\:Ubicacion');

        nodes.forEach(node => {
            const domicilio = node.querySelector('[*|Domicilio], cartaporte20\\:Domicilio, cartaporte30\\:Domicilio');
            ubicaciones.push({
                tipo: node.getAttribute('TipoUbicacion') || 'N/A',
                nombre: node.getAttribute('NombreRemitenteDestinatario') || 'N/A',
                ciudad: domicilio?.getAttribute('Localidad') || 'N/A',
                estado: domicilio?.getAttribute('Estado') || 'N/A',
                fecha: node.getAttribute('FechaHoraSalidaLlegada') || 'N/A'
            });
        });

        return ubicaciones;
    };

    const extraerMercancias = (): MercanciaInfo[] => {
        const mercancias: MercanciaInfo[] = [];
        const nodes = xmlDoc.querySelectorAll('[*|Mercancia], cartaporte20\\:Mercancia, cartaporte30\\:Mercancia');

        nodes.forEach(node => {
            mercancias.push({
                descripcion: node.getAttribute('Descripcion') || 'N/A',
                cantidad: node.getAttribute('Cantidad') || '0',
                peso: node.getAttribute('PesoEnKg') || '0',
                valor: node.getAttribute('ValorMercancia') || '0'
            });
        });

        return mercancias;
    };

    const extraerAutotransporte = (): AutotransporteInfo | null => {
        const auto = xmlDoc.querySelector('[*|Autotransporte], cartaporte20\\:Autotransporte, cartaporte30\\:Autotransporte');
        if (!auto) return null;

        const vehiculo = auto.querySelector('[*|IdentificacionVehicular], cartaporte20\\:IdentificacionVehicular, cartaporte30\\:IdentificacionVehicular');
        const seguro = auto.querySelector('[*|Seguros], cartaporte20\\:Seguros, cartaporte30\\:Seguros');

        return {
            permiso: auto.getAttribute('PermSCT') || 'N/A',
            placas: vehiculo?.getAttribute('PlacaVM') || 'N/A',
            modelo: vehiculo?.getAttribute('AnioModeloVM') || 'N/A',
            seguro: seguro?.getAttribute('AseguraRespCivil') || 'N/A'
        };
    };

    const extraerOperador = (): OperadorInfo | null => {
        const operador = xmlDoc.querySelector('[*|TiposFigura], cartaporte20\\:TiposFigura, cartaporte30\\:TiposFigura');
        if (!operador) return null;

        return {
            nombre: operador.getAttribute('NombreFigura') || 'N/A',
            licencia: operador.getAttribute('NumLicencia') || 'N/A',
            rfc: operador.getAttribute('RFCFigura') || 'N/A'
        };
    };

    const ubicaciones = extraerUbicaciones();
    const mercancias = extraerMercancias();
    const autotransporte = extraerAutotransporte();
    const operador = extraerOperador();

    return (
        <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/10 border border-orange-700 rounded-lg p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-orange-700/50 pb-3">
                <span className="text-3xl">🚛</span>
                <div>
                    <h4 className="text-orange-300 font-bold text-sm uppercase">Resumen Carta Porte</h4>
                    <p className="text-orange-400/60 text-xs">Información de transporte federal</p>
                </div>
            </div>

            {/* Ruta */}
            <div>
                <label className="text-[10px] text-orange-500 uppercase font-bold tracking-wider mb-2 block">
                    📍 Ruta de Transporte
                </label>
                <div className="space-y-2">
                    {ubicaciones.map((ub, idx) => (
                        <div key={idx} className="bg-gray-900/50 rounded p-2 border border-orange-800/30">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${ub.tipo === 'Origen' ? 'bg-green-900/50 text-green-300' : 'bg-blue-900/50 text-blue-300'
                                    }`}>
                                    {ub.tipo}
                                </span>
                                <span className="text-white text-xs font-semibold">{ub.nombre}</span>
                            </div>
                            <p className="text-orange-200 text-[11px]">
                                {ub.ciudad}, {ub.estado}
                            </p>
                            <p className="text-orange-400/50 text-[10px] font-mono mt-1">
                                {ub.fecha.split('T')[0]} {ub.fecha.split('T')[1]?.substring(0, 5)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mercancías */}
            <div>
                <label className="text-[10px] text-orange-500 uppercase font-bold tracking-wider mb-2 block">
                    📦 Mercancías ({mercancias.length})
                </label>
                <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                    {mercancias.map((merc, idx) => (
                        <div key={idx} className="bg-gray-900/50 rounded p-2 border border-orange-800/30 text-xs">
                            <p className="text-white font-semibold truncate">{merc.descripcion}</p>
                            <div className="grid grid-cols-3 gap-2 mt-1 text-[10px]">
                                <div>
                                    <span className="text-orange-500">Cant:</span>
                                    <span className="text-orange-200 ml-1">{merc.cantidad}</span>
                                </div>
                                <div>
                                    <span className="text-orange-500">Peso:</span>
                                    <span className="text-orange-200 ml-1">{parseFloat(merc.peso).toLocaleString()} kg</span>
                                </div>
                                <div>
                                    <span className="text-orange-500">Valor:</span>
                                    <span className="text-orange-200 ml-1">${parseFloat(merc.valor).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Autotransporte */}
            {autotransporte && (
                <div>
                    <label className="text-[10px] text-orange-500 uppercase font-bold tracking-wider mb-2 block">
                        🚚 Vehículo
                    </label>
                    <div className="bg-gray-900/50 rounded p-2 border border-orange-800/30 text-xs space-y-1">
                        <div className="flex justify-between">
                            <span className="text-orange-500">Placas:</span>
                            <span className="text-white font-bold font-mono">{autotransporte.placas}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-orange-500">Modelo:</span>
                            <span className="text-orange-200">{autotransporte.modelo}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-orange-500">Permiso SCT:</span>
                            <span className="text-orange-200 font-mono">{autotransporte.permiso}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-orange-500">Seguro:</span>
                            <span className="text-orange-200 truncate max-w-[150px]">{autotransporte.seguro}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Operador */}
            {operador && (
                <div>
                    <label className="text-[10px] text-orange-500 uppercase font-bold tracking-wider mb-2 block">
                        👤 Operador
                    </label>
                    <div className="bg-gray-900/50 rounded p-2 border border-orange-800/30 text-xs space-y-1">
                        <p className="text-white font-semibold">{operador.nombre}</p>
                        <div className="flex justify-between">
                            <span className="text-orange-500">RFC:</span>
                            <span className="text-orange-200 font-mono">{operador.rfc}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-orange-500">Licencia:</span>
                            <span className="text-orange-200 font-mono">{operador.licencia}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerta de Materialidad */}
            <div className="bg-yellow-900/30 border border-yellow-700 rounded p-3 flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <div className="flex-1">
                    <p className="text-yellow-300 font-bold text-xs">Evidencias Requeridas</p>
                    <ul className="text-yellow-400/80 text-[10px] mt-1 space-y-0.5 list-disc list-inside">
                        <li>Fotografías de la mercancía</li>
                        <li>Guía de transporte firmada</li>
                        <li>Póliza de seguro vigente</li>
                        <li>Licencia del operador</li>
                        <li>Tarjeta de circulación del vehículo</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CartaPorteResumen;
