-- Listar usuario demo
SELECT id, email FROM usuarios WHERE email = 'demo@saas-fiscal.com';

-- Listar empresa de prueba
SELECT * FROM empresas WHERE rfc = 'TEST123456789';

-- Listar CFDI generados
SELECT id, uuid, concepto, monto_iva, fecha_emision FROM cfdi WHERE empresa_id = (SELECT id FROM empresas WHERE rfc = 'TEST123456789');

-- Listar expedientes de devolución
SELECT * FROM expedientes_devolucion_iva WHERE empresa_id = (SELECT id FROM empresas WHERE rfc = 'TEST123456789');

-- Listar cédulas generadas
SELECT * FROM cedulas_iva WHERE expediente_id IN (SELECT id FROM expedientes_devolucion_iva WHERE empresa_id = (SELECT id FROM empresas WHERE rfc = 'TEST123456789'));