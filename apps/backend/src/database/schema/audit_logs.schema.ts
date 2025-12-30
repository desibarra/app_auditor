import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const auditLogs = sqliteTable('audit_logs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    empresaId: text('empresa_id'),
    usuarioId: text('usuario_id'),
    accion: text('accion').notNull(),
    entidad: text('entidad'),
    entidadId: text('entidad_id'),
    detalles: text('detalles'), // JSON string
    ip: text('ip'),
    userAgent: text('user_agent'),
    fecha: integer('fecha', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NuevoAuditLog = typeof auditLogs.$inferInsert;
