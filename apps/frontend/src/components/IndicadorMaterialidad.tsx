interface IndicadorMaterialidadProps {
    numEvidencias: number;
}

function IndicadorMaterialidad({ numEvidencias }: IndicadorMaterialidadProps) {
    const getEstado = () => {
        if (numEvidencias >= 3) {
            return {
                icono: '🟢',
                color: 'text-emerald-400',
                bg: 'bg-emerald-900/20',
                border: 'border-emerald-900/50',
                label: 'Completo',
                tooltip: `${numEvidencias} documentos - Materialización completa`,
                shadow: 'shadow-[0_0_10px_rgba(52,211,153,0.3)]'
            };
        }
        if (numEvidencias > 0) {
            return {
                icono: '🟡',
                color: 'text-amber-400',
                bg: 'bg-amber-900/20',
                border: 'border-amber-900/50',
                label: 'Parcial',
                tooltip: `${numEvidencias} documento${numEvidencias !== 1 ? 's' : ''} - Materialización incompleta`,
                shadow: 'shadow-[0_0_10px_rgba(251,191,36,0.2)]'
            };
        }
        return {
            icono: '🔴',
            color: 'text-rose-400',
            bg: 'bg-rose-900/20',
            border: 'border-rose-900/50',
            label: 'Vacío',
            tooltip: '0 documentos - Requiere materialización',
            shadow: 'shadow-none'
        };
    };

    const estado = getEstado();

    return (
        <div
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border ${estado.bg} ${estado.border} ${estado.shadow} transition-all duration-300`}
            title={estado.tooltip}
        >
            <span className="text-[10px] leading-none opacity-80 filter drop-shadow">{estado.icono}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${estado.color}`}>
                {estado.label}
            </span>
        </div>
    );
}

export default IndicadorMaterialidad;
