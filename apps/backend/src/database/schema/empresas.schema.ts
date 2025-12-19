import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const empresas = sqliteTable('empresas', {
    id: text('id').primaryKey(),
    rfc: text('rfc').notNull().unique(),
    razonSocial: text('razon_social').notNull(),
    regimenFiscal: text('regimen_fiscal'),
    sector: text('sector'),
    configuracion: text('configuracion'), // JSON stored as text
    fechaAlta: integer('fecha_alta', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    activa: integer('activa', { mode: 'boolean' }).notNull().default(true),
});

export type Empresa = typeof empresas.$inferSelect;
export type NuevaEmpresa = typeof empresas.$inferInsert;
