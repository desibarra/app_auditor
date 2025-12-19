import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { expedientesDevolucionIva } from "./expedientes_devolucion_iva";
import { cfdiRecibidos } from "./cfdi_recibidos.schema";

/**
 * Tabla: documentos_soporte
 * Almacena evidencia documental para expedientes y CFDIs
 * 
 * ACTUALIZACIÓN (GAP-004):
 * - Agregado: cfdi_uuid (FK opcional a cfdi_recibidos)
 * - Agregado: categoria_evidencia
 * - Agregado: descripcion_evidencia
 * 
 * Compatibilidad: Registros existentes no se afectan (campos nullable)
 */
export const documentosSoporte = sqliteTable("documentos_soporte", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  // Relación con Expediente (original, ahora opcional)
  expedienteId: integer("expediente_id")
    .references(() => expedientesDevolucionIva.id),

  // ✨ NUEVO: Relación con CFDI (opcional para evidencia de materialidad)
  cfdiUuid: text("cfdi_uuid")
    .references(() => cfdiRecibidos.uuid, { onDelete: 'set null' }), // SET NULL para preservar evidencia

  // Tipo de Documento (original)
  tipoDocumento: text("tipo_documento").notNull(), // e.g., "Contrato", "Estado de cuenta"

  // ✨ NUEVO: Categoría de Evidencia (para materialidad)
  categoriaEvidencia: text("categoria_evidencia").default("Otro"),
  // 'Contrato' | 'Foto' | 'Entregable' | 'Estado de Cuenta' | 'Otro'

  // ✨ NUEVO: Descripción de la Evidencia
  descripcionEvidencia: text("descripcion_evidencia"),

  // Ruta del archivo en S3 (original, pero ahora puede ser null temporalmente)
  archivo: text("archivo"), // Nullable para soportar estado 'pendiente'

  // Estado del documento (original, ahora con más opciones)
  estado: text("estado").notNull().default("pendiente"),
  // 'pendiente' | 'completado' | 'error'

  // Timestamps
  fechaSubida: integer("fecha_subida", { mode: 'timestamp_ms' }).defaultNow(),
  fechaActualizacion: integer("fecha_actualizacion", { mode: 'timestamp_ms' }).defaultNow(),

  // ✨ NUEVO: Metadatos de procesamiento
  intentosSubida: integer("intentos_subida").default(0),
  ultimoError: text("ultimo_error"),
});