import { sqliteTable, text, integer, real, primaryKey, index } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';
import { empresas } from './empresas.schema';

/**
 * ESQUEMA BLINDADO DE CFDIS
 * ==========================
 * Versión reforzada con:
 * - Foreign Keys estrictos
 * - Índices por empresaId + periodo
 * - Constraints de integridad
 * - No permite huérfanos
 */

export const cfdiRecibidosReforzado = sqliteTable("cfdi_recibidos", {
    // Identificador único del CFDI (UUID del SAT)
    uuid: text("uuid").primaryKey(),

    // ========================================
    // RELACIÓN EMPRESARIAL INQUEBRANTABLE
    // ========================================
    empresaId: text("empresa_id")
        .notNull()
        .references(() => empresas.id, {
            onDelete: 'cascade',  // Si se elimina empresa, se eliminan sus CFDIs
            onUpdate: 'cascade',  // Si cambia ID empresa, actualiza en cascada
        }),

    // Periodo fiscal (índice compuesto para queries rápidas)
    periodoFiscal: text("periodo_fiscal").notNull(), // YYYY-MM

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
    fecha: text("fecha").notNull(), // ISO 8601
    fechaTimbrado: text("fecha_timbrado"),

    // Tipo de Comprobante
    tipoComprobante: text("tipo_comprobante").notNull(),

    // Montos
    subtotal: real("subtotal").notNull(),
    descuento: real("descuento").default(0),
    total: real("total").notNull(),
    moneda: text("moneda").default("MXN").notNull(),
    tipoCambio: real("tipo_cambio").default(1),

    // Forma y Método de Pago
    formaPago: text("forma_pago"),
    metodoPago: text("metodo_pago"),
    condicionesPago: text("condiciones_pago"),

    // Datos Fiscales
    lugarExpedicion: text("lugar_expedicion"),

    // XML Original (almacenado como texto)
    xmlOriginal: text("xml_original"),

    // Estado SAT
    estadoSat: text("estado_sat").default("Vigente"),
    fechaValidacionSat: integer("fecha_validacion_sat", { mode: 'timestamp_ms' }),
    fechaCancelacion: integer("fecha_cancelacion", { mode: 'timestamp_ms' }),

    // Metadatos
    fechaImportacion: integer("fecha_importacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),
    fechaActualizacion: integer("fecha_actualizacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),

    // Flags de procesamiento
    procesado: integer("procesado", { mode: 'boolean' }).default(false),
    tieneErrores: integer("tiene_errores", { mode: 'boolean' }).default(false),
    mensajeError: text("mensaje_error"),
}, (table) => ({
    // ========================================
    // ÍNDICES ESTRATÉGICOS
    // ========================================
    // Índice compuesto para queries por empresa y periodo (crítico para dashboard)
    idxEmpresaPeriodo: index("idx_cfdi_empresa_periodo").on(table.empresaId, table.periodoFiscal),

    // Índice para búsqueda rápida por RFC
    idxReceptorRfc: index("idx_cfdi_receptor_rfc").on(table.receptorRfc),

    // Índice por fecha para ordenamiento
    idxFecha: index("idx_cfdi_fecha").on(table.fecha),

    // Índice para validación SAT
    idxEstadoSat: index("idx_cfdi_estado_sat").on(table.estadoSat),
}));

/**
 * TABLA DE MOVIMIENTOS BANCARIOS REFORZADA
 */
export const movimientosBancariosReforzado = sqliteTable("movimientos_bancarios", {
    id: text("id").primaryKey(),

    // ========================================
    // RELACIÓN EMPRESARIAL INQUEBRANTABLE
    // ========================================
    empresaId: text("empresa_id")
        .notNull()
        .references(() => empresas.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),

    // Periodo fiscal
    periodoFiscal: text("periodo_fiscal").notNull(), // YYYY-MM

    // Identificación del banco
    banco: text("banco").notNull(), // BanBajío, BBVA, Santander, etc.
    numeroCuenta: text("numero_cuenta").notNull(),

    // Datos del movimiento
    fecha: text("fecha").notNull(),
    concepto: text("concepto").notNull(),
    cargo: real("cargo").default(0).notNull(),
    abono: real("abono").default(0).notNull(),
    saldo: real("saldo").notNull(),
    referencia: text("referencia"),

    // Clasificación
    tipoMovimiento: text("tipo_movimiento"), // DEPOSITO, RETIRO, TRANSFERENCIA, COMISION

    // Conciliación
    conciliado: integer("conciliado", { mode: 'boolean' }).default(false),
    cfdiUuidConciliado: text("cfdi_uuid_conciliado"),

    // Metadatos
    fechaImportacion: integer("fecha_importacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),
    importadoDe: text("importado_de"), // Nombre del archivo origen

}, (table) => ({
    // Índices
    idxEmpresaPeriodo: index("idx_banco_empresa_periodo").on(table.empresaId, table.periodoFiscal),
    idxFecha: index("idx_banco_fecha").on(table.fecha),
    idxConciliado: index("idx_banco_conciliado").on(table.conciliado),
    idxCuenta: index("idx_banco_cuenta").on(table.numeroCuenta),
}));

/**
 * TABLA DE EVIDENCIAS REFORZADA
 */
export const evidenciasReforzado = sqliteTable("evidencias", {
    id: text("id").primaryKey(),

    // ========================================
    // RELACIÓN EMPRESARIAL INQUEBRANTABLE
    // ========================================
    empresaId: text("empresa_id")
        .notNull()
        .references(() => empresas.id, {
            onDelete: 'cascade',
            onUpdate: 'cascade',
        }),

    // Relación con CFDI (puede ser null si es evidencia general)
    cfdiUuid: text("cfdi_uuid")
        .references(() => cfdiRecibidosReforzado.uuid, {
            onDelete: 'cascade',
        }),

    // Tipo de evidencia
    tipo: text("tipo").notNull(), // FACTURA_PROVEEDOR, CONTRATO, COMPROBANTE_PAGO, etc.

    // Archivo
    nombreArchivo: text("nombre_archivo").notNull(),
    rutaArchivo: text("ruta_archivo").notNull(),
    tipoMime: text("tipo_mime").notNull(),
    tamanoBytes: integer("tamano_bytes").notNull(),

    // Metadata
    descripcion: text("descripcion"),
    fechaDocumento: text("fecha_documento"),
    periodoFiscal: text("periodo_fiscal"),

    // Control
    fechaSubida: integer("fecha_subida", { mode: 'timestamp_ms' }).defaultNow().notNull(),
    subidoPor: text("subido_por"), // Usuario ID

}, (table) => ({
    idxEmpresa: index("idx_evidencias_empresa").on(table.empresaId),
    idxCfdi: index("idx_evidencias_cfdi").on(table.cfdiUuid),
    idxPeriodo: index("idx_evidencias_periodo").on(table.periodoFiscal),
}));

/**
 * RELACIONES DRIZZLE (Para queries con joins)
 */
export const empresasRelations = relations(empresas, ({ many }) => ({
    cfdis: many(cfdiRecibidosReforzado),
    movimientosBancarios: many(movimientosBancariosReforzado),
    evidencias: many(evidenciasReforzado),
}));

export const cfdiRelations = relations(cfdiRecibidosReforzado, ({ one, many }) => ({
    empresa: one(empresas, {
        fields: [cfdiRecibidosReforzado.empresaId],
        references: [empresas.id],
    }),
    evidencias: many(evidenciasReforzado),
}));
