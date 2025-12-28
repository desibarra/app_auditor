// Script para agregar columna last_update a empresas
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../backend/data.db');

// Verificar que el archivo existe
if (!fs.existsSync(dbPath)) {
    console.error('❌ Base de datos no encontrada:', dbPath);
    process.exit(1);
}

console.log('📂 Base de datos:', dbPath);

try {
    // Abrir base de datos en modo WAL para permitir lecturas concurrentes
    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');

    console.log('🔄 Verificando estructura actual...');

    // Verificar si la columna ya existe
    const tableInfo = db.prepare("PRAGMA table_info(empresas)").all();
    console.log('📋 Columnas actuales:', tableInfo.map(c => c.name).join(', '));

    const columnExists = tableInfo.some(col => col.name === 'last_update');

    if (columnExists) {
        console.log('✅ La columna last_update ya existe.');
    } else {
        console.log('➕ Agregando columna last_update...');
        db.prepare('ALTER TABLE empresas ADD COLUMN last_update INTEGER').run();
        console.log('✅ Columna last_update agregada exitosamente.');
    }

    // Verificar resultado
    const newTableInfo = db.prepare("PRAGMA table_info(empresas)").all();
    console.log('📋 Columnas finales:', newTableInfo.map(c => c.name).join(', '));

    db.close();
    console.log('✅ Migración completada.');
    process.exit(0);
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('💡 Sugerencia: Asegúrate de que el backend esté detenido');
    process.exit(1);
}
