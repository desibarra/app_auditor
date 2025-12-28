import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

/**
 * Tabla: cfdi_relaciones
 * Almacena las relaciones entre CFDIs, específicamente para Complementos de Pago (CRP)
 * y Notas de Crédito/Débito.
 * 
 * Esencial para el reporte "Pagos y Complementos SAT".
 */
export const cfdiRelaciones = sqliteTable("cfdi_relaciones", {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // CFDI Padre (El Complemento de Pago / Nota de Crédito)
    cfdiPadreUuid: text("cfdi_padre_uuid").notNull(),

    // CFDI Hijo/Relacionado (La Factura PPD que se está pagando/afectando)
    cfdiHijoUuid: text("cfdi_hijo_uuid").notNull(),

    // Tipo de Relación (Standard SAT: '04'=Sustitución, 'XX'=PagoCRP)
    // Para pagos usamos 'PAGO'
    tipoRelacion: text("tipo_relacion").notNull(),

    // Datos Específicos de Pagos (DoctoRelacionado)
    impSaldoAnt: real("imp_saldo_ant"),     // Saldo anterior
    impPagado: real("imp_pagado"),          // Importe pagado
    impSaldoInsoluto: real("imp_saldo_insoluto"), // Saldo insoluto
    numParcialidad: integer("num_parcialidad"), // 1, 2, 3...

    // Metadatos
    empresaId: text("empresa_id").notNull(),
    fechaRegistro: integer("fecha_registro", { mode: 'timestamp_ms' }).defaultNow().notNull(),
});
