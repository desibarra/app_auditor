import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';
import { empresas } from './empresas.schema';

/**
 * ⚖️ ESQUEMA FISCAL BLINDADO - PREVENCIÓN DESTRUCCIÓN DE EVIDENCIA
 * ==================================================================
 * 
 * 🚨 CRÍTICO: FOREIGN KEYS CON RESTRICT (NO CASCADE)
 * 
 * JUSTIFICACIÓN LEGAL:
 * - Código Fiscal de la Federación (CFF) Art. 30: 
 *   "Los contribuyentes tienen la obligación de conservar la contabilidad 
 *    y los comprobantes de origen de sus asientos por un plazo de CINCO AÑOS"
 * 
 * - Criterio SAT: La destrucción de evidencia fiscal es DELITO
 * - Sanciones: Multas de $15,000 a $30,000 MXN + responsabilidad penal
 * 
 * ON DELETE RESTRICT = Si intentas eliminar una empresa con CFDIs,
 *                      LA BASE DE DATOS RECHAZA LA OPERACIÓN
 *                      → Previene destrucción accidental o maliciosa
 * 
 * ON UPDATE RESTRICT = Si intentas cambiar el ID de una empresa,
 *                      LA BASE DE DATOS RECHAZA LA OPERACIÓN
 *                      → Previene pérdida de trazabilidad
 * 
 * ✅ Para eliminar una empresa PRIMERO debes:
 *    1. Exportar y archivar todos los CFDIs
 *    2. Exportar auditoría completa
 *    3. Eliminar manualmente los registros hijos
 *    4. Entonces eliminar la empresa
 *    → Este proceso FUERZA la preservación de evidencia
 */

