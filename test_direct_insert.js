const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'apps/backend/data/dev_v5.db');
console.log('Testing INSERT en DB:', dbPath);

try {
    const db = new Database(dbPath);

    // Test INSERT directo
    const stmt = db.prepare(`
        INSERT INTO empresas (id, rfc, razon_social, activa, configuracion, sat_auth_mode, sat_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        'test-id-direct',
        'TESTDIRECT001',
        'Test Direct Insert SA',
        1,
        '{}',
        'NONE',
        'DISCONNECTED'
    );

    console.log('✅ INSERT directo EXITOSO:', result);

    // Verificar que existe
    const check = db.prepare('SELECT * FROM empresas WHERE id = ?').get('test-id-direct');
    console.log('Registro insertado:', check);

    // Limpiar
    db.prepare('DELETE FROM empresas WHERE id = ?').run('test-id-direct');
    console.log('✅ Test completo - La DB funciona correctamente');

} catch (error) {
    console.error('❌ ERROR en test directo:', error);
}
