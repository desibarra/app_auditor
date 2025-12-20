import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../data/dev.db');
const db = new Database(dbPath, { readonly: true });

const empresaRfc = 'TVA060209QL6';

console.log('🔍 AUDITORIA SAT-GRADE: DISTRIBUCIÓN DE TIPOS');
console.log('Empresa:', empresaRfc);
console.log('-------------------------------------------');

// 1. EMITIDOS (Rol: EMITIDO)
console.log('\n📤 EMITIDOS (emisor_rfc = empresa)');
const emitidos = db.prepare(`
  SELECT tipo_comprobante, COUNT(*) as total, SUM(total) as importe
  FROM cfdi_recibidos
  WHERE emisor_rfc = ?
  GROUP BY tipo_comprobante
`).all(empresaRfc);

if (emitidos.length === 0) console.log('  (Sin datos)');
emitidos.forEach(r => {
    let dominio = 'DESCONOCIDO';
    if (r.tipo_comprobante === 'I') dominio = 'INGRESOS';
    if (r.tipo_comprobante === 'E') dominio = 'EGRESOS';
    if (r.tipo_comprobante === 'P') dominio = 'PAGOS';
    if (r.tipo_comprobante === 'N') dominio = 'NOMINA';
    if (r.tipo_comprobante === 'T') dominio = 'TRASLADOS';

    console.log(`  [${r.tipo_comprobante}] -> ${dominio}: ${r.total} CFDIs ($${r.importe})`);
});

// 2. RECIBIDOS (Rol: RECIBIDO)
console.log('\n📥 RECIBIDOS (receptor_rfc = empresa)');
const recibidos = db.prepare(`
  SELECT tipo_comprobante, COUNT(*) as total, SUM(total) as importe
  FROM cfdi_recibidos
  WHERE receptor_rfc = ?
  GROUP BY tipo_comprobante
`).all(empresaRfc);

if (recibidos.length === 0) console.log('  (Sin datos)');
recibidos.forEach(r => {
    let dominio = 'DESCONOCIDO';
    if (r.tipo_comprobante === 'I') dominio = 'INGRESOS (Gasto?)';
    if (r.tipo_comprobante === 'E') dominio = 'EGRESOS';
    if (r.tipo_comprobante === 'P') dominio = 'PAGOS';
    if (r.tipo_comprobante === 'N') dominio = 'NOMINA';

    console.log(`  [${r.tipo_comprobante}] -> ${dominio}: ${r.total} CFDIs ($${r.importe})`);
});
