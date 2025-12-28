// Script para agregar columnas faltantes a la base de datos
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/dev.db');
const db = new Database(dbPath);

try {
    console.log('🔧 Agregando columnas faltantes...');

    // Verificar si las columnas ya existen
    const tableInfo = db.prepare("PRAGMA table_info(cfdi_recibidos)").all();
    const columnNames = tableInfo.map(col => col.name);

    if (!columnNames.includes('ejercicio_fiscal')) {
        console.log('➕ Agregando columna ejercicio_fiscal...');
        db.prepare('ALTER TABLE cfdi_recibidos ADD COLUMN ejercicio_fiscal INTEGER').run();
        console.log('✅ Columna ejercicio_fiscal agregada');
    } else {
        console.log('ℹ️  Columna ejercicio_fiscal ya existe');
    }

    if (!columnNames.includes('version_cfdi')) {
        console.log('➕ Agregando columna version_cfdi...');
        db.prepare('ALTER TABLE cfdi_recibidos ADD COLUMN version_cfdi TEXT').run();
        console.log('✅ Columna version_cfdi agregada');
    } else {
        console.log('ℹ️  Columna version_cfdi ya existe');
    }

    console.log('✨ Migración completada exitosamente');

} catch (error) {
    console.error('❌ Error durante la migración:', error.message);
    process.exit(1);
} finally {
    db.close();
}
