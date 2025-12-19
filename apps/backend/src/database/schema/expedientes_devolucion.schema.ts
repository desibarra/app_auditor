import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { empresas } from './empresas.schema';

/**
 * Tabla de Expedientes de Devolución de IVA
 * Agrupa múltiples CFDIs para solicitar devolución ante el SAT
 */
export const expedientesDevolucionIva = sqliteTable('expedientes_devolucion_iva', {
    id: integer('id').primaryKey({ autoIncrement: true }),

    // Relación con empresa
    empresaId: text('empresa_id')
        .notNull()
        .references(() => empresas.id, { onDelete: 'cascade' }),

    // Información del expediente
    folio: text('folio').notNull().unique(), // Ej: DEV-2025-001
    nombre: text('nombre').notNull(), // Ej: "Devolución IVA - Noviembre 2025"
    descripcion: text('descripcion'), // Descripción opcional

    // Montos calculados
    montoTotalIva: text('monto_total_iva').notNull().default('0'), // Total de IVA a recuperar
    montoTotalFacturas: text('monto_total_facturas').notNull().default('0'), // Total de facturas
    cantidadCfdis: integer('cantidad_cfdis').notNull().default(0), // Número de CFDIs incluidos

    // Estado del expediente
    estado: text('estado').notNull().default('borrador'), // borrador, enviado, en_revision, aprobado, rechazado, completado

    // Fechas
    fechaCreacion: integer('fecha_creacion', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    fechaEnvio: integer('fecha_envio', { mode: 'timestamp_ms' }),
    fechaRespuesta: integer('fecha_respuesta', { mode: 'timestamp_ms' }),
    fechaCompletado: integer('fecha_completado', { mode: 'timestamp_ms' }),

    // Metadatos
    observaciones: text('observaciones'), // Notas internas
    respuestaSat: text('respuesta_sat'), // Respuesta del SAT
    archivoSolicitud: text('archivo_solicitud'), // Ruta del PDF generado

    // Auditoría
    creadoPor: text('creado_por'), // Usuario que creó el expediente
    modificadoPor: text('modificado_por'), // Último usuario que modificó
    fechaModificacion: integer('fecha_modificacion', { mode: 'timestamp_ms' }).defaultNow(),
});

/**
 * Tabla de relación muchos a muchos entre Expedientes y CFDIs
 */
export const expedienteCfdi = sqliteTable('expediente_cfdi', {
    id: integer('id').primaryKey({ autoIncrement: true }),

    // Relaciones
    expedienteId: integer('expediente_id')
        .notNull()
        .references(() => expedientesDevolucionIva.id, { onDelete: 'cascade' }),

    cfdiUuid: text('cfdi_uuid').notNull(), // UUID del CFDI

    // Metadatos de la relación
    ivaAcreditable: text('iva_acreditable').notNull(), // IVA de este CFDI específico
    fechaAgregado: integer('fecha_agregado', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    agregadoPor: text('agregado_por'), // Usuario que agregó este CFDI
});
