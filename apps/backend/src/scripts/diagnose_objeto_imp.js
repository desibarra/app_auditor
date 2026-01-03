const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');
console.log('DB Path:', dbPath);

try {
    const db = new Database(dbPath, { readonly: true });

    // Verificar estructura de cfdi_recibidos
    console.log('=== ESTRUCTURA DE cfdi_recibidos ===\n');
    const schema = db.prepare(`PRAGMA table_info(cfdi_recibidos)`).all();

    schema.forEach(col => {
        console.log(`${col.name.padEnd(30)} | ${col.type.padEnd(10)} | NULL: ${col.notnull === 0 ? 'YES' : 'NO'} | Default: ${col.dflt_value || 'NULL'}`);
    });

    // Buscar columnas relacionadas con objeto_imp
    console.log('\n=== COLUMNAS RELACIONADAS CON "objeto" ===\n');
    const objetoColumns = schema.filter(col => col.name.toLowerCase().includes('objeto'));

    if (objetoColumns.length > 0) {
        objetoColumns.forEach(col => {
            console.log(`✓ Encontrada: ${col.name} (${col.type})`);
        });
    } else {
        console.log('❌ NO se encontró ninguna columna con "objeto" en el nombre');
    }

    // Verificar si existe objeto_imp específicamente
    const objetoImp = schema.find(col => col.name === 'objeto_imp');
    console.log('\n=== VERIFICACIÓN ESPECÍFICA ===\n');
    console.log(`objeto_imp existe: ${objetoImp ? '✓ SÍ' : '❌ NO'}`);

    if (!objetoImp) {
        console.log('\n⚠️  DIAGNÓSTICO: La columna objeto_imp NO EXISTE en la tabla cfdi_recibidos');
        console.log('    Esto explica el error "no such column: objeto_imp"');
        console.log('    SOLUCIÓN: Ejecutar migración para agregar la columna');
    }

    db.close();
} catch (error) {
    console.error('Error:', error.message);
}
