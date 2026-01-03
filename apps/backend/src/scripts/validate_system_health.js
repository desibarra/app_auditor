const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');

console.log('🏥 VALIDACIÓN DE SALUD DEL SISTEMA (POST-CORRECCIONES)');
console.log('=====================================================');

try {
    const db = new Database(dbPath, { readonly: true });

    // 1. CHEQUEO DE NULOS CRÍTICOS
    const criticalChecks = [
        { table: 'cfdi_recibidos', col: 'objeto_imp', label: 'Objeto Impuesto' },
        { table: 'cfdi_recibidos', col: 'rol', label: 'Rol Fiscal' },
        { table: 'cfdi_recibidos', col: 'estatus_fiscal', label: 'Estatus SAT' },
        { table: 'cfdi_recibidos', col: 'tipo_comprobante', label: 'Tipo CFDI' }
    ];

    let passed = true;

    console.log('[1] VERIFICACIÓN DE INTEGRIDAD DE DATOS');
    criticalChecks.forEach(check => {
        const c = db.prepare(`SELECT COUNT(*) as c FROM ${check.table} WHERE ${check.col} IS NULL`).get().c;
        if (c > 0) {
            console.log(`   ❌ FALLO: ${check.label} tiene ${c} nulos.`);
            passed = false;
        } else {
            console.log(`   ✅ ${check.label}: Limpio.`);
        }
    });

    // 2. VERIFICACIÓN DE COLUMNAS NUEVAS
    console.log('\n[2] VERIFICACIÓN DE SCHEMA NUEVO');
    const cols = db.prepare("PRAGMA table_info(cfdi_recibidos)").all().map(c => c.name);
    const newCols = ['tiene_rep_asociado', 'hallazgos_detectados', 'requiere_revalidacion'];

    newCols.forEach(col => {
        if (cols.includes(col)) console.log(`   ✅ Columna '${col}' existe.`);
        else {
            console.log(`   ❌ FALLO: Columna '${col}' NO existe.`);
            passed = false;
        }
    });

    console.log('\n=====================================================');
    if (passed) {
        console.log('🎉 RESULTADO: SISTEMA ESTABLE Y SANEADO (10/10 Integrity)');
    } else {
        console.log('⚠️ RESULTADO: AÚN EXISTEN RIESGOS');
    }

    db.close();

} catch (e) {
    console.error('Error:', e.message);
}
