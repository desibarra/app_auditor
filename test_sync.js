const axios = require('axios');

async function test() {
    try {
        console.log('Testing SAT Sync for December 2025...');
        const res = await axios.post('http://localhost:4000/api/cfdi/sincronizar-sat', {
            empresaId: '1767074265037',
            periodo: '2025-12'
        }, {
            timeout: 60000 // 1 minute
        });
        console.log('Result:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        if (e.response) {
            console.error('Server Error:', e.response.status, e.response.data);
        } else {
            console.error('Error:', e.message);
        }
    }
}

test();
