const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');
console.log('DB Path:', dbPath);

try {
    const db = new Database(dbPath, { readonly: true });

    // Get distinct years
    const years = db.prepare(`
        SELECT DISTINCT strftime('%Y', fecha) as year
        FROM cfdi_recibidos
        WHERE fecha IS NOT NULL
        ORDER BY year DESC
    `).all();

    console.log('Years in database:', years.map(y => y.year));

    // Get count per year
    const counts = db.prepare(`
        SELECT strftime('%Y', fecha) as year, COUNT(*) as total
        FROM cfdi_recibidos
        WHERE fecha IS NOT NULL
        GROUP BY year
        ORDER BY year DESC
    `).all();

    console.log('\nCFDIs per year:');
    counts.forEach(c => console.log(`  ${c.year}: ${c.total} CFDIs`));

    db.close();
} catch (error) {
    console.error('Error:', error.message);
}
