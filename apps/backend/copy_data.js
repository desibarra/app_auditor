const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// BD origen (donde están los datos)
const sourceDb = new Database(path.join(__dirname, '../../saas_fiscal.db'));

// BD destino (la que usa el backend)
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const targetDb = new Database(path.join(dataDir, 'dev.db'));

console.log('Copiando datos...\n');

// Crear tablas en destino si no existen
targetDb.exec(`
    CREATE TABLE IF NOT EXISTS estados_cuenta (
        id TEXT PRIMARY KEY, empresa_id TEXT NOT NULL, banco TEXT NOT NULL,
        cuenta TEXT NOT NULL, anio INTEGER NOT NULL, mes INTEGER NOT NULL,
        archivo_path TEXT, saldo_inicial REAL DEFAULT 0, saldo_final REAL DEFAULT 0,
        moneda TEXT DEFAULT 'MXN', fecha_carga INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    )
`);

targetDb.exec(`
    CREATE TABLE IF NOT EXISTS movimientos_bancarios (
        id TEXT PRIMARY KEY, estado_cuenta_id TEXT NOT NULL, fecha TEXT NOT NULL,
        descripcion TEXT NOT NULL, referencia TEXT, monto REAL NOT NULL, tipo TEXT NOT NULL,
        cfdi_uuid TEXT, conciliado INTEGER DEFAULT 0, metadatos TEXT
    )
`);

// Copiar estados_cuenta
const estados = sourceDb.prepare('SELECT * FROM estados_cuenta').all();
const insertEstado = targetDb.prepare(`INSERT OR REPLACE INTO estados_cuenta VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

estados.forEach(e => {
    insertEstado.run(e.id, e.empresa_id, e.banco, e.cuenta, e.anio, e.mes, e.archivo_path, e.saldo_inicial, e.saldo_final, e.moneda, e.fecha_carga);
});

console.log(`✅ ${estados.length} estados de cuenta copiados`);

// Copiar movimientos
const movimientos = sourceDb.prepare('SELECT * FROM movimientos_bancarios').all();
const insertMov = targetDb.prepare(`INSERT OR REPLACE INTO movimientos_bancarios VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

movimientos.forEach(m => {
    insertMov.run(m.id, m.estado_cuenta_id, m.fecha, m.descripcion, m.referencia, m.monto, m.tipo, m.cfdi_uuid, m.conciliado, m.metadatos);
});

console.log(`✅ ${movimientos.length} movimientos copiados\n`);

sourceDb.close();
targetDb.close();

console.log('✅ COMPLETADO - Reinicia el backend y recarga la página\n');
