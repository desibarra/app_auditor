import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const empresas = sqliteTable('empresas', {
    id: text('id').primaryKey(),
    rfc: text('rfc').notNull().unique(),
    razonSocial: text('razon_social').notNull(),
    regimenFiscal: text('regimen_fiscal'),
    sector: text('sector'),
    configuracion: text('configuracion'), // JSON: Umbrales, Preferencias

    // Control SAT y Seguridad (STRICT TYPES)
    // Modes:
    // NONE: Sin interacción
    // RFC_ONLY: Consulta pública limitada (sin credenciales)
    // CIEC: Autenticación básica (Legacy)
    // FIEL: Autenticación fuerte (e.firma)
    satAuthMode: text('sat_auth_mode').notNull().default('NONE'),

    // Status:
    // DISCONNECTED: Modo inicial o reset
    // CONFIGURED: Credenciales cargadas pero no probadas
    // ACTIVE: Conexión probada y exitosa
    // ERROR: Fallo de autenticación
    satStatus: text('sat_status').notNull().default('DISCONNECTED'),

    lastSatSyncAt: integer('last_sat_sync_at', { mode: 'timestamp_ms' }),

    // Credenciales (Encriptadas) - Infraestructura pasiva
    ciecEncrypted: text('ciec_encrypted'),
    fielKeyEncrypted: text('fiel_key_encrypted'),
    fielCerEncrypted: text('fiel_cer_encrypted'),
    fielPassEncrypted: text('fiel_pass_encrypted'),

    fechaAlta: integer('fecha_alta', { mode: 'timestamp_ms' }).notNull().default(sql`(unixepoch() * 1000)`),
    activa: integer('activa', { mode: 'boolean' }).notNull().default(true),
});

export type Empresa = typeof empresas.$inferSelect;
export type NuevaEmpresa = typeof empresas.$inferInsert;
