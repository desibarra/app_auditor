import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

/**
 * Tabla: hallazgos_discrepancias
 * Versión: v1.0
 */
export const hallazgosDiscrepancias = sqliteTable("hallazgos_discrepancias", {
    id: text("id").notNull(),
    codigoError: text("codigo_error").notNull(),
    nivelSeveridad: text("nivel_severidad").notNull(),
    cfdiUuid: text("cfdi_uuid").notNull(),
    cfdiObjetoImp: text("cfdi_objeto_imp"),
    cfdiXmlHash: text("cfdi_xml_hash"),
    repUuid: text("rep_uuid"),
    repObjetoImpDR: text("rep_objeto_imp_dr"),
    repXmlHash: text("rep_xml_hash"),
    tipoDiscrepancia: text("tipo_discrepancia"),
    descripcionDiscrepancia: text("descripcion_discrepancia"),
    estadoHallazgo: text("estado_hallazgo").notNull().default("detectado"),
    detectadoPor: text("detectado_por").default("sistema_audit"),
    revisadoPor: text("revisado_por"),
    fechaRevision: integer("fecha_revision", { mode: 'timestamp_ms' }),
    scoreImpact: integer("score_impact").default(-15),
    impacto: text("impacto"),
    normativaAplicable: text("normativa_aplicable"),
}, (table) => ({
    pk: primaryKey({ columns: [table.id] }),
}));