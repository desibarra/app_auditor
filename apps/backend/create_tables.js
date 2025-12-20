const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../saas_fiscal.db');
const db = new Database(dbPath);

console.log('Creating tables...');

try {
    // Crear tabla estados_cuenta
    db.exec(`
        CREATE TABLE IF NOT EXISTS estados_cuenta (
            id TEXT PRIMARY KEY,
            empresa_id TEXT NOT NULL,
            banco TEXT NOT NULL,
            cuenta TEXT NOT NULL,
            anio INTEGER NOT NULL,
            mes INTEGER NOT NULL,
            archivo_path TEXT,
            saldo_inicial REAL DEFAULT 0,
            saldo_final REAL DEFAULT 0,
            moneda TEXT DEFAULT 'MXN',
            fecha_carga INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
        )
    `);

    // Crear tabla movimientos_bancarios
    db.exec(`
        CREATE TABLE IF NOT EXISTS movimientos_bancarios (
            id TEXT PRIMARY KEY,
            estado_cuenta_id TEXT NOT NULL,
            fecha TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            referencia TEXT,
            monto REAL NOT NULL,
            tipo TEXT NOT NULL,
            cfdi_uuid TEXT,
            conciliado INTEGER DEFAULT 0,
            metadatos TEXT
        )
    `);

    console.log('✅ Tables created successfully');
    db.close();
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
