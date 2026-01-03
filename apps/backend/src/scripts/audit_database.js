const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');
console.log('📊 AUDITORÍA COMPLETA DE BASE DE DATOS');
console.log('='.repeat(80));
console.log(`DB: ${dbPath}\n`);

try {
    const db = new Database(dbPath, { readonly: true });

    // 1. LISTAR TODAS LAS TABLAS
    console.log('1️⃣ INVENTARIO DE TABLAS\n');
    const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    `).all();

    console.log(`Total de tablas: ${tables.length}\n`);
    tables.forEach((t, i) => {
        const count = db.prepare(`SELECT COUNT(*) as total FROM ${t.name}`).get();
        console.log(`${String(i + 1).padStart(2)}. ${t.name.padEnd(35)} | ${count.total.toLocaleString().padStart(8)} registros`);
    });

    // 2. ESQUEMA COMPLETO DE cfdi_recibidos (TABLA CRÍTICA)
    console.log('\n' + '='.repeat(80));
    console.log('2️⃣ ESQUEMA DETALLADO: cfdi_recibidos (TABLA CRÍTICA)\n');

    const schema = db.prepare(`PRAGMA table_info(cfdi_recibidos)`).all();
    console.log(`Total de columnas: ${schema.length}\n`);
    console.log('COLUMNA'.padEnd(35) + 'TIPO'.padEnd(12) + 'NULL'.padEnd(8) + 'DEFAULT');
    console.log('-'.repeat(80));

    schema.forEach(col => {
        const nullable = col.notnull === 0 ? 'YES' : 'NO';
        const defaultVal = col.dflt_value || 'NULL';
        console.log(
            col.name.padEnd(35) +
            col.type.padEnd(12) +
            nullable.padEnd(8) +
            defaultVal
        );
    });

    // 3. DETECTAR COLUMNAS FALTANTES (COMPARAR CON CÓDIGO)
    console.log('\n' + '='.repeat(80));
    console.log('3️⃣ ANÁLISIS DE COLUMNAS CRÍTICAS\n');

    const criticalColumns = [
        'objeto_imp',           // CFDI 4.0
        'tiene_reg_asociado',   // ERROR ACTUAL
        'rol',                  // Clasificación fiscal
        'tipo_comprobante',     // I/E/N/P/T
        'estatus_fiscal',       // VIGENTE/CANCELADO
        'uuid',                 // Identificador único
        'fecha',                // Fecha de emisión
        'total',                // Monto total
        'xml_original',         // XML completo
        'xml_hash'              // Hash para duplicados
    ];

    criticalColumns.forEach(colName => {
        const exists = schema.find(c => c.name === colName);
        if (exists) {
            console.log(`✅ ${colName.padEnd(30)} | ${exists.type.padEnd(10)} | Default: ${exists.dflt_value || 'NULL'}`);
        } else {
            console.log(`❌ ${colName.padEnd(30)} | FALTA EN BD`);
        }
    });

    // 4. DETECTAR COLUMNAS DUPLICADAS O MAL NOMBRADAS
    console.log('\n' + '='.repeat(80));
    console.log('4️⃣ DETECCIÓN DE ANOMALÍAS\n');

    // Buscar columnas con nombres similares
    const columnNames = schema.map(c => c.name.toLowerCase());
    const duplicates = columnNames.filter((name, index) =>
        columnNames.indexOf(name) !== index
    );

    if (duplicates.length > 0) {
        console.log('⚠️  COLUMNAS DUPLICADAS:');
        duplicates.forEach(d => console.log(`   - ${d}`));
    } else {
        console.log('✅ No se detectaron columnas duplicadas');
    }

    // Buscar columnas con prefijos/sufijos inconsistentes
    const hasPrefix = schema.filter(c => c.name.startsWith('cfdi_'));
    const hasUnderscore = schema.filter(c => c.name.includes('_'));
    const hasCamelCase = schema.filter(c => /[a-z][A-Z]/.test(c.name));

    console.log(`\n📊 Convenciones de nombres:`);
    console.log(`   - Con prefijo 'cfdi_': ${hasPrefix.length}`);
    console.log(`   - Con snake_case: ${hasUnderscore.length}`);
    console.log(`   - Con camelCase: ${hasCamelCase.length}`);

    // 5. ÍNDICES Y CONSTRAINTS
    console.log('\n' + '='.repeat(80));
    console.log('5️⃣ ÍNDICES Y CONSTRAINTS\n');

    const indexes = db.prepare(`
        SELECT name, sql FROM sqlite_master 
        WHERE type='index' 
        AND tbl_name='cfdi_recibidos'
        AND sql IS NOT NULL
    `).all();

    if (indexes.length > 0) {
        indexes.forEach(idx => {
            console.log(`📌 ${idx.name}`);
            console.log(`   ${idx.sql}\n`);
        });
    } else {
        console.log('⚠️  No se encontraron índices en cfdi_recibidos');
    }

    // 6. ESTADÍSTICAS DE DATOS
    console.log('='.repeat(80));
    console.log('6️⃣ ESTADÍSTICAS DE DATOS\n');

    const stats = {
        total: db.prepare('SELECT COUNT(*) as n FROM cfdi_recibidos').get().n,
        conRol: db.prepare('SELECT COUNT(*) as n FROM cfdi_recibidos WHERE rol IS NOT NULL').get().n,
        conObjetoImp: db.prepare('SELECT COUNT(*) as n FROM cfdi_recibidos WHERE objeto_imp IS NOT NULL').get().n,
        vigentes: db.prepare("SELECT COUNT(*) as n FROM cfdi_recibidos WHERE UPPER(estatus_fiscal) = 'VIGENTE'").get().n,
        cancelados: db.prepare("SELECT COUNT(*) as n FROM cfdi_recibidos WHERE UPPER(estatus_fiscal) = 'CANCELADO'").get().n,
    };

    console.log(`Total CFDIs: ${stats.total.toLocaleString()}`);
    console.log(`Con ROL definido: ${stats.conRol.toLocaleString()} (${(stats.conRol / stats.total * 100).toFixed(1)}%)`);
    console.log(`Con objeto_imp: ${stats.conObjetoImp.toLocaleString()} (${(stats.conObjetoImp / stats.total * 100).toFixed(1)}%)`);
    console.log(`Vigentes: ${stats.vigentes.toLocaleString()} (${(stats.vigentes / stats.total * 100).toFixed(1)}%)`);
    console.log(`Cancelados: ${stats.cancelados.toLocaleString()} (${(stats.cancelados / stats.total * 100).toFixed(1)}%)`);

    db.close();

    console.log('\n' + '='.repeat(80));
    console.log('✅ AUDITORÍA COMPLETADA');
    console.log('='.repeat(80));

} catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
}
