const axios = require('axios');

async function checkPulse() {
    console.log('💓 VERIFICANDO PULSO DEL SERVIDOR');

    // 1. Endpoint Base (Empresas - Debería existir siempre)
    try {
        const res = await axios.get('http://localhost:4000/api/empresas');
        console.log(`✅ /api/empresas responde: ${res.status} OK`);
        console.log(`   Total empresas: ${res.data.length}`);
    } catch (e) {
        console.log(`❌ /api/empresas falla: ${e.message}`);
        if (e.response) console.log(`   Status: ${e.response.status}`);
    }

    // 2. Endpoint Nuevo (Ultimo Periodo)
    try {
        // Usamos un ID de empresa conocido del paso anterior o hardcoded que sabemos existe (Traslados)
        const empresaId = '1767074265037';
        const res = await axios.get(`http://localhost:4000/api/cfdi/ultimo-periodo?empresaId=${empresaId}`);
        console.log(`✅ /api/cfdi/ultimo-periodo responde: ${res.status} OK`);
        console.log('   Payload:', JSON.stringify(res.data));
    } catch (e) {
        console.log(`❌ /api/cfdi/ultimo-periodo falla: ${e.message}`);
        if (e.response) console.log(`   Status: ${e.response.status}`);
    }

    // 3. Endpoint Dashboard (Sentinel Summary)
    try {
        const empresaId = '1767074265037';
        const res = await axios.get(`http://localhost:4000/api/stats/sentinel-summary?empresaId=${empresaId}&periodo=2025-12`);
        console.log(`✅ /api/stats/sentinel-summary responde: ${res.status} OK`);
    } catch (e) {
        console.log(`❌ /api/stats/sentinel-summary falla: ${e.message}`);
        if (e.response) console.log(`   Status: ${e.response.status}`);
    }
}

checkPulse();
