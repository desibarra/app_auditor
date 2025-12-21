const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Try candidates
const candidates = [
    'apps/backend/sqlite.db',
    'apps/backend/data/dev.db',
    'saas_fiscal.db'
];

candidates.forEach(dbPath => {
    if (fs.existsSync(dbPath)) {
        console.log(`\nChecking DB: ${dbPath}`);
        try {
            const db = new Database(dbPath, { readonly: true });
            // Check if table 'empresas' exists
            const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='empresas'").get();
            if (table) {
                const rows = db.prepare("SELECT razon_social, rfc FROM empresas").all();
                console.log("--- EMPRESAS FOUND ---");
                rows.forEach(r => console.log(`[${r.rfc}] ${r.razon_social}`));
            } else {
                console.log("Table 'empresas' not found.");
            }
        } catch (e) {
            console.log("Error reading DB:", e.message);
        }
    }
});
