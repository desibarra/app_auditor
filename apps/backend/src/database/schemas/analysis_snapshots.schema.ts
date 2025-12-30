import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const analysisSnapshots = sqliteTable('analysis_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  empresaId: text('empresa_id').notNull(),
  periodo: text('periodo').notNull(),
  scoreTotal: integer('score_total').notNull(),
  penalizaciones: text('penalizaciones').notNull(), // JSON string
  kpis: text('kpis').notNull(), // JSON string
  timestampFinalizacion: integer('timestamp_finalizacion').notNull(),
  versionMotorAnalisis: text('version_motor_analisis').notNull(),
  analysisEventId: text('analysis_event_id').notNull(),
});