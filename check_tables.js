
const Database = require('better-sqlite3');
const dbPath = 'c:\\Users\\desib\\Documents\\app_auditor\\apps\\backend\\data\\dev.db';
const db = new Database(dbPath);

console.log('Tables:');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables);

console.log('Empresas content:');
try {
    const rows = db.prepare("SELECT * FROM empresas").all();
    console.log(JSON.stringify(rows, null, 2));
} catch (e) {
    console.log('Error querying empresas:', e.message);
}
