const http = require('http');

console.log('🩺 Verificando salud del sistema Sentinel...');

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/health',
    method: 'GET',
    timeout: 2000
};

const req = http.request(options, (res) => {
    console.log(`📡 Estado HTTP: ${res.statusCode}`);

    res.on('data', (d) => {
        console.log('📄 Respuesta:', d.toString());
    });

    if (res.statusCode === 200) {
        console.log('✅ BACKEND OPERATIVO');
        process.exit(0);
    } else {
        console.log('⚠️ BACKEND RESPONDE PERO CON ERROR');
        process.exit(1);
    }
});

req.on('error', (e) => {
    console.error(`❌ ERROR DE CONEXIÓN: ${e.message}`);
    console.log('   (Asegurate de que "npm run dev" esté corriendo)');
    process.exit(1);
});

req.on('timeout', () => {
    req.destroy();
    console.log('⏱️ TIMEOUT: El backend tarda demasiado en responder.');
    process.exit(1);
});

req.end();
