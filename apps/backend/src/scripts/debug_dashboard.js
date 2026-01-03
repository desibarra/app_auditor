const Database = require('better-sqlite3');
const axios = require('axios');
const path = require('path');

async function debugDashboard() {
    console.log('🕵️‍♂️ DEBUGGING DASHBOARD ERROR');

    // 1. Obtener ID de Empresa
    const dbPath = path.join(__dirname, '..', '..', 'data', 'dev.db');
    const db = new Database(dbPath, { readonly: true });

    const empresa = db.prepare("SELECT id, razon_social FROM empresas WHERE razon_social LIKE '%TRASLADOS%'").get();

    if (!empresa) {
        console.error('❌ No se encontró la empresa Traslados de Vanguardia');
        return;
    }

    console.log(`✅ Empresa Encontrada: ${empresa.razon_social} (ID: ${empresa.id})`);
    db.close();

    // 2. Probar el Endpoint (Simulando Frontend)
    const url = `http://localhost:4000/api/stats/sentinel-summary`;
    const params = {
        empresaId: empresa.id,
        periodo: '2025-12', // Periodo que sabemos que tiene datos
        flujo: 'RECIBIDOS'
    };

    console.log(`\nTesting Endpoint: ${url}`);
    console.log('Params:', params);

    try {
        const response = await axios.get(url, { params });
        console.log('\n✅ RESPUESTA EXITOSA (Status 200)');
        console.log('Estructura recibida:', Object.keys(response.data));
        console.log('KPIs:', response.data.kpis);
        console.log('Tendencia:', response.data.tendencia?.status);
    } catch (error) {
        console.error('\n❌ ERROR EN ENDPOINT:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('   Error de conexión:', error.message);
        }
    }
}

debugDashboard();
