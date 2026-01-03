
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/dev_clean.db');
const db = new Database(dbPath);

const report = {};

// 1. Check Empresas
report.empresas = db.prepare('SELECT id, rfc, razon_social FROM empresas').all();

if (report.empresas.length > 0) {
    const empresa = report.empresas[0];
    report.activeEmpresa = empresa;

    // 2. Dates
    report.dates = db.prepare(`SELECT uuid, fecha, strftime('%Y-%m', fecha) as mes_calc FROM cfdi_recibidos WHERE empresa_id = ? LIMIT 50`).all(empresa.id);

    // 3. Stats
    report.emitted = db.prepare(`
        SELECT COUNT(*) as count, SUM(total) as total 
        FROM cfdi_recibidos 
        WHERE empresa_id = ? AND emisor_rfc = ?
    `).get(empresa.id, empresa.rfc);

    report.received = db.prepare(`
        SELECT COUNT(*) as count, SUM(total) as total 
        FROM cfdi_recibidos 
        WHERE empresa_id = ? AND receptor_rfc = ?
    `).get(empresa.id, empresa.rfc);

    // 4. Orphans
    report.orphans = db.prepare(`
        SELECT COUNT(*) as count, emisor_rfc, receptor_rfc 
        FROM cfdi_recibidos 
        WHERE empresa_id = ? 
        AND emisor_rfc != ? 
        AND receptor_rfc != ?
        GROUP BY emisor_rfc, receptor_rfc
    `).all(empresa.id, empresa.rfc, empresa.rfc);

    // 5. Years
    report.years = db.prepare(`
        SELECT DISTINCT strftime('%Y', fecha) as year, COUNT(*) as count 
        FROM cfdi_recibidos 
        WHERE empresa_id = ? 
        GROUP BY year
    `).all(empresa.id);
}

fs.writeFileSync(path.join(__dirname, 'audit_result_detailed.json'), JSON.stringify(report, null, 2));
console.log('Report saved to audit_result_detailed.json');
