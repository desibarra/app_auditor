import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { empresas } from './empresas.schema';
import { usuarios } from './usuarios.schema';

export const empresaUsuarioRol = sqliteTable(
    'empresa_usuario_rol', // Renamed table to use underscores
    {
        empresaId: text('empresa_id') // Renamed column to use underscores
            .notNull()
            .references(() => empresas.id, { onDelete: 'cascade' }),
        usuarioId: text('usuario_id') // Renamed column to use underscores
            .notNull()
            .references(() => usuarios.id, { onDelete: 'cascade' }),
        rol: text('rol').notNull(),
        fechaAsignacion: integer('fecha_asignacion', { mode: 'timestamp_ms' }).notNull().default(new Date()),
    },
    (table) => ({
        pk: primaryKey(table.empresaId, table.usuarioId),
    }),
);

export type EmpresaUsuarioRol = typeof empresaUsuarioRol.$inferSelect;
export type NuevaEmpresaUsuarioRol = typeof empresaUsuarioRol.$inferInsert;
