import { sqliteTable, text, real, integer, primaryKey } from "drizzle-orm/sqlite-core";

/**
 * Tabla: complementos_pago_recibidos
 * Versión: v1.0
 */
export const complementosPagoRecibidos = sqliteTable("complementos_pago_recibidos", {
    id: text("id").notNull(),
    uuid: text("uuid").notNull().unique(),
    cfdiUuid: text("cfdi_uuid").notNull(),
    fechaEmision: integer("fecha_emision", { mode: 'timestamp_ms' }).notNull(),
    montoPago: real("monto_pago").notNull(),
    xmlOriginal: text("xml_original").notNull(),
    xmlHash: text("xml_hash").notNull(),
    objetoImpDR: text("objeto_imp_dr"),
    baseDeclarada: real("base_declarada"),
    estadoProcesamiento: text("estado_procesamiento").notNull().default("recibido"),
}, (table) => ({
    pk: primaryKey({ columns: [table.id] }),
}));