/**
 * VERIFICACIÓN PREVIA - CFDI EMITIDOS
 * ====================================
 * 
 * Protocolo SAT-Grade v1.0 - SQL PRIMERO
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../data/dev.db');
const db = new Database(dbPath, { readonly: true });

let output = '# VERIFICACION CFDI EMITIDOS - SQL PRIMERO\n\n';
output += '**Fecha:** ' + new Date().toISOString() + '\n';
output += '**Protocolo:** SAT-Grade v1.0\n\n';
output += '---\n\n';

// 1. Verificar estructura de tabla
output += '## 1. ESTRUCTURA DE TABLA cfdi_recibidos\n\n';
const tableInfo = db.prepare(`PRAGMA table_info(cfdi_recibidos)`).all();

output += '### Columnas disponibles:\n\n';
tableInfo.forEach(col => {
    output += `- ${col.name} (${col.type})\n`;
});

// Verificar si existe rol_cfdi
const tieneRolCfdi = tableInfo.some(col => col.name === 'rol_cfdi');
output += `\n**¿Existe columna 'rol_cfdi'?** ${tieneRolCfdi ? '✅ SÍ' : '❌ NO'}\n\n`;

// 2. Obtener empresas
output += '## 2. EMPRESAS EN BD\n\n';
const empresas = db.prepare(`
  SELECT id, razon_social, rfc 
  FROM empresas 
  ORDER BY razon_social
`).all();

output += `Total empresas: ${empresas.length}\n\n`;

// 3. Para cada empresa, verificar CFDIs emitidos
empresas.forEach((empresa) => {
    output += `### ${empresa.razon_social} (${empresa.rfc})\n\n`;

    // Query: CFDIs donde empresa es EMISOR
    const emitidos = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT strftime('%Y-%m', fecha)) as meses,
      SUM(total) as importe_total
    FROM cfdi_recibidos
    WHERE emisor_rfc = ?
  `).get(empresa.rfc);

    // Query: CFDIs donde empresa es RECEPTOR (recibidos)
    const recibidos = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT strftime('%Y-%m', fecha)) as meses,
      SUM(total) as importe_total
    FROM cfdi_recibidos
    WHERE receptor_rfc = ?
  `).get(empresa.rfc);

    output += '**CFDI EMITIDOS** (emisor_rfc = empresa):\n';
    output += `- Total: ${emitidos.total}\n`;
    output += `- Meses: ${emitidos.meses}\n`;
    output += `- Importe: $${(emitidos.importe_total || 0).toLocaleString('es-MX')}\n\n`;

    output += '**CFDI RECIBIDOS** (receptor_rfc = empresa):\n';
    output += `- Total: ${recibidos.total}\n`;
    output += `- Meses: ${recibidos.meses}\n`;
    output += `- Importe: $${(recibidos.importe_total || 0).toLocaleString('es-MX')}\n\n`;

    // Si hay emitidos, mostrar detalle por mes
    if (emitidos.total > 0) {
        output += '#### Detalle EMITIDOS por mes:\n\n';
        const porMes = db.prepare(`
      SELECT 
        strftime('%Y-%m', fecha) as periodo,
        tipo_comprobante,
        COUNT(*) as total,
        SUM(total) as importe
      FROM cfdi_recibidos
      WHERE emisor_rfc = ?
      GROUP BY periodo, tipo_comprobante
      ORDER BY periodo DESC
    `).all(empresa.rfc);

        let mesActual = '';
        porMes.forEach(row => {
            if (row.periodo !== mesActual) {
                output += `\n**${row.periodo}:**\n`;
                mesActual = row.periodo;
            }
            output += `- ${row.tipo_comprobante}: ${row.total} CFDIs ($${row.importe.toLocaleString('es-MX')})\n`;
        });
        output += '\n';
    }

    output += '---\n\n';
});

// 4. CONCLUSIONES
output += '## 3. CONCLUSIONES\n\n';

const totalEmitidos = db.prepare(`
  SELECT COUNT(*) as total
  FROM cfdi_recibidos c
  JOIN empresas e ON c.emisor_rfc = e.rfc
`).get();

const totalRecibidos = db.prepare(`
  SELECT COUNT(*) as total
  FROM cfdi_recibidos c
  JOIN empresas e ON c.receptor_rfc = e.rfc
`).get();

output += `- Total CFDIs EMITIDOS en BD: ${totalEmitidos.total}\n`;
output += `- Total CFDIs RECIBIDOS en BD: ${totalRecibidos.total}\n\n`;

if (!tieneRolCfdi) {
    output += '### ⚠️ ACCIÓN REQUERIDA\n\n';
    output += 'No existe columna `rol_cfdi` en la tabla.\n\n';
    output += '**Opciones:**\n';
    output += '1. Agregar columna `rol_cfdi` en schema\n';
    output += '2. Usar query basada en `emisor_rfc = empresa.rfc`\n\n';
    output += '**Recomendación:** Opción 2 (no requiere migración)\n\n';
}

output += '### ✅ DATOS DISPONIBLES PARA IMPLEMENTACIÓN\n\n';
output += `- Hay ${totalEmitidos.total} CFDIs emitidos identificables\n`;
output += '- Query funcional: `emisor_rfc = empresa.rfc`\n';
output += '- Listo para crear endpoints dedicados\n\n';

db.close();

// Guardar reporte
const outputPath = join(__dirname, 'VERIFICACION_CFDI_EMITIDOS.md');
writeFileSync(outputPath, output, 'utf8');

console.log('✅ Verificación completada');
console.log('📄 Reporte:', outputPath);
