const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'apps/backend/data/production.db');
console.log('Verificando DB:', dbPath);

try {
    const db = new Database(dbPath, { readonly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tablas detectadas:', tables.map(t => t.name));

    if (tables.some(t => t.name === 'empresas')) {
        const columns = db.prepare("PRAGMA table_info(empresas)").all();
        console.log('Columnas empresas:', columns.map(c => c.name));
    }
} catch (error) {
    console.error('Error abriendo DB:', error);
}
