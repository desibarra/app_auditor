
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/dev_clean.db');
console.log('Opening DB:', dbPath);
const db = new Database(dbPath);

try {
    // 1. Get first empresa
    const empresa = db.prepare('SELECT * FROM empresas LIMIT 1').get();
    if (!empresa) {
        console.error('No empresas found!');
        process.exit(1);
    }
    console.log('Testing with empresa:', empresa.razon_social, 'ID:', empresa.id);

    const empresaId = empresa.id;
    const now = new Date();
    const mesActivo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const rfcEmpresa = empresa.rfc;

    console.log('Mes Activo:', mesActivo);
    console.log('RFC:', rfcEmpresa);

    // 2. Test KPIS query
    console.log('Testing KPIs query...');
    const kpisQuery = `
        SELECT 
            COUNT(*) as total_general,
            SUM(CASE WHEN emisor_rfc = ? AND tipo_comprobante = 'I' THEN total ELSE 0 END) as ingresos_totales,
            SUM(CASE WHEN receptor_rfc = ? AND tipo_comprobante = 'I' THEN total ELSE 0 END) as egresos_totales,
            COUNT(CASE WHEN emisor_rfc = ? AND tipo_comprobante = 'I' THEN 1 END) as count_ingresos,
            COUNT(CASE WHEN receptor_rfc = ? AND tipo_comprobante = 'I' THEN 1 END) as count_egresos
        FROM cfdi_recibidos
        WHERE empresa_id = ?
        AND strftime('%Y-%m', fecha) = ?
        AND UPPER(estatus_fiscal) = 'VIGENTE'
    `;

    // In Drizzle we passed parameters differently, here we use binding
    const kpis = db.prepare(kpisQuery).all(
        rfcEmpresa, rfcEmpresa, rfcEmpresa, rfcEmpresa, // 4 times
        empresaId,
        mesActivo
    );
    console.log('KPIs Result:', kpis[0]);

    // 3. Test Alerts Query
    console.log('Testing Alerts query...');
    const filterClause = "receptor_rfc = ?";
    const alertasQuery = `
        SELECT 
            COUNT(CASE WHEN metodo_pago = 'PPD' THEN 1 END) as ppd_detectados,
            COUNT(CASE WHEN version_cfdi = '3.3' AND strftime('%Y', fecha) >= '2024' THEN 1 END) as cfdi_33_extemporaneo
        FROM cfdi_recibidos
        WHERE empresa_id = ?
        AND ${filterClause}
        AND strftime('%Y-%m', fecha) = ?
        AND UPPER(estatus_fiscal) = 'VIGENTE'
    `;

    const alertas = db.prepare(alertasQuery).all(empresaId, rfcEmpresa, mesActivo);
    console.log('Alertas Result:', alertas[0]);

    // 4. Contentration
    console.log('Testing Concentration query...');
    const concentracionQuery = `
        SELECT 
            emisor_rfc as rfc,
            emisor_nombre as nombre,
            SUM(total) as total
        FROM cfdi_recibidos
        WHERE empresa_id = ?
        AND ${filterClause}
        AND strftime('%Y-%m', fecha) = ?
        AND UPPER(estatus_fiscal) = 'VIGENTE'
        AND tipo_comprobante = 'I'
        GROUP BY rfc, nombre
        ORDER BY total DESC
        LIMIT 5
    `;
    const conc = db.prepare(concentracionQuery).all(empresaId, rfcEmpresa, mesActivo);
    console.log('Concentration Result:', conc);

    console.log('ALL QUERIES SUCCESSFUL');

} catch (err) {
    console.error('ERROR EXECUTING QUERY:', err);
}
