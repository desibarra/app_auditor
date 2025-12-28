import React from 'react';

export interface BadgeFiscalConfig {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    descripcion: string;
}

export const BADGES_FISCALES: Record<string, BadgeFiscalConfig> = {
    'I': {
        label: 'INGRESO GRAVADO',
        color: 'text-green-300',
        bgColor: 'bg-green-900/40',
        borderColor: 'border-green-700',
        icon: '🟢',
        descripcion: 'Factura de venta o servicio prestado'
    },
    'E': {
        label: 'EGRESO DEDUCIBLE',
        color: 'text-blue-300',
        bgColor: 'bg-blue-900/40',
        borderColor: 'border-blue-700',
        icon: '🔵',
        descripcion: 'Nota de crédito o devolución'
    },
    'N': {
        label: 'NÓMINA',
        color: 'text-purple-300',
        bgColor: 'bg-purple-900/40',
        borderColor: 'border-purple-700',
        icon: '🟣',
        descripcion: 'Recibo de nómina de empleado'
    },
    'P': {
        label: 'COMPLEMENTO DE PAGO',
        color: 'text-gray-300',
        bgColor: 'bg-gray-900/40',
        borderColor: 'border-gray-700',
        icon: '⚪',
        descripcion: 'Comprobante de pago relacionado'
    },
    'T': {
        label: 'TRASLADO',
        color: 'text-yellow-300',
        bgColor: 'bg-yellow-900/40',
        borderColor: 'border-yellow-700',
        icon: '🟡',
        descripcion: 'Traslado de mercancías sin venta'
    }
};

export const COMPLEMENTOS_ESPECIALES: Record<string, BadgeFiscalConfig> = {
    'CARTA_PORTE': {
        label: 'CARTA PORTE',
        color: 'text-orange-300',
        bgColor: 'bg-orange-900/40',
        borderColor: 'border-orange-700',
        icon: '🚚',
        descripcion: 'Transporte de mercancías - Requiere evidencias'
    },
    'COMERCIO_EXTERIOR': {
        label: 'COMERCIO EXTERIOR',
        color: 'text-red-300',
        bgColor: 'bg-red-900/40',
        borderColor: 'border-red-700',
        icon: '🌎',
        descripcion: 'Operación de importación/exportación'
    },
    'NOMINA': {
        label: 'NÓMINA 1.2',
        color: 'text-indigo-300',
        bgColor: 'bg-indigo-900/40',
        borderColor: 'border-indigo-700',
        icon: '💼',
        descripcion: 'Complemento de nómina'
    },
    'PAGOS': {
        label: 'PAGOS 2.0',
        color: 'text-cyan-300',
        bgColor: 'bg-cyan-900/40',
        borderColor: 'border-cyan-700',
        icon: '💳',
        descripcion: 'Complemento de pagos'
    }
};

interface BadgeFiscalProps {
    tipo: 'I' | 'E' | 'N' | 'P' | 'T';
    complementos?: string[];
    size?: 'sm' | 'md' | 'lg';
    showDescription?: boolean;
    className?: string;
}

const BadgeFiscal: React.FC<BadgeFiscalProps> = ({
    tipo,
    complementos = [],
    size = 'md',
    showDescription = false,
    className = ''
}) => {
    const config = BADGES_FISCALES[tipo];

    if (!config) {
        return null;
    }

    const sizeClasses = {
        sm: 'px-2 py-1 text-[10px]',
        md: 'px-3 py-1.5 text-xs',
        lg: 'px-4 py-2 text-sm'
    };

    const iconSizes = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {/* Badge Principal */}
            <div
                className={`
                    inline-flex items-center gap-2 rounded-lg border
                    ${config.bgColor} ${config.borderColor} ${config.color}
                    ${sizeClasses[size]}
                    font-bold uppercase tracking-wider
                    shadow-lg transition-all hover:scale-105
                `}
                title={config.descripcion}
            >
                <span className={iconSizes[size]}>{config.icon}</span>
                <span>{config.label}</span>
            </div>

            {/* Badges de Complementos */}
            {complementos.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {complementos.map((comp, idx) => {
                        const compConfig = COMPLEMENTOS_ESPECIALES[comp];
                        if (!compConfig) return null;

                        return (
                            <div
                                key={idx}
                                className={`
                                    inline-flex items-center gap-1.5 rounded-md border
                                    ${compConfig.bgColor} ${compConfig.borderColor} ${compConfig.color}
                                    px-2 py-0.5 text-[10px]
                                    font-bold uppercase tracking-wide
                                    shadow-md transition-all hover:scale-105
                                `}
                                title={compConfig.descripcion}
                            >
                                <span className="text-xs">{compConfig.icon}</span>
                                <span>{compConfig.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Descripción (opcional) */}
            {showDescription && (
                <p className="text-xs text-gray-400 italic mt-1">
                    {config.descripcion}
                </p>
            )}
        </div>
    );
};

export default BadgeFiscal;
