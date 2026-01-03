const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');

try {
    const db = new Database(dbPath);
    console.log('🧹 SANEAMIENTO DE DATOS - SENTINEL');

    // 1. Corregir objeto_imp NULL
    const nulls = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos WHERE objeto_imp IS NULL").get().c;

    if (nulls > 0) {
        console.log(`\n⚠️  Encontrados ${nulls} registros con objeto_imp NULL.`);
        const info = db.prepare("UPDATE cfdi_recibidos SET objeto_imp = '01' WHERE objeto_imp IS NULL").run();
        console.log(`✅ Corregidos: ${info.changes} registros.`);
    } else {
        console.log('\n✅ No hay nulos en objeto_imp.');
    }

    // 2. Corregir estatus_fiscal NULL -> PENDING
    const statusNull = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos WHERE estatus_fiscal IS NULL").get().c;
    if (statusNull > 0) {
        console.log(`\n⚠️  Encontrados ${statusNull} registros con estatus_fiscal NULL.`);
        const info = db.prepare("UPDATE cfdi_recibidos SET estatus_fiscal = 'PENDING' WHERE estatus_fiscal IS NULL").run();
        console.log(`✅ Corregidos: ${info.changes} registros.`);
    }

    db.close();
} catch (e) {
    console.error('Error:', e.message);
}
