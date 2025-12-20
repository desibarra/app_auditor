const Database = require('better-sqlite3');
const db = new Database('data/dev.db');

console.log('--- TVA ROLES & TIPOS ---');

const emitidos = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos WHERE emisor_rfc = 'TVA060209QL6' AND fecha LIKE '2025-11%'").get();
console.log(`TVA_Nov_Emitidos=${emitidos.c}`);

if (emitidos.c > 0) {
    const tipos = db.prepare("SELECT tipo_comprobante, COUNT(*) as c FROM cfdi_recibidos WHERE emisor_rfc = 'TVA060209QL6' AND fecha LIKE '2025-11%' GROUP BY tipo_comprobante").all();
    console.log('Emitidos_Tipos=' + JSON.stringify(tipos));
}

const recibidos = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos WHERE receptor_rfc = 'TVA060209QL6' AND fecha LIKE '2025-11%'").get();
console.log(`TVA_Nov_Recibidos=${recibidos.c}`);

if (recibidos.c > 0) {
    const tipos = db.prepare("SELECT tipo_comprobante, COUNT(*) as c FROM cfdi_recibidos WHERE receptor_rfc = 'TVA060209QL6' AND fecha LIKE '2025-11%' GROUP BY tipo_comprobante").all();
    console.log('Recibidos_Tipos=' + JSON.stringify(tipos));
}
