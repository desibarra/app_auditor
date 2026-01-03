const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');
console.log('DB Path:', dbPath);

try {
    const db = new Database(dbPath, { readonly: true });

    const empresaId = '1767074265037';

    // Check total CFDIs for this empresa
    const total = db.prepare(`
        SELECT COUNT(*) as total
        FROM cfdi_recibidos
        WHERE empresa_id = ?
    `).get(empresaId);

    console.log(`Total CFDIs for empresa ${empresaId}: ${total.total}`);

    // Check by rol
    const byRol = db.prepare(`
        SELECT rol, COUNT(*) as total
        FROM cfdi_recibidos
        WHERE empresa_id = ?
        GROUP BY rol
    `).all(empresaId);

    console.log('\nBy ROL:');
    byRol.forEach(r => console.log(`  ${r.rol}: ${r.total}`));

    // Check by tipo_comprobante
    const byTipo = db.prepare(`
        SELECT tipo_comprobante, COUNT(*) as total
        FROM cfdi_recibidos
        WHERE empresa_id = ?
        GROUP BY tipo_comprobante
    `).all(empresaId);

    console.log('\nBy TIPO:');
    byTipo.forEach(t => console.log(`  ${t.tipo_comprobante}: ${t.total}`));

    // Check by year-month
    const byPeriod = db.prepare(`
        SELECT strftime('%Y-%m', fecha) as periodo, COUNT(*) as total
        FROM cfdi_recibidos
        WHERE empresa_id = ?
        GROUP BY periodo
        ORDER BY periodo DESC
        LIMIT 12
    `).all(empresaId);

    console.log('\nBy PERIOD (last 12):');
    byPeriod.forEach(p => console.log(`  ${p.periodo}: ${p.total}`));

    db.close();
} catch (error) {
    console.error('Error:', error.message);
}
