const Database = require('better-sqlite3');
const db = new Database('data/dev.db');

console.log('--- FECHA FORMAT CHECK ---');
const f = db.prepare("SELECT fecha, typeof(fecha) as t FROM cfdi_recibidos LIMIT 1").get();
console.log('Fecha_Sample=' + JSON.stringify(f));
