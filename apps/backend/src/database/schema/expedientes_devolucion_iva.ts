import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Tabla: expedientes_devolucion_iva
 * Propósito: Agrupar documentos de trazabilidad (DODA, Pedimentos, Estados de Cuenta)
 * para una solicitud de devolución o un periodo fiscal auditado.
 */
export const expedientesDevolucionIva = sqliteTable("expedientes_devolucion_iva", {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // Identidad
    empresaId: text("empresa_id").notNull(),
    rfcEmpresa: text("rfc_empresa"), // Added to fix compatibility
    folioControl: text("folio_control").notNull().unique(), // Ej: VANG-2025-NOV-001

    // Periodo Fiscal
    ejercicio: integer("ejercicio").notNull(), // 2025
    periodo: integer("periodo").notNull(), // 11 (Noviembre)

    // Estado del Trámite
    estatusTramite: text("estatus_tramite").notNull().default("BORRADOR"), // BORRADOR, EN_REVISION, ENVIADO, RECHAZADO, PAGADO

    // Datos Financieros
    montoSolicitado: real("monto_solicitado").default(0),
    montoAutorizado: real("monto_autorizado").default(0),

    // Auditoría
    fechaCreacion: integer("fecha_creacion", { mode: 'timestamp_ms' })
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
    fechaActualizacion: integer("fecha_actualizacion", { mode: 'timestamp_ms' })
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),

    observaciones: text("observaciones"),
});
