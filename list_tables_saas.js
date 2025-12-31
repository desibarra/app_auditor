const db = require('better-sqlite3')('saas_fiscal.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
for (const table of tables) {
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
    console.log(`Table: ${table.name}`);
    console.log(`Columns: ${columns.map(c => c.name).join(', ')}`);
}
