const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'apps/backend/data/production_manual.db');
console.log('Creando DB manual:', dbPath);

const db = new Database(dbPath);

// Crear SOLO la tabla empresas sin pasar por Drizzle
db.exec(`
    CREATE TABLE IF NOT EXISTS empresas (
        id TEXT PRIMARY KEY,
        rfc TEXT NOT NULL UNIQUE,
        razon_social TEXT NOT NULL,
        regimen_fiscal TEXT,
        sector TEXT,
        configuracion TEXT,
        sat_auth_mode TEXT NOT NULL DEFAULT 'NONE',
        sat_status TEXT NOT NULL DEFAULT 'DISCONNECTED',
        last_sat_sync_at INTEGER,
        ciec_encrypted TEXT,
        fiel_key_encrypted TEXT,
        fiel_cer_encrypted TEXT,
        fiel_pass_encrypted TEXT,
        fecha_alta INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
        activa INTEGER NOT NULL DEFAULT 1
    );
`);

console.log('✅ Tabla empresas creada');

// Verificar
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tablas:', tables.map(t => t.name));

db.close();