export const cfdiRecibidosBlindado = sqliteTable("cfdi_recibidos", {
    // Identificador único del CFDI (UUID del SAT)
    uuid: text("uuid").primaryKey(),

    // ========================================
    // RELACIÓN EMPRESARIAL INQUEBRANTABLE
    // RESTRICT: Previene destrucción de evidencia fiscal
    // ========================================
    empresaId: text("empresa_id")
        .notNull()
        .references(() => empresas.id, {
            onDelete: 'restrict',  // 🛡️ CRÍTICO: Previene eliminación accidental
            onUpdate: 'restrict',  // 🛡️ CRÍTICO: Previene pérdida de trazabilidad
        }),

    // Periodo fiscal (OBLIGATORIO para auditoría)
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

    // Tipo de Comprobante (I=Ingreso, E=Egreso, P=Pago, N=Nómina, T=Traslado)
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

    // XML Original (almacenado como texto - EVIDENCIA PRIMARIA)
    xmlOriginal: text("xml_original").notNull(),

    // Estado SAT
    estadoSat: text("estado_sat").default("Vigente"),
    fechaValidacionSat: integer("fecha_validacion_sat", { mode: 'timestamp_ms' }),
    fechaCancelacion: integer("fecha_cancelacion", { mode: 'timestamp_ms' }),

    // Metadatos de trazabilidad
    fechaImportacion: integer("fecha_importacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),
    fechaActualizacion: integer("fecha_actualizacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),
    importadoPor: text("importado_por"), // Usuario ID

    // Flags de procesamiento
    procesado: integer("procesado", { mode: 'boolean' }).default(false),
    tieneErrores: integer("tiene_errores", { mode: 'boolean' }).default(false),
    mensajeError: text("mensaje_error"),

    // Validación RFC-First
    rfcValidado: integer("rfc_validado", { mode: 'boolean' }).default(false),
    empresaDetectadaAutomaticamente: integer("empresa_detectada_automaticamente", { mode: 'boolean' }).default(false),

}, (table) => ({
    // ÍNDICES ESTRATÉGICOS para queries de auditoría rápidas
    idxEmpresaPeriodo: index("idx_cfdi_empresa_periodo").on(table.empresaId, table.periodoFiscal),
    idxReceptorRfc: index("idx_cfdi_receptor_rfc").on(table.receptorRfc),
    idxEmisorRfc: index("idx_cfdi_emisor_rfc").on(table.emisorRfc),
    idxFecha: index("idx_cfdi_fecha").on(table.fecha),
    idxEstadoSat: index("idx_cfdi_estado_sat").on(table.estadoSat),
    idxTipoComprobante: index("idx_cfdi_tipo").on(table.tipoComprobante),
}));

/**
 * TABLA DE MOVIMIENTOS BANCARIOS BLINDADA
 */
export const movimientosBancariosBlindado = sqliteTable("movimientos_bancarios", {
    id: text("id").primaryKey(),

    // ========================================
    // RELACIÓN EMPRESARIAL - RESTRICT
    // Previene eliminación de empresas con movimientos bancarios registrados
    // ========================================
    empresaId: text("empresa_id")
        .notNull()
        .references(() => empresas.id, {
            onDelete: 'restrict',  // 🛡️ Protege evidencia bancaria
            onUpdate: 'restrict',
        }),

    // Periodo fiscal
    periodoFiscal: text("periodo_fiscal").notNull(), // YYYY-MM

    // Identificación del banco
    banco: text("banco").notNull(), // BanBajío, BBVA, Santander, etc.
    numeroCuenta: text("numero_cuenta").notNull(),

    // 🆕 CONFIDENCE SCORE - Defensa bancaria
    bancoDetectado: text("banco_detectado").notNull(), // Banco identificado automáticamente
    parserUtilizado: text("parser_utilizado").notNull(), // BanBajio, BBVA, Santander, Generic
    confidenceScore: integer("confidence_score").notNull(), // 0-100

    // Flag de origen no confiable
    origenNoConfiable: integer("origen_no_confiable", { mode: 'boolean' }).default(false),

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
    cfdiUuidConciliado: text("cfdi_uuid_conciliado")
        .references(() => cfdiRecibidosBlindado.uuid, {
            onDelete: 'restrict',  // 🛡️ No permitir eliminar CFDI si está conciliado
        }),

    // Metadatos
    fechaImportacion: integer("fecha_importacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),
    importadoDe: text("importado_de"), // Nombre del archivo origen
    importadoPor: text("importado_por"), // Usuario ID

}, (table) => ({
    idxEmpresaPeriodo: index("idx_banco_empresa_periodo").on(table.empresaId, table.periodoFiscal),
    idxFecha: index("idx_banco_fecha").on(table.fecha),
    idxConciliado: index("idx_banco_conciliado").on(table.conciliado),
    idxCuenta: index("idx_banco_cuenta").on(table.numeroCuenta),
    idxConfidence: index("idx_banco_confidence").on(table.confidenceScore),
}));

/**
 * TABLA DE EVIDENCIAS BLINDADA
 */
export const evidenciasBlindado = sqliteTable("evidencias", {
    id: text("id").primaryKey(),

    // ========================================
    // RELACIÓN EMPRESARIAL - RESTRICT
    // ========================================
    empresaId: text("empresa_id")
        .notNull()
        .references(() => empresas.id, {
            onDelete: 'restrict',  // 🛡️ Evidencias son PERMANENTES
            onUpdate: 'restrict',
        }),

    // Relación con CFDI (puede ser null si es evidencia general)
    cfdiUuid: text("cfdi_uuid")
        .references(() => cfdiRecibidosBlindado.uuid, {
            onDelete: 'restrict',  // 🛡️ No eliminar CFDI si tiene evidencias
        }),

    // Tipo de evidencia
    tipo: text("tipo").notNull(), // FACTURA_PROVEEDOR, CONTRATO, COMPROBANTE_PAGO, etc.

    // Archivo
    nombreArchivo: text("nombre_archivo").notNull(),
    rutaArchivo: text("ruta_archivo").notNull(),
    tipoMime: text("tipo_mime").notNull(),
    tamanoBytes: integer("tamano_bytes").notNull(),

    // Hash del archivo para integridad
    hashArchivo: text("hash_archivo"), // SHA256 del contenido

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
 * 🔒 TABLA DE AUDITORÍA INMUTABLE
 * 
 * CRÍTICO: Esta tabla NO tiene foreign keys con RESTRICT
 * Los logs de auditoría DEBEN sobrevivir incluso si se eliminan empresas
 * (aunque empresas no deberían eliminarse nunca por RESTRICT en otras tablas)
 */
export const auditLogsInmutable = sqliteTable("audit_logs", {
    id: text("id").primaryKey(),

    // Timestamp preciso
    timestamp: integer("timestamp", { mode: 'timestamp_ms' })
        .notNull()
        .default(sql`(unixepoch() * 1000)`),

    // 🆕 INMUTABILIDAD REAL
    hashEvento: text("hash_evento").notNull(), // SHA256(payload + empresaId + timestamp)
    esInmutable: integer("es_inmutable", { mode: 'boolean' }).notNull().default(true),

    // Usuario
    usuarioId: text("usuario_id"),
    usuarioEmail: text("usuario_email"),
    usuarioNombre: text("usuario_nombre"),

    // Contexto empresarial (SIN foreign key - debe sobrevivir)
    empresaIdSolicitada: text("empresa_id_solicitada"),
    empresaIdDetectada: text("empresa_id_detectada"),
    empresaIdFinal: text("empresa_id_final"),

    // 🆕 RFC Detectado (para validación)
    rfcEmisorDetectado: text("rfc_emisor_detectado"),
    rfcReceptorDetectado: text("rfc_receptor_detectado"),
    decision: text("decision"), // accept, relocate, reject

    // Acción
    accion: text("accion").notNull(),
    proceso: text("proceso").notNull(),
    resultado: text("resultado").notNull(),

    // Detalles
    razon: text("razon"),
    errorMensaje: text("error_mensaje"),
    errorStack: text("error_stack"),

    // Técnico
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metodo: text("metodo"),
    ruta: text("ruta"),

    // Payload
    payloadResumen: text("payload_resumen"),
    archivoNombre: text("archivo_nombre"),
    archivoTamano: integer("archivo_tamano"),
    archivoTipo: text("archivo_tipo"),

    // Cambios
    entidadTipo: text("entidad_tipo"),
    entidadId: text("entidad_id"),
    valorAnterior: text("valor_anterior"),
    valorNuevo: text("valor_nuevo"),

    // Severidad
    severidad: text("severidad").notNull().default('INFO'),
    periodoFiscal: text("periodo_fiscal"),

    // Flags
    requiereAtencion: integer("requiere_atencion", { mode: 'boolean' }).default(false),
    revisado: integer("revisado", { mode: 'boolean' }).default(false),
    revisadoPor: text("revisado_por"),
    revisadoFecha: integer("revisado_fecha", { mode: 'timestamp_ms' }),

    // Metadatos
    agente: text("agente").default('SYSTEM'),
    version: text("version"),
}, (table) => ({
    // Índices para queries de auditoría
    idxTimestamp: index("idx_audit_timestamp").on(table.timestamp),
    idxEmpresa: index("idx_audit_empresa").on(table.empresaIdFinal),
    idxAccion: index("idx_audit_accion").on(table.accion),
    idxSeveridad: index("idx_audit_severidad").on(table.severidad),
    idxHash: index("idx_audit_hash").on(table.hashEvento), // Para validación de integridad
}));

export type CfdiRecibido = typeof cfdiRecibidosBlindado.$inferSelect;
export type NuevoCfdiRecibido = typeof cfdiRecibidosBlindado.$inferInsert;
export type MovimientoBancario = typeof movimientosBancariosBlindado.$inferSelect;
export type NuevoMovimientoBancario = typeof movimientosBancariosBlindado.$inferInsert;
export type Evidencia = typeof evidenciasBlindado.$inferSelect;
export type NuevaEvidencia = typeof evidenciasBlindado.$inferInsert;
export type AuditLogInmutable = typeof auditLogsInmutable.$inferSelect;
export type NuevoAuditLog = typeof auditLogsInmutable.$inferInsert;
