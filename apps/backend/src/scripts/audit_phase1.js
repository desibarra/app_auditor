const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');

try {
    const db = new Database(dbPath, { readonly: true });
    console.log('🔍 AUDITORÍA FORENSE SENTINEL - FASE 1');
    console.log('=======================================');

    // 1. VERIFICACIÓN DE SCHEMA CRÍTICO
    console.log('\n[1] SCHEMA DE INTEGRIDAD');
    const cols = db.prepare("PRAGMA table_info(cfdi_recibidos)").all();
    const colMap = new Set(cols.map(c => c.name));

    const required = ['rol', 'objeto_imp', 'tiene_rep_asociado', 'xml_original', 'tipo_comprobante', 'estatus_fiscal'];
    const missing = required.filter(c => !colMap.has(c));

    if (missing.length > 0) {
        console.log(`❌ RIESGO ALTO: Faltan columnas críticas: ${missing.join(', ')}`);
    } else {
        console.log('✅ Columnas críticas presentes.');
    }

    // 2. INTEGRIDAD DE DATOS FISCALES
    console.log('\n[2] INTEGRIDAD FISCAL (cfdi_recibidos)');

    // Conteo total
    const total = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos").get().c;
    console.log(`   Total XMLs: ${total.toLocaleString()}`);

    // Distribución por ROL (Vital para Ingresos vs Egresos)
    const roles = db.prepare("SELECT rol, COUNT(*) as c FROM cfdi_recibidos GROUP BY rol").all();
    console.log('   Distribución de ROL:');
    roles.forEach(r => console.log(`   - ${r.rol || 'NULL (⚠️ RIESGO)'}: ${r.c.toLocaleString()}`));

    // Distribución por TIPO
    const tipos = db.prepare("SELECT tipo_comprobante, COUNT(*) as c FROM cfdi_recibidos GROUP BY tipo_comprobante").all();
    console.log('   Distribución de TIPO:');
    tipos.forEach(t => console.log(`   - ${t.tipo_comprobante || 'NULL'}: ${t.c.toLocaleString()}`));

    // Detectar inconsistencias lógicas
    const huerfanos = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos WHERE rol IS NULL OR tipo_comprobante IS NULL").get().c;
    if (huerfanos > 0) console.log(`❌ RIESGO ALTO: ${huerfanos} registros sin clasificación fiscal (Rol o Tipo nulo).`);

    // Fechas Imposibles
    const fechasInvalidas = db.prepare(`
        SELECT count(*) as c FROM cfdi_recibidos 
        WHERE strftime('%Y', fecha) < '2015' OR strftime('%Y', fecha) > '2026'
    `).get().c;
    if (fechasInvalidas > 0) console.log(`⚠️ RIESGO MEDIO: ${fechasInvalidas} registros con fechas fuera de rango lógico.`);

    // 3. AUDITORÍA DE MONTOS
    console.log('\n[3] AUDITORÍA DE MONTOS');
    const negatives = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos WHERE total < 0").get().c;
    if (negatives > 0) console.log(`❌ RIESGO ALTO: ${negatives} registros con montos negativos (imposible en CFDI estándar).`);

    const nullTotals = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos WHERE total IS NULL").get().c;
    if (nullTotals > 0) console.log(`❌ RIESGO ALTO: ${nullTotals} registros con TOTAL nulo.`);

    // 4. ANÁLISIS DE REPs (Pagos)
    console.log('\n[4] ANÁLISIS DE REPs (Cobranza)');
    const reps = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos WHERE tipo_comprobante = 'P'").get().c;
    console.log(`   Total CDFI 'P' (Pagos): ${reps.toLocaleString()}`);

    const relations = db.prepare("SELECT COUNT(*) as c FROM cfdi_relaciones").get().c;
    console.log(`   Total Relaciones (Pago -> Factura): ${relations.toLocaleString()}`);

    // 5. VERIFICACIÓN DE OBJETO IMP (Corrección reciente)
    const objImpNull = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos WHERE objeto_imp IS NULL").get().c;
    if (objImpNull === 0) console.log('✅ Columna objeto_imp saneada (0 nulos).');
    else console.log(`❌ ALERTA: ${objImpNull} registros aún tienen objeto_imp NULL.`);

    console.log('\n=======================================');
    console.log('FIN DE AUDITORÍA');
    db.close();

} catch (e) {
    console.error('❌ ERROR CRÍTICO EJECUTANDO AUDITORÍA:', e.message);
}
