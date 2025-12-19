interface IndicadorMaterialidadProps {
    numEvidencias: number;
}

function IndicadorMaterialidad({ numEvidencias }: IndicadorMaterialidadProps) {
    const getEstado = () => {
        if (numEvidencias >= 3) {
            return {
                icono: '🟢',
                color: 'text-green-600',
                bg: 'bg-green-50',
                border: 'border-green-200',
                label: 'Completo',
                tooltip: `${numEvidencias} documentos - Materialización completa`,
            };
        }
        if (numEvidencias > 0) {
            return {
                icono: '🟡',
                color: 'text-yellow-600',
                bg: 'bg-yellow-50',
                border: 'border-yellow-200',
                label: 'Parcial',
                tooltip: `${numEvidencias} documento${numEvidencias !== 1 ? 's' : ''} - Materialización incompleta`,
            };
        }
        return {
            icono: '🔴',
            color: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200',
            label: 'Vacío',
            tooltip: '0 documentos - Requiere materialización',
        };
    };

    const estado = getEstado();

    return (
        <div
            className={`inline-flex items-center gap-2 px-2 py-1 rounded border ${estado.bg} ${estado.border}`}
            title={estado.tooltip}
        >
            <span className="text-lg">{estado.icono}</span>
            <span className={`text-xs font-medium ${estado.color}`}>
                {estado.label}
            </span>
        </div>
    );
}

export default IndicadorMaterialidad;
