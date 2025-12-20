const Database = require('better-sqlite3');
const db = new Database('data/dev.db');

console.log('--- TVA FORENSE ---');
const tva = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos WHERE (emisor_rfc = 'TVA060209QL6' OR receptor_rfc = 'TVA060209QL6') AND fecha LIKE '2025-11%'").get();
console.log('TVA_Noviembre_Total=' + tva.c);
