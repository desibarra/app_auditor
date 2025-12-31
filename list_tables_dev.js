const db = require('better-sqlite3')('apps/backend/dev.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables in dev.db:', tables.map(t => t.name).join(', '));
