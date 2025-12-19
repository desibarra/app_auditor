import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

/**
 * Tabla: cfdi_recibidos
 * Almacena los CFDI recibidos parseados desde XML
 * Especificación: GAP-001 del Análisis de Brechas
 */
export const cfdiRecibidos = sqliteTable("cfdi_recibidos", {
    // Identificador único del CFDI (UUID del SAT)
    uuid: text("uuid").primaryKey(),

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
    fecha: text("fecha").notNull(), // ISO 8601: YYYY-MM-DDTHH:mm:ss
    fechaTimbrado: text("fecha_timbrado"), // ISO 8601

    // Tipo de Comprobante (I=Ingreso, E=Egreso, P=Pago, N=Nómina, T=Traslado)
    tipoComprobante: text("tipo_comprobante").notNull(),

    // Montos
    subtotal: real("subtotal").notNull(),
    descuento: real("descuento").default(0),
    total: real("total").notNull(),
    moneda: text("moneda").default("MXN").notNull(),
    tipoCambio: real("tipo_cambio").default(1),

    // Forma y Método de Pago
    formaPago: text("forma_pago"), // 01=Efectivo, 02=Cheque, 03=Transferencia, etc.
    metodoPago: text("metodo_pago"), // PUE=Pago en una exhibición, PPD=Pago en parcialidades
    condicionesPago: text("condiciones_pago"),

    // Datos Fiscales
    lugarExpedicion: text("lugar_expedicion"),

    // XML Original (almacenado como texto)
    xmlOriginal: text("xml_original"),

    // Estado SAT
    estadoSat: text("estado_sat").default("Vigente"), // Vigente, Cancelado
    fechaValidacionSat: integer("fecha_validacion_sat", { mode: 'timestamp_ms' }),
    fechaCancelacion: integer("fecha_cancelacion", { mode: 'timestamp_ms' }),

    // Relación con Empresa
    empresaId: text("empresa_id").notNull(),

    // Metadatos
    fechaImportacion: integer("fecha_importacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),
    fechaActualizacion: integer("fecha_actualizacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),

    // Flags de procesamiento
    procesado: integer("procesado", { mode: 'boolean' }).default(false),
    tieneErrores: integer("tiene_errores", { mode: 'boolean' }).default(false),
    mensajeError: text("mensaje_error"),
});
