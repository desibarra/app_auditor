import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const cedulasIva = sqliteTable("cedulas_iva", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  expedienteId: integer("expediente_id").notNull(),
  tipoCedula: text("tipo_cedula").notNull(),
  datos: text("datos").notNull(), // JSON stored as text
  fechaCreacion: integer("fecha_creacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),
  fechaActualizacion: integer("fecha_actualizacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});