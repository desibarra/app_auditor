const Database = require('better-sqlite3');
const path = require('path');

const dbs = [
    'apps/backend/data/dev_clean.db',
    'apps/backend/dev.db',
    'saas_fiscal.db'
];

dbs.forEach(dbPath => {
    try {
        const fullPath = path.join(process.cwd(), dbPath);
        const db = new Database(fullPath);
        console.log(`\n--- Inspecting: ${dbPath} ---`);

        // Check if empresas table exists
        const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='empresas'").get();
        if (!tableCheck) {
            console.log('No empresas table found.');
            return;
        }

        const empresas = db.prepare("SELECT id, rfc, razon_social, activa FROM empresas WHERE razon_social LIKE '%KOPPARA%' OR rfc LIKE '%KOPPARA%'").all();
        console.log(`Found ${empresas.length} matches:`);
        console.log(JSON.stringify(empresas, null, 2));
    } catch (err) {
        console.log(`Error reading ${dbPath}: ${err.message}`);
    }
});
