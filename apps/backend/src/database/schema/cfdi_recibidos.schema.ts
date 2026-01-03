import { sqliteTable, integer, text, real, primaryKey } from "drizzle-orm/sqlite-core";

/**
 * Tabla: cfdi_recibidos
 * Versión: v2.0 (Soporte Auditoría Viva)
 */
export const cfdiRecibidos = sqliteTable("cfdi_recibidos", {
    // Identificador único compuesto
    uuid: text("uuid").notNull(),
    empresaId: text("empresa_id").notNull(),

    // Datos del Emisor
    emisorRfc: text("emisor_rfc").notNull(),
    emisorNombre: text("emisor_nombre").notNull(),
    emisorRegimenFiscal: text("emisor_regimen_fiscal"),

    // Datos del Receptor
    receptorRfc: text("receptor_rfc").notNull(),
    receptorNombre: text("receptor_nombre").notNull(),
    receptorUsoCfdi: text("receptor_uso_cfdi"),
    receptorDomicilioFiscal: text("receptor_domicilio_fiscal"),

    // Datos del Comprobante
    serie: text("serie"),
    folio: text("folio"),
    fecha: text("fecha").notNull(), // ISO 8601 de emisión
    fechaTimbrado: text("fecha_timbrado"),

    // Tipo de Comprobante (I, E, P, N, T)
    tipoComprobante: text("tipo_comprobante").notNull(),

    // Ejercicio
    ejercicioFiscal: integer("ejercicio_fiscal"),
    versionCfdi: text("version_cfdi"),

    // Montos
    subtotal: real("subtotal").notNull(),
    descuento: real("descuento").default(0),
    total: real("total").notNull(),
    moneda: text("moneda").default("MXN").notNull(),
    tipoCambio: real("tipo_cambio").default(1),

    // Pago
    formaPago: text("forma_pago"),
    metodoPago: text("metodo_pago"),
    condicionesPago: text("condiciones_pago"),
    lugarExpedicion: text("lugar_expedicion"),

    // XML Raw
    xmlOriginal: text("xml_original"),
    xmlHash: text("xml_hash"),

    // --- INFRAESTRUCTURA DE AUDITORÍA VIVA (NUEVO) ---

    // Estado Legal del CFDI
    estatusFiscal: text("estatus_fiscal").notNull().default("PENDING"), // 'PENDING' | 'VIGENTE' | 'CANCELADO'

    // Fuente de la Verdad (Quién validó este estatus)
    // Fuente de la Verdad (Quién validó este estatus)
    estatusFuente: text("estatus_fuente").notNull().default("MANUAL"), // 'MANUAL' | 'RFC_ONLY' | 'SAT_REAL'

    // CLASIFICACIÓN FISCAL ESTRICTA (Hard-Assignment at Import)
    rol: text("rol"), // 'EMITIDO' | 'RECIBIDO'

    // Momento de la última verificación técnica
    lastCheckedAt: integer("last_checked_at", { mode: 'timestamp_ms' }),

    // Datos históricos SAT (Legacy mapping)
    fechaCancelacion: integer("fecha_cancelacion", { mode: 'timestamp_ms' }),

    // Metadatos Internos
    fechaImportacion: integer("fecha_importacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),
    fechaActualizacion: integer("fecha_actualizacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),

    procesado: integer("procesado", { mode: 'boolean' }).default(false),
    tieneErrores: integer("tiene_errores", { mode: 'boolean' }).default(false),
    mensajeError: text("mensaje_error"),

    // Nuevos campos
    objetoImp: text("objeto_imp"),
    tieneRepAsociado: integer("tiene_rep_asociado", { mode: 'boolean' }).default(false),
    repUuid: text("rep_uuid"),
    hallazgosDetectados: integer("hallazgos_detectados").default(0),
    requiereRevalidacion: integer("requiere_revalidacion", { mode: 'boolean' }).default(false),
}, (table) => ({
    pk: primaryKey({ columns: [table.uuid, table.empresaId] })
}));
