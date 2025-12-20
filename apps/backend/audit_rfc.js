const Database = require('better-sqlite3');
const db = new Database('data/dev.db');

console.log('--- RFC AUDIT ---');
const rfcs = db.prepare("SELECT emisor_rfc, COUNT(*) as c FROM cfdi_recibidos WHERE fecha LIKE '2025-11%' GROUP BY emisor_rfc ORDER BY c DESC LIMIT 5").all();
console.log('TopEmisores_Nov=' + JSON.stringify(rfcs));

const receptores = db.prepare("SELECT receptor_rfc, COUNT(*) as c FROM cfdi_recibidos WHERE fecha LIKE '2025-11%' GROUP BY receptor_rfc ORDER BY c DESC LIMIT 5").all();
console.log('TopReceptores_Nov=' + JSON.stringify(receptores));
