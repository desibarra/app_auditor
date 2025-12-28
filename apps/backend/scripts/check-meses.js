// Script para verificar qué meses tienen datos
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/dev.db');
const db = new Database(dbPath);

try {
    console.log('📊 Verificando datos por mes...\n');

    // Obtener meses con datos
    const mesesConDatos = db.prepare(`
        SELECT 
            strftime('%Y-%m', fecha) as mes,
            COUNT(*) as total_cfdis,
            MIN(fecha) as fecha_min,
            MAX(fecha) as fecha_max
        FROM cfdi_recibidos
        GROUP BY strftime('%Y-%m', fecha)
        ORDER BY mes DESC
        LIMIT 12
    `).all();

    console.log('Meses con datos (últimos 12):');
    console.log('═'.repeat(80));

    mesesConDatos.forEach(m => {
        console.log(`📅 ${m.mes}: ${m.total_cfdis.toLocaleString()} CFDIs (${m.fecha_min} → ${m.fecha_max})`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log(`\n✅ Total de meses con datos: ${mesesConDatos.length}`);

    if (mesesConDatos.length > 0) {
        console.log(`\n💡 Mes más reciente con datos: ${mesesConDatos[0].mes}`);
        console.log(`   Usa este mes para generar el informe de defensa`);
    }

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
} finally {
    db.close();
}
