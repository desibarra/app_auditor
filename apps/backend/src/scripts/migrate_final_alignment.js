const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');
console.log('🔧 MIGRACIÓN FINAL: Alineación Drizzle ↔ BD');
console.log('='.repeat(70));
console.log(`DB: ${dbPath}\n`);

try {
    const db = new Database(dbPath);

    // Verificar columnas existentes
    const schema = db.prepare(`PRAGMA table_info(cfdi_recibidos)`).all();
    const existing = schema.map(c => c.name);

    const migrations = [
        {
            name: 'tiene_rep_asociado',
            sql: 'ALTER TABLE cfdi_recibidos ADD COLUMN tiene_rep_asociado INTEGER DEFAULT 0',
            description: 'Flag para indicar si el CFDI tiene REP asociado'
        },
        {
            name: 'rep_uuid',
            sql: 'ALTER TABLE cfdi_recibidos ADD COLUMN rep_uuid TEXT',
            description: 'UUID del Complemento de Pago (REP) asociado'
        },
        {
            name: 'hallazgos_detectados',
            sql: 'ALTER TABLE cfdi_recibidos ADD COLUMN hallazgos_detectados INTEGER DEFAULT 0',
            description: 'Contador de hallazgos de auditoría'
        },
        {
            name: 'requiere_revalidacion',
            sql: 'ALTER TABLE cfdi_recibidos ADD COLUMN requiere_revalidacion INTEGER DEFAULT 0',
            description: 'Flag para marcar CFDIs que requieren revalidación'
        }
    ];

    let added = 0;
    let skipped = 0;

    console.log('📋 EJECUTANDO MIGRACIONES:\n');

    migrations.forEach((migration, index) => {
        if (existing.includes(migration.name)) {
            console.log(`${index + 1}. ⏭️  ${migration.name} - YA EXISTE`);
            skipped++;
        } else {
            try {
                db.exec(migration.sql);
                console.log(`${index + 1}. ✅ ${migration.name} - AGREGADA`);
                console.log(`   ${migration.description}`);
                added++;
            } catch (error) {
                console.error(`${index + 1}. ❌ ${migration.name} - ERROR: ${error.message}`);
            }
        }
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESULTADO:');
    console.log(`   ✅ Columnas agregadas: ${added}`);
    console.log(`   ⏭️  Columnas omitidas (ya existían): ${skipped}`);

    // Verificar resultado final
    const schemaAfter = db.prepare(`PRAGMA table_info(cfdi_recibidos)`).all();
    console.log(`   📊 Total columnas ahora: ${schemaAfter.length}`);

    // Contar registros
    const count = db.prepare('SELECT COUNT(*) as total FROM cfdi_recibidos').get();
    console.log(`   📄 CFDIs en BD: ${count.total.toLocaleString()}`);

    db.close();

    if (added > 0) {
        console.log('\n✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
        console.log('   El sistema ahora está alineado con el schema de Drizzle');
        console.log('   Los XMLs deberían importarse sin errores de columnas faltantes');
    } else {
        console.log('\n✅ NO SE REQUIRIERON CAMBIOS');
        console.log('   La base de datos ya estaba actualizada');
    }

} catch (error) {
    console.error('\n💥 ERROR CRÍTICO:', error.message);
    console.error(error);
    process.exit(1);
}
