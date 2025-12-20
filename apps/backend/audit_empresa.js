const Database = require('better-sqlite3');
const db = new Database('data/dev.db');

console.log('--- EMPRESA AUDIT ---');
const empresa = db.prepare("SELECT id, rfc, razon_social FROM empresas WHERE id = 'empresa-tva060209ql6'").get();
console.log('Empresa_Data=' + JSON.stringify(empresa));
