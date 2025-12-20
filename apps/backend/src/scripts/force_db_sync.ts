import Database from 'better-sqlite3';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const dbPathRaw = process.env.DATABASE_PATH || './data/dev.db';
const dbPath = path.resolve(process.cwd(), dbPathRaw);

console.log('Using Database File:', dbPath);

const db = new Database(dbPath);

// SQL para estados_cuenta
const sqlEstadosCuenta = `
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
    fecha_carga INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
`;

// SQL para movimientos_bancarios
const sqlMovimientos = `
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
);
`;

// SQL para expedientes_devolucion_iva (CON RFC)
const sqlExpedientes = `
CREATE TABLE IF NOT EXISTS expedientes_devolucion_iva (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id TEXT NOT NULL,
    rfc_empresa TEXT,
    folio_control TEXT NOT NULL UNIQUE,
    ejercicio INTEGER NOT NULL,
    periodo INTEGER NOT NULL,
    estatus_tramite TEXT NOT NULL DEFAULT 'BORRADOR',
    monto_solicitado REAL DEFAULT 0,
    monto_autorizado REAL DEFAULT 0,
    fecha_creacion INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    fecha_actualizacion INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    observaciones TEXT
);
`;

const sqlCfdiRecibidos = `
CREATE TABLE IF NOT EXISTS cfdi_recibidos (
    uuid TEXT PRIMARY KEY,
    rfc_emisor TEXT NOT NULL,
    nombre_emisor TEXT NOT NULL,
    rfc_receptor TEXT NOT NULL,
    nombre_receptor TEXT NOT NULL,
    fecha_emision TEXT NOT NULL,
    total REAL NOT NULL,
    tipo_comprobante TEXT NOT NULL,
    estado_sat TEXT NOT NULL,
    xml_content TEXT,
    fecha_importacion INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
);
`;

try {
    db.exec("PRAGMA foreign_keys = OFF;"); // Disable FKs to allow Drop

    db.exec(sqlCfdiRecibidos);
    console.log('✅ Tabla cfdi_recibidos verificada.');

    db.exec(sqlEstadosCuenta);
    console.log('✅ Tabla estados_cuenta verificada.');

    db.exec(sqlMovimientos);
    console.log('✅ Tabla movimientos_bancarios verificada.');

    // DROP y CREATE para asegurar estructura correcta
    db.exec("DROP TABLE IF EXISTS expedientes_devolucion_iva");
    db.exec(sqlExpedientes);
    console.log('✅ Tabla expedientes_devolucion_iva RECREADA (con rfc_empresa).');

} catch (error) {
    console.error('❌ Error ejecutando SQL directo:', error);
}

db.close();
