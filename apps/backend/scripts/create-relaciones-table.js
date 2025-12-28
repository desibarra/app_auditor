// Script para crear la tabla cfdi_relaciones si no existe
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/dev.db');
const db = new Database(dbPath);

try {
    console.log('🔧 Verificando tabla cfdi_relaciones...\n');

    // Verificar si la tabla existe
    const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='cfdi_relaciones'
    `).get();

    if (tableExists) {
        console.log('✅ La tabla cfdi_relaciones ya existe');

        // Mostrar estructura
        const structure = db.prepare('PRAGMA table_info(cfdi_relaciones)').all();
        console.log('\n📋 Estructura de la tabla:');
        structure.forEach(col => {
            console.log(`   - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}`);
        });
    } else {
        console.log('⚠️  La tabla cfdi_relaciones NO existe');
        console.log('📝 Creando tabla...\n');

        db.prepare(`
            CREATE TABLE cfdi_relaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cfdi_padre_uuid TEXT NOT NULL,
                cfdi_hijo_uuid TEXT NOT NULL,
                tipo_relacion TEXT NOT NULL,
                imp_saldo_ant REAL,
                imp_pagado REAL,
                imp_saldo_insoluto REAL,
                num_parcialidad INTEGER,
                empresa_id TEXT NOT NULL,
                fecha_registro INTEGER DEFAULT (strftime('%s', 'now') * 1000)
            )
        `).run();

        console.log('✅ Tabla cfdi_relaciones creada exitosamente');

        // Crear índices
        db.prepare('CREATE INDEX idx_cfdi_relaciones_padre ON cfdi_relaciones(cfdi_padre_uuid)').run();
        db.prepare('CREATE INDEX idx_cfdi_relaciones_hijo ON cfdi_relaciones(cfdi_hijo_uuid)').run();
        db.prepare('CREATE INDEX idx_cfdi_relaciones_empresa ON cfdi_relaciones(empresa_id)').run();

        console.log('✅ Índices creados');
    }

    console.log('\n✨ Verificación completada');

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
} finally {
    db.close();
}
