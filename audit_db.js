const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'apps', 'backend', 'data', 'dev.db');
const db = new Database(dbPath, { readonly: true });

console.log('--- AUDITORÍA TÉCNICA DE INTEGRIDAD ---');

try {
    console.log('Verificando Integridad...');
    const integrity = db.prepare("PRAGMA integrity_check").all();
    console.log('Integrity Check:', integrity);

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tablas detectadas:', tables.map(t => t.name).join(', '));

    // Si llegamos aquí, intentamos el conteo
    const table = 'cfdi_recibidos';
    const duplicates = db.prepare(`SELECT uuid, COUNT(*) as count FROM ${table} GROUP BY uuid HAVING count > 1`).all();
    console.log(`Duplicados en ${table}:`, duplicates.length);

} catch (e) {
    console.error('DIAGNÓSTICO AUDITORÍA:', e.message);
    if (e.message.includes('malformed')) {
        console.log('DICTAMEN: CORRUPCIÓN ESTRUCTURAL DETECTADA EN audit_logs');
    }
}
db.close();
process.exit(0);
