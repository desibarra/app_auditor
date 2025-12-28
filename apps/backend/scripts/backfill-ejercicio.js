// Script para hacer backfill de ejercicio_fiscal y version_cfdi
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/dev.db');
const db = new Database(dbPath);

try {
    console.log('🔄 Iniciando backfill de datos...');

    // Obtener todos los CFDIs sin ejercicio_fiscal
    const cfdis = db.prepare(`
        SELECT uuid, fecha, xml_original 
        FROM cfdi_recibidos 
        WHERE ejercicio_fiscal IS NULL
    `).all();

    console.log(`📊 Encontrados ${cfdis.length} CFDIs para actualizar`);

    let updated = 0;
    const updateStmt = db.prepare(`
        UPDATE cfdi_recibidos 
        SET ejercicio_fiscal = ?, version_cfdi = ? 
        WHERE uuid = ?
    `);

    for (const cfdi of cfdis) {
        try {
            // Calcular ejercicio fiscal desde la fecha
            const fecha = new Date(cfdi.fecha);
            const ejercicioFiscal = fecha.getFullYear();

            // Detectar versión desde el XML
            let versionCfdi = '4.0'; // Default
            if (cfdi.xml_original) {
                if (cfdi.xml_original.includes('Version="3.3"') || cfdi.xml_original.includes('version="3.3"')) {
                    versionCfdi = '3.3';
                } else if (cfdi.xml_original.includes('Version="4.0"') || cfdi.xml_original.includes('version="4.0"')) {
                    versionCfdi = '4.0';
                }
            }

            updateStmt.run(ejercicioFiscal, versionCfdi, cfdi.uuid);
            updated++;

            if (updated % 100 === 0) {
                console.log(`✓ Actualizados ${updated}/${cfdis.length} CFDIs...`);
            }
        } catch (err) {
            console.error(`⚠️  Error actualizando CFDI ${cfdi.uuid}:`, err.message);
        }
    }

    console.log(`✅ Backfill completado: ${updated} CFDIs actualizados`);

} catch (error) {
    console.error('❌ Error durante el backfill:', error.message);
    process.exit(1);
} finally {
    db.close();
}
