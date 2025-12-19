import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const expedientesDevolucionIva = sqliteTable("expedientes_devolucion_iva", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  empresaId: text("empresa_id").notNull(),
  rfcEmpresa: text("rfc_empresa").notNull(),
  periodo: text("periodo").notNull(), // formato: YYYY-MM
  tipo: text("tipo").notNull(), // e.g., "saldos a favor de IVA"
  estado: text("estado").notNull(), // e.g., "Borrador", "En revisión"
  fechaCreacion: integer("fecha_creacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  fechaActualizacion: integer("fecha_actualizacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});