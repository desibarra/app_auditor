const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');

try {
    const db = new Database(dbPath, { readonly: true });

    // Get all tables
    const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        ORDER BY name
    `).all();

    console.log('All tables in database:');
    tables.forEach(t => console.log(`  - ${t.name}`));

    db.close();
} catch (error) {
    console.error('Error:', error.message);
}
