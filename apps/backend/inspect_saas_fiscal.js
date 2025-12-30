const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../saas_fiscal.db');
console.log(`Inspeccionando: ${dbPath}`);

try {
    const db = new Database(dbPath, { readonly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('TABLAS ENCONTRADAS:', tables.map(t => t.name));

    if (tables.length > 0) {
        // Intentar leer algo de la primera tabla
        const firstTable = tables[0].name;
        // console.log(`\nMuestra de ${firstTable}:`);
        // console.table(db.prepare(`SELECT * FROM ${firstTable} LIMIT 3`).all());
    }
} catch (err) {
    console.error(err);
}
