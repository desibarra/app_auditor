import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const usuarios = sqliteTable('usuarios', {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    nombreCompleto: text('nombre_completo').notNull(),
    rolGlobal: text('rol_global').notNull().default('usuario'),
    fechaRegistro: integer('fecha_registro', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
});

export type Usuario = typeof usuarios.$inferSelect;
export type NuevoUsuario = typeof usuarios.$inferInsert;
