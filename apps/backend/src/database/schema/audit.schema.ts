import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * TABLA DE AUDITORÍA SAT-GRADE
 * =============================
 * Propósito: Trazabilidad total para defensa fiscal y auditoría SAT
 * Retención: Mínimo 5 años (Art. 30 CFF)
 * 
 * Esta tabla registra TODOS los eventos críticos del sistema:
 * - Cargas de archivos
 * - Validaciones RFC
 * - Relocalizaciones automáticas
 * - Rechazos
 * - Modificaciones de datos
 * - Accesos a información sensible
 */

export const auditLogs = sqliteTable('audit_logs', {
    // Identificador único del evento
    id: text('id').primaryKey(),

    // Timestamp preciso (ISO 8601)
    timestamp: integer('timestamp', { mode: 'timestamp_ms' })
        .notNull()
        .default(sql`(unixepoch() * 1000)`),

    // Identificación del usuario
    usuarioId: text('usuario_id'), // Puede ser null si es proceso automático
    usuarioEmail: text('usuario_email'),
    usuarioNombre: text('usuario_nombre'),

    // Contexto empresarial
    empresaIdSolicitada: text('empresa_id_solicitada'),
    empresaIdDetectada: text('empresa_id_detectada'),
    empresaIdFinal: text('empresa_id_final'), // Empresa donde finalmente se guardó el dato

    // Datos del RFC validado
    rfcDetectado: text('rfc_detectado'),
    rfcEsperado: text('rfc_esperado'),

    // Acción ejecutada
    accion: text('accion').notNull(), // ALLOW, REJECT, RELOCATE, CREATE, UPDATE, DELETE, ACCESS
    proceso: text('proceso').notNull(), // cfdi/importar, bancos/upload, etc.
    resultado: text('resultado').notNull(), // SUCCESS, FAILED, PARTIAL

    // Detalles del evento
    razon: text('razon'), // Por qué se tomó la acción
    errorMensaje: text('error_mensaje'), // Si hubo error
    errorStack: text('error_stack'), // Stack trace para debugging

    // Datos técnicos
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metodo: text('metodo'), // GET, POST, etc.
    ruta: text('ruta'), // /api/cfdi/importar-xml

    // Payload resumido (NO datos sensibles completos)
    payloadResumen: text('payload_resumen'), // JSON con datos clave
    archivoNombre: text('archivo_nombre'),
    archivoTamano: integer('archivo_tamano'),
    archivoTipo: text('archivo_tipo'),

    // Datos de cambio (para UPDATE/DELETE)
    entidadTipo: text('entidad_tipo'), // cfdi, banco, evidencia
    entidadId: text('entidad_id'), // UUID del registro afectado
    valorAnterior: text('valor_anterior'), // JSON del estado previo
    valorNuevo: text('valor_nuevo'), // JSON del nuevo estado

    // Nivel de severidad para alertas
    severidad: text('severidad').notNull().default('INFO'), // INFO, WARNING, ERROR, CRITICAL

    // Periodo fiscal afectado
    periodoFiscal: text('periodo_fiscal'), // YYYY-MM

    // Flags de compliance
    requiereAtencion: integer('requiere_atencion', { mode: 'boolean' }).default(false),
    revisado: integer('revisado', { mode: 'boolean' }).default(false),
    revisadoPor: text('revisado_por'),
    revisadoFecha: integer('revisado_fecha', { mode: 'timestamp_ms' }),

    // Metadatos
    agente: text('agente').default('SYSTEM'), // USER, SYSTEM, CRON, API
    version: text('version'), // Versión del sistema
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NuevoAuditLog = typeof auditLogs.$inferInsert;

/**
 * TABLA DE EVENTOS DE SEGURIDAD
 * ==============================
 * Para tracking de intentos sospechosos o anómalos
 */
export const securityEvents = sqliteTable('security_events', {
    id: text('id').primaryKey(),
    timestamp: integer('timestamp', { mode: 'timestamp_ms' })
        .notNull()
        .default(sql`(unixepoch() * 1000)`),

    // Tipo de evento
    eventoTipo: text('evento_tipo').notNull(), // CROSS_EMPRESA_ATTEMPT, INVALID_RFC, UNAUTHORIZED_ACCESS

    // Usuario sospechoso
    usuarioId: text('usuario_id'),
    ipAddress: text('ip_address').notNull(),

    // Detalles
    descripcion: text('descripcion').notNull(),
    payload: text('payload'), // JSON

    // Nivel de amenaza
    nivelAmenaza: text('nivel_amenaza').notNull(), // LOW, MEDIUM, HIGH, CRITICAL

    // Estado
    bloqueado: integer('bloqueado', { mode: 'boolean' }).default(false),
    investigado: integer('investigado', { mode: 'boolean' }).default(false),
});

export type SecurityEvent = typeof securityEvents.$inferSelect;
export type NuevoSecurityEvent = typeof securityEvents.$inferInsert;
