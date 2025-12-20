const Database = require('better-sqlite3');
const db = new Database('data/dev.db');

const total = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos").get().c;
console.log('GLOBAL_Total=' + total);

const nov = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos WHERE fecha LIKE '2025-11%'").get();
console.log('NOV_2025_Total=' + nov.c);

if (nov.c > 0) {
    const tipos = db.prepare("SELECT tipo_comprobante, COUNT(*) as c FROM cfdi_recibidos WHERE fecha LIKE '2025-11%' GROUP BY tipo_comprobante").all();
    console.log('NOV_2025_Tipos=' + JSON.stringify(tipos));
}

const last = db.prepare("SELECT fecha FROM cfdi_recibidos ORDER BY fecha DESC LIMIT 5").all();
console.log('Ultimas_Fechas=' + JSON.stringify(last));
