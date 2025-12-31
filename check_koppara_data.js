const Database = require('better-sqlite3');
const path = require('path');

const dbPath = 'apps/backend/data/dev_clean.db';
const fullPath = path.join(process.cwd(), dbPath);
const db = new Database(fullPath);

const empresaId = 'empresa-pnk140311qm2';

console.log(`--- Checking CFDIs for ${empresaId} ---`);

try {
    const count = db.prepare("SELECT COUNT(*) as total FROM cfdis WHERE empresa_id = ?").get();
    console.log(`Total CFDIs: ${count.total}`);

    if (count.total > 0) {
        const sample = db.prepare("SELECT uuid, fecha, rfc_emisor, rfc_receptor, total FROM cfdis WHERE empresa_id = ? LIMIT 5").all();
        console.log("Sample CFDIs:");
        console.log(JSON.stringify(sample, null, 2));
    }
} catch (err) {
    console.log(`Error checking cfdis: ${err.message}`);
}

try {
    const stats = db.prepare("SELECT * FROM empresas WHERE id = ?").get();
    console.log("\nEmpresa Details:");
    console.log(JSON.stringify(stats, null, 2));
} catch (err) {
    console.log(`Error checking empresa: ${err.message}`);
}
