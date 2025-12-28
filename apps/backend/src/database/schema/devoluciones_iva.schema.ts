import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { empresas } from './empresas.schema';

/**
 * Entidad: devoluciones_iva
 * Almacena trámites oficiales de devolución de IVA vinculados a informes de defensa.
 */
export const devolucionesIva = sqliteTable('devoluciones_iva', {
    id: integer('id').primaryKey({ autoIncrement: true }),

    // Relación con Empresa
    empresaId: text('empresa_id')
        .notNull()
        .references(() => empresas.id, { onDelete: 'cascade' }),

    // Periodo (YYYY-MM)
    periodo: text('periodo').notNull(),

    // Monto del Trámite
    saldoFavor: real('saldo_favor').notNull(),

    // Hash de integridad del Informe SAT-GRADE
    informeHash: text('informe_hash').notNull(),

    // Estado oficial del trámite
    // BORRADOR: Creado pero no subido al SAT
    // PRESENTADO: Con acuse de recibo del SAT
    // REQUERIDO: El SAT solicita información adicional
    // AUTORIZADO: Saldo autorizado para devolución/compensación
    // NEGADO: Trámite rechazado por el SAT
    estado: text('estado').notNull().default('BORRADOR'),

    // Vínculos Forenses (Almacenados como JSON text)
    uuidsCfdi: text('uuids_cfdi'),           // Array de UUIDs de ingresos/gastos
    uuidsComplementos: text('uuids_complementos'), // Array de UUIDs de pagos

    // Metadatos
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().defaultNow(),
});
