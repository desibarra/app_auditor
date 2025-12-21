
const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { sql } = require('drizzle-orm');

const dbPath = 'c:\\Users\\desib\\Documents\\app_auditor\\apps\\backend\\data\\dev.db';
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function testQuery(rfc) {
    console.log(`Testing Query for RFC: ${rfc}`);

    // Simulate Dec 2025
    const mesTarget = '2025-12';

    const query = sql`
        SELECT
            COUNT(*) as cfdi_del_mes,
            SUM(total) as importe_total_mes
        FROM cfdi_recibidos
        WHERE emisor_rfc = ${rfc}
          AND tipo_comprobante = 'I'
          AND strftime('%Y-%m', fecha) = ${mesTarget}
    `;

    console.log('SQL:', query.getSQL());

    try {
        const result = await db.all(query);
        console.log('Result:', result);
    } catch (e) {
        console.log('Error:', e);
    }
}

// TVA RFC from audit
testQuery('TVA060209QL6');
