import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

/**
 * Tabla CFDI Riesgos
 * Almacena el resultado del análisis de riesgo fiscal (Sentinel Engine)
 */
export const cfdiRiesgos = sqliteTable('cfdi_riesgos', {
    id: integer('id').primaryKey({ autoIncrement: true }),

    // Vinculación
    cfdiUuid: text('cfdi_uuid').notNull(), // Link lógico a cfdi_recibidos
    empresaId: text('empresa_id').notNull(), // Para queries rápidos por empresa

    // Resultado del Análisis
    nivelRiesgo: text('nivel_riesgo').notNull(), // 'ALTO', 'MEDIO', 'BAJO'
    tipoRiesgo: text('tipo_riesgo').notNull(), // 'DEDUCIBILIDAD', 'LISTA_NEGRA', 'ESTATUS', 'MATERIALIDAD_FALTANTE'

    // Detalle
    titulo: text('titulo').notNull(), // "Gasto Fuera de Giro"
    descripcion: text('descripcion').notNull(), // "El concepto 'Cemento' no coincide con el sector 'Autotransporte'"
    sugerencia: text('sugerencia'), // "Sugerir cambio a No Deducible o anexar justificación"

    // Metadatos
    fechaAnalisis: integer('fecha_analisis', { mode: 'timestamp_ms' }).defaultNow(),
    estadoRevision: text('estado_revision').default('PENDIENTE'), // PENDIENTE, REVISADO, DESCARTADO
});
