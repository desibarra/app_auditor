import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Tabla: estados_cuenta
 * Almacena la cabecera de los estados de cuenta bancarios cargados.
 */
export const estadosCuenta = sqliteTable("estados_cuenta", {
    id: text("id").primaryKey(), // UUID generado
    empresaId: text("empresa_id").notNull(),
    banco: text("banco").notNull(), // Santander, BBVA, Banbajío, etc.
    cuenta: text("cuenta").notNull(), // Últimos 4 dígitos o alias
    anio: integer("anio").notNull(),
    mes: integer("mes").notNull(),
    archivoPath: text("archivo_path"), // Ruta al PDF/Excel original
    saldoInicial: real("saldo_inicial").default(0),
    saldoFinal: real("saldo_final").default(0),
    moneda: text("moneda").default("MXN"),

    fechaCarga: integer("fecha_carga", { mode: 'timestamp_ms' })
        .notNull()
        .default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Tabla: movimientos_bancarios
 * Almacena el detalle de cada transacción bancaria.
 * Permite la conciliación 1:1 con CFDIs.
 */
export const movimientosBancarios = sqliteTable("movimientos_bancarios", {
    id: text("id").primaryKey(), // UUID generado
    estadoCuentaId: text("estado_cuenta_id").notNull(), // FK implícita a estados_cuenta

    fecha: text("fecha").notNull(), // YYYY-MM-DD
    descripcion: text("descripcion").notNull(), // Concepto del banco
    referencia: text("referencia"), // Folio, Autorización, etc.

    monto: real("monto").notNull(), // Valor absoluto o con signo (definir criterio)
    tipo: text("tipo").notNull(), // 'CARGO' (Salida) o 'ABONO' (Entrada)

    // --- Conciliación ---
    cfdiUuid: text("cfdi_uuid"), // FK implícita a cfdi_recibidos.uuid
    conciliado: integer("conciliado", { mode: 'boolean' }).default(false),

    metadatos: text("metadatos"), // JSON para info extra si se parsea
});
