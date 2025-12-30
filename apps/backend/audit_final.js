const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.resolve(__dirname, 'data/dev.db');
console.log(`🛡️ VALIDACIÓN FINAL DE DATOS: ${DB_PATH}`);

try {
    const db = new Database(DB_PATH, { readonly: true });

    // Verificar tabla empresas
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='empresas'").get();

    if (!table) {
        console.log('❌ FAIL: No existe tabla "empresas".');
        process.exit(1);
    }

    const count = db.prepare('SELECT count(*) as c FROM empresas').get().c;
    console.log(`✅ REGISTROS EN TABLA EMPRESAS: ${count}`);

    if (count > 0) {
        const rows = db.prepare('SELECT razon_social, rfc FROM empresas').all();
        console.log('\nEMPRESAS DISPONIBLES:');
        console.table(rows);
        console.log('\n[OK] El selector de empresas debería funcionar correctamente.');
    } else {
        console.log('⚠️ [WARNING] La tabla existe pero está VACÍA.');
        console.log('   Si acabas de recuperar de Docker, verifica que el contenedor tenga datos.');
    }

} catch (err) {
    console.error(`❌ Error crítico: ${err.message}`);
}
