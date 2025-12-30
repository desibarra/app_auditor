const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, 'apps/backend/data/dev_clean.db');
console.log('DB Path:', dbPath);
try {
    const db = new Database(dbPath);
    console.log('Success!');
    console.log('Tables:', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
    db.close();
} catch (e) {
    console.error('Error:', e.message);
}
