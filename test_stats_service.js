
const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { sqliteTable, text, real, integer } = require('drizzle-orm/sqlite-core');
const { eq, and, gte, lte } = require('drizzle-orm');

// Schema definitions (minimal)
const cfdiRecibidos = sqliteTable("cfdi_recibidos", {
    uuid: text("uuid").primaryKey(),
    emisorRfc: text("emisor_rfc").notNull(),
    receptorRfc: text("receptor_rfc").notNull(),
    fecha: text("fecha").notNull(),
    tipoComprobante: text("tipo_comprobante").notNull(),
    total: real("total").notNull(),
    empresaId: text("empresa_id").notNull(),
});

const empresas = sqliteTable('empresas', {
    id: text('id').primaryKey(),
    rfc: text('rfc').notNull().unique(),
});

const dbPath = 'c:\\Users\\desib\\Documents\\app_auditor\\apps\\backend\\data\\dev.db';
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function testStats(empresaId) {
    console.log(`Testing Stats for ${empresaId}...`);

    // 1. Get Company RFC
    const [empresa] = await db.select().from(empresas).where(eq(empresas.id, empresaId));
    if (!empresa) {
        console.error('Empresa not found!');
        return;
    }
    console.log('Empresa RFC:', empresa.rfc);
    const rfcEmpresa = empresa.rfc;

    // 2. Dates (Dec 2025)
    // Simulated Time: 2025-12-20
    const fechaInicio = '2025-12-01';
    const fechaFin = '2025-12-31';

    // 3. Query CFDI
    const cfdisMes = await db.select().from(cfdiRecibidos)
        .where(and(
            eq(cfdiRecibidos.empresaId, empresaId),
            gte(cfdiRecibidos.fecha, fechaInicio),
            lte(cfdiRecibidos.fecha, fechaFin)
        ));

    console.log(`Found ${cfdisMes.length} CFDIs in range.`);

    if (cfdisMes.length === 0) {
        console.log('Checking why empty...');
        // Inspect one from DB that SHOULD match
        const sample = db.select().from(cfdiRecibidos).where(eq(cfdiRecibidos.empresaId, empresaId)).limit(1).get();
        if (sample) console.log('Sample from DB (ignoring date):', sample);
        else console.log('No CFDI found for this empresaId at all.');
        return;
    }

    // 4. Calculate Logic
    let totalIngresos = 0;
    let countIngresos = 0;

    cfdisMes.forEach(cfdi => {
        const monto = Number(cfdi.total);
        const tipo = cfdi.tipoComprobante;
        const emisor = cfdi.emisorRfc;
        const receptor = cfdi.receptorRfc;

        if (tipo === 'I') {
            if (emisor === rfcEmpresa) {
                totalIngresos += monto;
                countIngresos++;
                // console.log('Ingreso:', monto);
            }
        }
    });

    console.log('Total Ingresos:', totalIngresos);
    console.log('Count Ingresos:', countIngresos);
}

// Run for Traslados
testStats('empresa-tva060209ql6');
