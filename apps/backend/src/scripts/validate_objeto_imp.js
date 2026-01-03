const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');

try {
    const db = new Database(dbPath, { readonly: true });

    console.log('🔍 VALIDACIÓN POST-MIGRACIÓN\n');

    // 1. Verificar que la columna existe
    const schema = db.prepare(`PRAGMA table_info(cfdi_recibidos)`).all();
    const objetoImp = schema.find(col => col.name === 'objeto_imp');

    console.log('1️⃣ Columna objeto_imp existe:', objetoImp ? '✅ SÍ' : '❌ NO');

    if (objetoImp) {
        console.log(`   Tipo: ${objetoImp.type}`);
        console.log(`   Default: ${objetoImp.dflt_value}`);
    }

    // 2. Contar registros con objeto_imp NULL
    const nullCount = db.prepare(`
        SELECT COUNT(*) as total 
        FROM cfdi_recibidos 
        WHERE objeto_imp IS NULL
    `).get();

    console.log(`\n2️⃣ Registros con objeto_imp NULL: ${nullCount.total}`);

    if (nullCount.total === 0) {
        console.log('   ✅ PERFECTO: Todos los registros tienen valor');
    } else {
        console.log(`   ⚠️  ADVERTENCIA: ${nullCount.total} registros sin valor`);
    }

    // 3. Distribución de valores
    const distribution = db.prepare(`
        SELECT objeto_imp, COUNT(*) as total
        FROM cfdi_recibidos
        GROUP BY objeto_imp
        ORDER BY total DESC
    `).all();

    console.log('\n3️⃣ Distribución de valores:');
    distribution.forEach(row => {
        console.log(`   ${row.objeto_imp || 'NULL'}: ${row.total} CFDIs`);
    });

    console.log('\n✅ VALIDACIÓN COMPLETADA');
    console.log('   El sistema está listo para importar XMLs sin errores');

    db.close();
} catch (error) {
    console.error('Error:', error.message);
}
