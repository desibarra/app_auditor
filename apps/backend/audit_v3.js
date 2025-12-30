const Database = require('better-sqlite3');
const fs = require('fs');

const targetPath = 'c:\\Users\\desib\\Documents\\app_auditor_v3\\app_auditor\\saas_fiscal.db';

console.log(`🛡️ INSPECCIONANDO DB CANDIDATA: ${targetPath}`);

if (!fs.existsSync(targetPath)) {
    console.log('❌ El archivo no existe.');
    process.exit(1);
}

const size = (fs.statSync(targetPath).size / 1024).toFixed(2);
console.log(`📦 Tamaño: ${size} KB`);

try {
    const db = new Database(targetPath, { readonly: true });

    // Verificar tabla empresas
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='empresas'").get();

    if (!table) {
        console.log('❌ Estructura inválida: No existe tabla "empresas"');
    } else {
        const count = db.prepare('SELECT count(*) as c FROM empresas').get().c;
        console.log(`✅ REGISTROS ENCONTRADOS: ${count}`);

        if (count > 0) {
            const rows = db.prepare('SELECT id, rfc, razon_social FROM empresas LIMIT 3').all();
            console.table(rows);
            console.log('\n🌟 ¡ESTA ES LA DB QUE BUSCAS!');
        } else {
            console.log('⚠️ Tabla vacía.');
        }
    }
} catch (err) {
    console.error(`❌ Error al leer DB: ${err.message}`);
}
