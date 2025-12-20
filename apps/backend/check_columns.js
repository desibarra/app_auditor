const Database = require('better-sqlite3');
const db = new Database('data/dev.db');

const cols = db.prepare("PRAGMA table_info(cfdi_recibidos)").all();
console.log(JSON.stringify(cols.map(c => c.name)));
