const sqlite = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'apps/backend/data/dev_clean.db');
console.log('Checking database at:', dbPath);
const db = new sqlite(dbPath);
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(JSON.stringify(tables, null, 2));
db.close();
