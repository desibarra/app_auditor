const db = require('better-sqlite3')('apps/backend/data/dev_clean.db');
const koppara = db.prepare("SELECT * FROM empresas WHERE id = 'empresa-pnk140311qm2'").get();
console.log(JSON.stringify(koppara, null, 2));
