const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Rutas relativas desde apps/backend
const candidates = [
    '../../saas_fiscal.db',
    'sqlite.db',
    'sqlite/dev.db',
    'dev.db',
    'data.db',
    'data/dev.db'
];

console.log('🛡️ INICIANDO AUDITORÍA FORENSE DE BASES DE DATOS\n');

let foundWinner = false;

candidates.forEach(relativePath => {
    const fullPath = path.resolve(__dirname, relativePath);

    if (!fs.existsSync(fullPath)) {
        return; // Skip si por alguna razón no existe
    }

    const size = (fs.statSync(fullPath).size / 1024).toFixed(2);
    console.log(`📂 DB: ${relativePath} (${size} KB)`);

    try {
        const db = new Database(fullPath, { readonly: true });

        // 1. Verificar si es una DB válida y tiene tabla empresas
        const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='empresas'").get();

        if (!table) {
            console.log('   ❌ Estructura inválida: No existe tabla "empresas"');
        } else {
            // 2. Contar registros
            const count = db.prepare('SELECT count(*) as c FROM empresas').get().c;

            if (count > 0) {
                console.log(`   ✅ REGISTROS ENCONTRADOS: ${count}`);

                // 3. Listar nombres para confirmar
                const rows = db.prepare('SELECT id, rfc, razon_social, activa FROM empresas LIMIT 3').all();
                console.table(rows);
                foundWinner = true;
            } else {
                console.log('   ⚠️ Tabla "empresas" vacía (0 registros)');
            }
        }
        db.close();

    } catch (err) {
        console.log(`   ❌ Error de lectura: ${err.message}`);
    }
    console.log('------------------------------------------------------------');
});

if (!foundWinner) {
    console.log('\n❌ ALERTA CRÍTICA: Ninguna base de datos contiene empresas.');
} else {
    console.log('\n✅ SE HA IDENTIFICADO AL MENOS UNA BASE DE DATOS CON INFORMACIÓN.');
}
