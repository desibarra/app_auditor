const db = require('better-sqlite3')('apps/backend/data/dev_clean.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));

tables.forEach(t => {
    try {
        const columns = db.prepare(`PRAGMA table_info(${t.name})`).all();
        console.log(`\nTable: ${t.name}`);
        console.log('Columns:', columns.map(c => c.name).join(', '));
    } catch (e) { }
});
