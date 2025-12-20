const Database = require('better-sqlite3');
const fs = require('fs');

console.log('--- AUDITORÍA EXTENDIDA ---');

['data/dev.db', 'sqlite/dev.db'].forEach(dbPath => {
    if (!fs.existsSync(dbPath)) {
        console.log(`❌ No existe: ${dbPath}`);
        return;
    }

    console.log(`\n🔍 ANALIZANDO: ${dbPath}`);
    try {
        const db = new Database(dbPath);

        // Verificar tabla
        const checkTable = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cfdi_recibidos'").get();
        if (!checkTable) {
            console.log("  ⚠️ Tabla 'cfdi_recibidos' NO encontrada.");
            return;
        }

        // 1. Total Global
        const total = db.prepare("SELECT COUNT(*) as t FROM cfdi_recibidos").get().t;
        console.log(`  📊 Total Global Registros: ${total}`);

        if (total === 0) return;

        // 2. Rango de Fechas
        const rango = db.prepare("SELECT MIN(fecha) as min, MAX(fecha) as max FROM cfdi_recibidos").get();
        console.log(`  📅 Rango detectado: ${rango.min} a ${rango.max}`);

        // 3. Agrupación por Mes (Top 5)
        const porMes = db.prepare("SELECT strftime('%Y-%m', fecha) as mes, COUNT(*) as c FROM cfdi_recibidos GROUP BY mes ORDER BY mes DESC LIMIT 5").all();
        console.log("  📆 Top Meses con Datos:", JSON.stringify(porMes));

        // 4. Específico Noviembre 2025
        const nov = db.prepare("SELECT COUNT(*) as c FROM cfdi_recibidos WHERE strftime('%Y-%m', fecha) = '2025-11'").get();
        console.log(`  🎯 Noviembre 2025 (Exacto): ${nov.c}`);

        // 5. Tipos en Noviembre
        if (nov.c > 0) {
            const tipos = db.prepare("SELECT tipo_comprobante, COUNT(*) as c FROM cfdi_recibidos WHERE strftime('%Y-%m', fecha) = '2025-11' GROUP BY tipo_comprobante").all();
            console.log("  🏷️ Tipos en Noviembre:", JSON.stringify(tipos));
        }

    } catch (e) {
        console.log("  🔥 Error:", e.message);
    }
});
console.log('\n--- FIN ---');
