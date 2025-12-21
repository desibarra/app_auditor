
const fs = require('fs');
const Database = require('better-sqlite3');
const dbPath = 'c:\\Users\\desib\\Documents\\app_auditor\\apps\\backend\\data\\dev.db';

const db = new Database(dbPath);
let output = '';

output += '--- checking cfdi_recibidos ---\n';
try {
    const count = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos").get();
    output += `Total Rows: ${count.c}\n`;

    if (count.c > 0) {
        const minMax = db.prepare("SELECT MIN(fecha) as minF, MAX(fecha) as maxF FROM cfdi_recibidos").get();
        output += `Date Range: ${JSON.stringify(minMax)}\n`;

        const tipos = db.prepare("SELECT tipo_comprobante, COUNT(*) as c FROM cfdi_recibidos GROUP BY tipo_comprobante").all();
        output += `Types: ${JSON.stringify(tipos, null, 2)}\n`;
    }
} catch (e) {
    output += `Error: ${e.message}\n`;
}

fs.writeFileSync('c:\\Users\\desib\\Documents\\app_auditor\\audit_result_detailed.txt', output);
console.log('Written to audit_result_detailed.txt');
