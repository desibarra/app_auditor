// Script para probar la generación del reporte directamente
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/dev.db');
const db = new Database(dbPath);

const empresaId = 'empresa-tva060209ql6';
const mes = '2025-12';

try {
    console.log(`🔍 Probando generación de reporte para ${empresaId} - ${mes}\n`);

    // 1. Verificar empresa
    const empresa = db.prepare('SELECT * FROM empresas WHERE id = ?').get(empresaId);
    if (!empresa) {
        throw new Error('Empresa no encontrada');
    }
    console.log(`✅ Empresa encontrada: ${empresa.razon_social} (${empresa.rfc})`);

    // 2. Verificar CFDIs del mes
    const cfdisMes = db.prepare(`
        SELECT COUNT(*) as total
        FROM cfdi_recibidos
        WHERE empresa_id = ?
        AND strftime('%Y-%m', fecha) = ?
    `).get(empresaId, mes);

    console.log(`✅ CFDIs en ${mes}: ${cfdisMes.total}`);

    // 3. Verificar versiones
    const versiones = db.prepare(`
        SELECT version_cfdi, COUNT(*) as count
        FROM cfdi_recibidos
        WHERE empresa_id = ?
        AND strftime('%Y-%m', fecha) = ?
        GROUP BY version_cfdi
    `).all(empresaId, mes);

    console.log(`✅ Versiones CFDI:`);
    versiones.forEach(v => {
        console.log(`   - ${v.version_cfdi || 'NULL'}: ${v.count} CFDIs`);
    });

    // 4. Probar query problemática
    console.log('\n🔍 Probando query de emitidos...');
    const emitidos = db.prepare(`
        SELECT COUNT(*) as count, SUM(total) as total
        FROM cfdi_recibidos
        WHERE empresa_id = ?
        AND strftime('%Y-%m', fecha) = ?
        AND emisor_rfc = ?
        AND tipo_comprobante = 'I'
        AND estado_sat != 'Cancelado'
    `).get(empresaId, mes, empresa.rfc);

    console.log(`✅ Emitidos: ${emitidos.count} CFDIs, Total: $${emitidos.total || 0}`);

    console.log('\n✨ Todas las queries funcionan correctamente');

} catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
} finally {
    db.close();
}
