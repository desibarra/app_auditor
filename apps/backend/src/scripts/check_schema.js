const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');

try {
    const db = new Database(dbPath, { readonly: true });

    // Get table schema
    const schema = db.prepare(`PRAGMA table_info(cfdi_recibidos)`).all();

    console.log('Columns in cfdi_recibidos:');
    schema.forEach(col => {
        console.log(`  ${col.name} (${col.type})`);
    });

    db.close();
} catch (error) {
    console.error('Error:', error.message);
}
