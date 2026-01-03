const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'sentinel.db');
console.log('DB Path:', dbPath);

try {
    const db = new Database(dbPath, { readonly: true });

    // List all tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables.map(t => t.name));

    // Check if cfdi_recibidos exists
    const cfdiTable = tables.find(t => t.name === 'cfdi_recibidos');
    if (cfdiTable) {
        // Get count
        const count = db.prepare('SELECT COUNT(*) as total FROM cfdi_recibidos').get();
        console.log('Total CFDIs:', count.total);

        // Get sample
        const sample = db.prepare('SELECT empresa_id, fecha FROM cfdi_recibidos LIMIT 5').all();
        console.log('Sample:', sample);
    } else {
        console.log('ERROR: cfdi_recibidos table not found!');
    }

    db.close();
} catch (error) {
    console.error('Error:', error.message);
}
