const db = require('better-sqlite3')('apps/backend/data/dev_clean.db');
const row = db.prepare("SELECT count(*) as total FROM cfdi_recibidos WHERE empresa_id = '1767074265037' AND fecha LIKE '2025-12%'").get();
console.log(JSON.stringify(row));
const sample = db.prepare("SELECT uuid, emisor_rfc, receptor_rfc, total FROM cfdi_recibidos WHERE empresa_id = '1767074265037' AND fecha LIKE '2025-12%' LIMIT 3").all();
console.log(JSON.stringify(sample, null, 2));
