const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'sentinel.db');
console.log('DB Path:', dbPath);

const db = new Database(dbPath);

// Test query
const result = db.prepare(`
    SELECT 
        MIN(fecha) as min_fecha,
        MAX(fecha) as max_fecha,
        COUNT(*) as total_cfdis
    FROM cfdi_recibidos
    WHERE empresa_id = ?
    AND fecha IS NOT NULL
    AND fecha != ''
`).get('1767074265037');

console.log('Result:', JSON.stringify(result, null, 2));

// Get all years
if (result && result.min_fecha && result.max_fecha) {
    const minYear = new Date(result.min_fecha).getFullYear();
    const maxYear = new Date(result.max_fecha).getFullYear();

    const years = [];
    for (let y = maxYear; y >= minYear; y--) {
        years.push(y);
    }

    console.log('Years:', years);
}

db.close();
