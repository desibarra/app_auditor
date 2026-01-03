const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');
console.log('🔧 Migrando:', dbPath);
console.log('📋 Agregando columna objeto_imp a cfdi_recibidos\n');

try {
    const db = new Database(dbPath);

    // Verificar si ya existe (idempotencia)
    const schema = db.prepare(`PRAGMA table_info(cfdi_recibidos)`).all();
    const exists = schema.find(col => col.name === 'objeto_imp');

    if (exists) {
        console.log('✓ La columna objeto_imp ya existe. No se requiere migración.');
        db.close();
        process.exit(0);
    }

    console.log('1️⃣ Agregando columna objeto_imp...');

    // Agregar columna con valor por defecto '01' (Sí objeto de impuesto)
    // Valores válidos según CFDI 4.0: '01' | '02' | '03' | '04'
    db.exec(`
        ALTER TABLE cfdi_recibidos
        ADD COLUMN objeto_imp TEXT DEFAULT '01'
    `);

    console.log('   ✓ Columna agregada exitosamente');

    // Verificar
    const schemaAfter = db.prepare(`PRAGMA table_info(cfdi_recibidos)`).all();
    const added = schemaAfter.find(col => col.name === 'objeto_imp');

    if (added) {
        console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
        console.log(`   Columna: ${added.name}`);
        console.log(`   Tipo: ${added.type}`);
        console.log(`   Default: ${added.dflt_value}`);

        // Contar registros existentes
        const count = db.prepare('SELECT COUNT(*) as total FROM cfdi_recibidos').get();
        console.log(`\n📊 ${count.total} CFDIs existentes ahora tienen objeto_imp = '01' por defecto`);
    } else {
        console.error('\n❌ ERROR: La columna no se agregó correctamente');
        process.exit(1);
    }

    db.close();

    console.log('\n🎯 SIGUIENTE PASO: Reintentar la carga de XMLs');
    console.log('   Los XMLs ahora deberían importarse sin errores');

} catch (error) {
    console.error('\n💥 ERROR EN MIGRACIÓN:', error.message);
    console.error(error);
    process.exit(1);
}
