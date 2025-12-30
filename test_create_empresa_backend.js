const http = require('http');

async function testBackend() {
    console.log('🧪 TEST CREACIÓN EMPRESA 🧪');

    const BASE_URL = 'http://localhost:4000/api/empresas';
    const TEST_RFC = 'TVA062209QL6';

    async function postEmpresa(data) {
        return new Promise((resolve, reject) => {
            const req = http.request(BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, body: JSON.parse(body) });
                    } catch (e) {
                        resolve({ status: res.statusCode, body: { message: body } });
                    }
                });
            });
            req.on('error', reject);
            req.write(JSON.stringify(data));
            req.end();
        });
    }

    console.log(`\nProbando RFC Válido (${TEST_RFC})...`);
    const res = await postEmpresa({ rfc: TEST_RFC, razonSocial: 'Test Vanguardia SA DE CV' });

    console.log('Status:', res.status);
    console.log('Body completo:', JSON.stringify(res.body, null, 2));

    if (res.body._debug) {
        console.log('\n⚠️  MODO DEBUG ACTIVO:');
        console.log('Error Name:', res.body.error.name);
        console.log('Error Message:', res.body.error.message);
        console.log('Stack (primeras 500 chars):', res.body.error.stack?.substring(0, 500));
    }
}

testBackend().catch(console.error);
