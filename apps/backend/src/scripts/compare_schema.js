const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');

// Columnas definidas en el schema de Drizzle
const drizzleSchema = [
    'uuid',
    'empresa_id',
    'emisor_rfc',
    'emisor_nombre',
    'emisor_regimen_fiscal',
    'receptor_rfc',
    'receptor_nombre',
    'receptor_uso_cfdi',
    'receptor_domicilio_fiscal',
    'serie',
    'folio',
    'fecha',
    'fecha_timbrado',
    'tipo_comprobante',
    'ejercicio_fiscal',
    'version_cfdi',
    'subtotal',
    'descuento',
    'total',
    'moneda',
    'tipo_cambio',
    'forma_pago',
    'metodo_pago',
    'condiciones_pago',
    'lugar_expedicion',
    'xml_original',
    'xml_hash',
    'estatus_fiscal',
    'estatus_fuente',
    'rol',
    'last_checked_at',
    'fecha_cancelacion',
    'fecha_importacion',
    'fecha_actualizacion',
    'procesado',
    'tiene_errores',
    'mensaje_error',
    'objeto_imp',
    'tiene_rep_asociado',  // Esta es la correcta
    'rep_uuid',
    'hallazgos_detectados',
    'requiere_revalidacion'
];

try {
    const db = new Database(dbPath, { readonly: true });

    console.log('🔍 COMPARACIÓN: DRIZZLE SCHEMA vs BASE DE DATOS\n');
    console.log('='.repeat(70));

    // Obtener columnas reales de la BD
    const realColumns = db.prepare(`PRAGMA table_info(cfdi_recibidos)`).all();
    const realColumnNames = realColumns.map(c => c.name);

    console.log('\n❌ COLUMNAS FALTANTES EN BD (definidas en Drizzle):\n');
    const missing = drizzleSchema.filter(col => !realColumnNames.includes(col));

    if (missing.length > 0) {
        missing.forEach(col => {
            console.log(`   - ${col}`);
        });
        console.log(`\n   Total faltantes: ${missing.length}`);
    } else {
        console.log('   ✅ Todas las columnas de Drizzle existen en BD');
    }

    console.log('\n⚠️  COLUMNAS EXTRA EN BD (no en Drizzle):\n');
    const extra = realColumnNames.filter(col => !drizzleSchema.includes(col));

    if (extra.length > 0) {
        extra.forEach(col => {
            console.log(`   - ${col}`);
        });
        console.log(`\n   Total extra: ${extra.length}`);
    } else {
        console.log('   ✅ No hay columnas extra');
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESUMEN:');
    console.log(`   Columnas en Drizzle: ${drizzleSchema.length}`);
    console.log(`   Columnas en BD: ${realColumnNames.length}`);
    console.log(`   Faltantes: ${missing.length}`);
    console.log(`   Extra: ${extra.length}`);

    if (missing.length > 0) {
        console.log('\n🛠️  ACCIÓN REQUERIDA:');
        console.log('   Ejecutar migraciones para agregar columnas faltantes');
    }

    db.close();
} catch (error) {
    console.error('Error:', error.message);
}
