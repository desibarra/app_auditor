const Database = require('better-sqlite3');
const path = require('path');

const mes = process.argv[2] || 11; // Default noviembre
const anio = process.argv[3] || 2025;

const dbPath = path.join(__dirname, 'data', 'dev.db');
const db = new Database(dbPath);

console.log(`\n🗑️  Eliminando periodo ${mes}/${anio}...\n`);

try {
    // Eliminar movimientos
    const delMovs = db.prepare(`
        DELETE FROM movimientos_bancarios 
        WHERE estado_cuenta_id IN (
            SELECT id FROM estados_cuenta 
            WHERE empresa_id = ? AND anio = ? AND mes = ?
        )
    `);
    const movsDeleted = delMovs.run('empresa-pnk140311qm2', anio, mes);
    console.log(`✅ ${movsDeleted.changes} movimientos eliminados`);

    // Eliminar estados de cuenta
    const delEstados = db.prepare(`
        DELETE FROM estados_cuenta 
        WHERE empresa_id = ? AND anio = ? AND mes = ?
    `);
    const estadosDeleted = delEstados.run('empresa-pnk140311qm2', anio, mes);
    console.log(`✅ ${estadosDeleted.changes} estados de cuenta eliminados`);

    db.close();
    console.log(`\n✅ Periodo ${mes}/${anio} limpio\n`);

} catch (error) {
    console.error('❌', error.message);
    db.close();
}
