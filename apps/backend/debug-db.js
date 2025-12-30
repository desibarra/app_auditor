const Database = require('better-sqlite3');
const fs = require('fs');

const possiblePaths = [
    'dev.db',
    'data.db',
    'data/dev.db',
    'sqlite/dev.db'
];

console.log('🔍 Buscando empresas en todas las DBs encontradas...\n');

for (const dbPath of possiblePaths) {
    if (!fs.existsSync(dbPath)) continue;

    console.log(`📂 Revisando: ${dbPath}`);
    try {
        const db = new Database(dbPath, { readonly: true });

        // Verificar si existe la tabla empresas
        const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='empresas'").get();
        if (!tableCheck) {
            console.log('   ❌ No tiene tabla "empresas"');
            continue;
        }

        const empresas = db.prepare('SELECT * FROM empresas').all();
        if (empresas.length > 0) {
            console.log(`   ✅ ENCONTRADAS ${empresas.length} EMPRESAS:`);
            console.table(empresas);
        } else {
            console.log('   ⚠️ Tabla vacía.');
        }

    } catch (err) {
        console.log(`   ❌ Error: ${err.message}`);
    }
    console.log('--------------------------------------------------');
}
