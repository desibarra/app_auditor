// Script de migración para agregar columna last_update
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../backend/data.db');
const db = new Database(dbPath);

try {
    console.log('🔄 Iniciando migración: Agregar columna last_update...');

    // Verificar si la columna ya existe
    const tableInfo = db.prepare("PRAGMA table_info(empresas)").all();
    const columnExists = tableInfo.some(col => col.name === 'last_update');

    if (columnExists) {
        console.log('✅ La columna last_update ya existe. No se requiere migración.');
    } else {
        // Agregar la columna
        db.prepare('ALTER TABLE empresas ADD COLUMN last_update INTEGER').run();
        console.log('✅ Columna last_update agregada exitosamente.');
    }

    db.close();
    console.log('✅ Migración completada.');
} catch (error) {
    console.error('❌ Error en migración:', error);
    db.close();
    process.exit(1);
}
