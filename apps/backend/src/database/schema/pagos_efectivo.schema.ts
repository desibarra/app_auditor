import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { cfdiRecibidos } from "./cfdi_recibidos.schema";

/**
 * Tabla: pagos_efectivo
 * Registra los pagos efectivamente realizados vinculados a CFDIs
 * Especificación: GAP-005 del Análisis de Brechas
 * 
 * Propósito: Validar que el IVA acreditable corresponde a operaciones
 * donde efectivamente hubo erogación de recursos (requisito SAT)
 */
export const pagosEfectivo = sqliteTable("pagos_efectivo", {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // Relación con CFDI
    cfdiUuid: text("cfdi_uuid")
        .references(() => cfdiRecibidos.uuid, { onDelete: 'cascade' })
        .notNull(),

    // Datos del Pago
    fechaPago: text("fecha_pago").notNull(), // ISO 8601: YYYY-MM-DD
    montoPagado: real("monto_pagado").notNull(),

    // Método de Pago (según catálogo SAT)
    metodoPago: text("metodo_pago").notNull(), // '02'=Cheque, '03'=Transferencia, '04'=Tarjeta, etc.
    metodoPagoNombre: text("metodo_pago_nombre"), // Desnormalizado: 'Transferencia', 'Cheque', etc.

    // Referencia Bancaria
    referenciaBancaria: text("referencia_bancaria"),
    cuentaOrigen: text("cuenta_origen"), // Últimos 4 dígitos
    cuentaDestino: text("cuenta_destino"), // Últimos 4 dígitos
    bancoOrigen: text("banco_origen"),
    bancoDestino: text("banco_destino"),

    // Estado de Conciliación
    estadoConciliacion: text("estado_conciliacion").default("Pendiente").notNull(),
    // 'Pendiente' | 'Conciliado' | 'Rechazado'

    fechaConciliacion: integer("fecha_conciliacion", { mode: 'timestamp_ms' }),
    conciliadoPor: text("conciliado_por"), // usuario_id

    // Archivo de Comprobante (Estado de cuenta, recibo, etc.)
    archivoComprobante: text("archivo_comprobante"), // S3 key
    tipoComprobante: text("tipo_comprobante"), // 'Estado de cuenta', 'Recibo bancario', etc.

    // Notas
    notas: text("notas"),

    // Relación con Empresa
    empresaId: text("empresa_id").notNull(),

    // Metadatos
    fechaRegistro: integer("fecha_registro", { mode: 'timestamp_ms' }).defaultNow().notNull(),
    fechaActualizacion: integer("fecha_actualizacion", { mode: 'timestamp_ms' }).defaultNow().notNull(),
    registradoPor: text("registrado_por"), // usuario_id

    // Flags de validación
    validado: integer("validado", { mode: 'boolean' }).default(false),
    requiereRevision: integer("requiere_revision", { mode: 'boolean' }).default(false),
    motivoRevision: text("motivo_revision"),
});

/**
 * Reglas de Negocio:
 * 1. Un CFDI puede tener múltiples pagos (pagos parciales)
 * 2. La suma de montoPagado debe ser <= total del CFDI
 * 3. Solo pagos con estadoConciliacion='Conciliado' se consideran para IVA acreditable
 * 4. Debe existir archivoComprobante para marcar como 'Conciliado'
 */
