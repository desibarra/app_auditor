
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/dev_clean.db');
const db = new Database(dbPath);

console.log('--- SYSTEM AUDIT START ---');

// 1. Check Empresas
const empresas = db.prepare('SELECT id, rfc, razon_social FROM empresas').all();
console.log('Empresas Registered:', empresas);

if (empresas.length === 0) {
    console.log('CRITICAL: No empresas found.');
    process.exit(1);
}

const empresa = empresas[0];
console.log(`\nAuditing data for Empresa: ${empresa.razon_social} (${empresa.rfc})`);

// 2. Check Date Formats
const fechas = db.prepare(`SELECT uuid, fecha, strftime('%Y-%m', fecha) as mes_calc FROM cfdi_recibidos WHERE empresa_id = ? LIMIT 5`).all(empresa.id);
console.log('\nSample Dates Analysis:');
fechas.forEach(f => {
    console.log(`UUID: ${f.uuid.substring(0, 8)}... | Raw: "${f.fecha}" | Extracted Month: ${f.mes_calc} | Valid Format? ${f.mes_calc ? 'YES' : 'NO (ERROR)'}`);
});

// 3. Check Classification Logic
console.log('\nClassification Logic Verification:');
const emitted = db.prepare(`
    SELECT COUNT(*) as count, SUM(total) as total 
    FROM cfdi_recibidos 
    WHERE empresa_id = ? AND emisor_rfc = ?
`).get(empresa.id, empresa.rfc);

const received = db.prepare(`
    SELECT COUNT(*) as count, SUM(total) as total 
    FROM cfdi_recibidos 
    WHERE empresa_id = ? AND receptor_rfc = ?
`).get(empresa.id, empresa.rfc);

console.log(`Emitidos (Ingresos): Count=${emitted.count}, Total=${emitted.total}`);
console.log(`Recibidos (Egresos): Count=${received.count}, Total=${received.total}`);

// 4. Check "Orphan" Records (Neither emitted nor received by this company)
const orphans = db.prepare(`
    SELECT COUNT(*) as count, emisor_rfc, receptor_rfc 
    FROM cfdi_recibidos 
    WHERE empresa_id = ? 
    AND emisor_rfc != ? 
    AND receptor_rfc != ?
    GROUP BY emisor_rfc, receptor_rfc
`).all(empresa.id, empresa.rfc, empresa.rfc);

if (orphans.length > 0) {
    console.log('\n⚠️ CRITICAL WARNING: Found Orphan Records (Data Integrity Issue)');
    console.log(orphans);
} else {
    console.log('\n✅ Data Integrity: No orphan records found.');
}

// 5. Check "Phantom" Dates (Years)
const years = db.prepare(`
    SELECT DISTINCT strftime('%Y', fecha) as year, COUNT(*) as count 
    FROM cfdi_recibidos 
    WHERE empresa_id = ? 
    GROUP BY year
`).all(empresa.id);
console.log('\nYears found in DB:', years);

console.log('--- SYSTEM AUDIT END ---');
