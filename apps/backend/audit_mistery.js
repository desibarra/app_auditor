const Database = require('better-sqlite3');
const fs = require('fs');

const targetPath = 'c:\\Users\\desib\\Documents\\NUEVO\\backend.db';

console.log(`🛡️ INSPECCIONANDO DB MISTERIOSA: ${targetPath}`);

if (!fs.existsSync(targetPath)) {
    console.log('❌ El archivo no existe.');
    process.exit(1);
}

try {
    const db = new Database(targetPath, { readonly: true });

    // Verificar tabla empresas
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='empresas'").get();

    if (!table) {
        console.log('❌ No existe tabla "empresas"');
        const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        console.log('   Tablas que sí tiene:', tables.map(t => t.name).join(', '));
    } else {
        const count = db.prepare('SELECT count(*) as c FROM empresas').get().c;
        console.log(`✅ REGISTROS ENCONTRADOS: ${count}`);

        if (count > 0) {
            const rows = db.prepare('SELECT id, rfc, razon_social FROM empresas LIMIT 3').all();
            console.table(rows);
            console.log('\n🌟 ¡ESTA ES LA DB QUE BUSCAS!');
        }
    }
} catch (err) {
    console.error(`❌ Error al leer DB: ${err.message}`);
}
