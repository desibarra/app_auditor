import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { cfdiRecibidos } from "./cfdi_recibidos.schema";

/**
 * Tabla: cfdi_impuestos
 * Almacena el desglose de impuestos (IVA, ISR, IEPS) de cada CFDI
 * Especificación: GAP-003 del Análisis de Brechas
 * 
 * Nota: Un CFDI puede tener múltiples impuestos (nivel comprobante y nivel concepto)
 */
export const cfdiImpuestos = sqliteTable("cfdi_impuestos", {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // Relación con CFDI
    cfdiUuid: text("cfdi_uuid")
        .references(() => cfdiRecibidos.uuid, { onDelete: 'cascade' })
        .notNull(),

    // Relación con Concepto (nullable si es impuesto a nivel comprobante)
    conceptoId: integer("concepto_id"), // FK a cfdi_conceptos (se creará después si es necesario)

    // Nivel del impuesto
    nivel: text("nivel").notNull(), // 'comprobante' | 'concepto'

    // Tipo de Impuesto
    tipo: text("tipo").notNull(), // 'Traslado' | 'Retencion'

    // Clave del Impuesto según catálogo SAT
    impuesto: text("impuesto").notNull(), // '002'=IVA, '001'=ISR, '003'=IEPS
    impuestoNombre: text("impuesto_nombre"), // 'IVA', 'ISR', 'IEPS' (desnormalizado para queries)

    // Tipo de Factor
    tipoFactor: text("tipo_factor").notNull(), // 'Tasa' | 'Cuota' | 'Exento'

    // Tasa o Cuota
    tasaOCuota: real("tasa_o_cuota"), // 0.16, 0.08, 0.10, etc. (null si es Exento)

    // Base Gravable
    base: real("base").notNull(),

    // Importe del Impuesto
    importe: real("importe").notNull(),

    // Metadatos
    fechaCreacion: integer("fecha_creacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});

/**
 * Índices para optimizar queries comunes:
 * - Buscar impuestos por CFDI
 * - Calcular IVA acreditable (filtrar por impuesto='002' y tipo='Traslado')
 */
