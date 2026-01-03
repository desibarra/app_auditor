const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');
console.log('Migrando:', dbPath);

try {
    const db = new Database(dbPath);

    console.log('\n1. Agregando columna ROL...');
    db.exec(`ALTER TABLE cfdi_recibidos ADD COLUMN rol TEXT`);
    console.log('   ✓ Columna agregada');

    console.log('\n2. Obteniendo RFC de empresas...');
    const empresas = db.prepare(`SELECT id, rfc FROM empresas`).all();
    console.log(`   Encontradas ${empresas.length} empresas`);

    console.log('\n3. Calculando ROL para cada CFDI...');
    let updated = 0;

    for (const empresa of empresas) {
        const result = db.prepare(`
            UPDATE cfdi_recibidos
            SET rol = CASE
                WHEN emisor_rfc = ? THEN 'EMITIDO'
                WHEN receptor_rfc = ? THEN 'RECIBIDO'
                ELSE 'INDEFINIDO'
            END
            WHERE empresa_id = ?
        `).run(empresa.rfc, empresa.rfc, empresa.id);

        updated += result.changes;
        console.log(`   ${empresa.rfc}: ${result.changes} CFDIs actualizados`);
    }

    console.log(`\n✓ Total actualizado: ${updated} CFDIs`);

    // Verificar resultado
    const stats = db.prepare(`
        SELECT rol, COUNT(*) as total
        FROM cfdi_recibidos
        GROUP BY rol
    `).all();

    console.log('\nDistribución final:');
    stats.forEach(s => console.log(`  ${s.rol}: ${s.total}`));

    db.close();
    console.log('\n✓ Migración completada exitosamente');

} catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
}
