const Database = require('better-sqlite3');
const { join } = require('path');

const DB_PATH = join(__dirname, '../../data/dev.db');

console.log(`📂 Base de datos: ${DB_PATH}\n`);

const db = new Database(DB_PATH, { readonly: true });

try {
    // Ver empresas
    console.log('🏢 Empresas:');
    const empresas = db.prepare('SELECT * FROM empresas').all();
    empresas.forEach(e => {
        console.log(`   - ${e.razon_social}`);
        console.log(`     RFC: ${e.rfc}`);
        console.log(`     ID: ${e.id}\n`);
    });

    // Ver CFDIs por empresa
    console.log('📄 CFDIs por empresa:');
    const cfdisCount = db.prepare(`
        SELECT empresa_id, COUNT(*) as total 
        FROM cfdi_recibidos 
        GROUP BY empresa_id
    `).all();

    cfdisCount.forEach(c => {
        const empresa = empresas.find(e => e.id === c.empresa_id);
        console.log(`   ${empresa ? empresa.razon_social : c.empresa_id}: ${c.total} CFDIs`);
    });

} catch (error) {
    console.error('Error:', error.message);
} finally {
    db.close();
}
