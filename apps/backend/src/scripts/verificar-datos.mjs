import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../data/dev.db');
const db = new Database(dbPath, { readonly: true });

let output = '# VERIFICACION DE DATOS - KONTIFY SENTINEL\n\n';

// 1. Empresas
const empresas = db.prepare(`
  SELECT id, razon_social, rfc 
  FROM empresas 
  ORDER BY razon_social
`).all();

output += `## EMPRESAS DISPONIBLES (${empresas.length})\n\n`;
empresas.forEach((emp, idx) => {
    output += `${idx + 1}. ${emp.razon_social} (${emp.rfc})\n`;
    output += `   ID: ${emp.id}\n\n`;
});

// 2. Por cada empresa
empresas.forEach((empresa) => {
    output += `\n${'='.repeat(80)}\n`;
    output += `\n## EMPRESA: ${empresa.razon_social}\n`;
    output += `RFC: ${empresa.rfc}\n`;
    output += `ID: ${empresa.id}\n\n`;

    // Query 1
    output += `### QUERY 1: Total CFDIs por Tipo\n\n`;
    const totales = db.prepare(`
    SELECT tipo_comprobante, COUNT(*) as total
    FROM cfdi_recibidos
    WHERE empresa_id = ?
    GROUP BY tipo_comprobante
  `).all(empresa.id);

    if (totales.length > 0) {
        totales.forEach(row => {
            output += `- ${row.tipo_comprobante}: ${row.total} CFDIs\n`;
        });
    } else {
        output += `- Sin CFDIs registrados\n`;
    }

    // Query 2 - LA MAS IMPORTANTE
    output += `\n### QUERY 2: CFDIs por Periodo Fiscal y Tipo (CRITICA)\n\n`;
    const porPeriodo = db.prepare(`
    SELECT 
      strftime('%Y-%m', fecha) as periodo_fiscal,
      tipo_comprobante,
      COUNT(*) as total
    FROM cfdi_recibidos
    WHERE empresa_id = ?
    GROUP BY periodo_fiscal, tipo_comprobante
    ORDER BY periodo_fiscal DESC, tipo_comprobante
  `).all(empresa.id);

    if (porPeriodo.length > 0) {
        let mesActual = '';
        porPeriodo.forEach(row => {
            if (row.periodo_fiscal !== mesActual) {
                output += `\n**${row.periodo_fiscal}:**\n`;
                mesActual = row.periodo_fiscal;
            }
            output += `  - ${row.tipo_comprobante}: ${row.total}\n`;
        });
    } else {
        output += `- Sin datos por periodo\n`;
    }

    // Query 3 - Analisis de patrones
    output += `\n### QUERY 3: Analisis de Patrones\n\n`;

    const totalMeses = db.prepare(`
    SELECT COUNT(DISTINCT strftime('%Y-%m', fecha)) as meses
    FROM cfdi_recibidos
    WHERE empresa_id = ?
  `).get(empresa.id);

    if (totalMeses.meses > 0) {
        const mesesI = db.prepare(`SELECT COUNT(DISTINCT strftime('%Y-%m', fecha)) as m FROM cfdi_recibidos WHERE empresa_id = ? AND tipo_comprobante = 'I'`).get(empresa.id);
        const mesesE = db.prepare(`SELECT COUNT(DISTINCT strftime('%Y-%m', fecha)) as m FROM cfdi_recibidos WHERE empresa_id = ? AND tipo_comprobante = 'E'`).get(empresa.id);
        const mesesP = db.prepare(`SELECT COUNT(DISTINCT strftime('%Y-%m', fecha)) as m FROM cfdi_recibidos WHERE empresa_id = ? AND tipo_comprobante = 'P'`).get(empresa.id);

        output += `Total meses con CFDIs: ${totalMeses.meses}\n\n`;
        output += `| Tipo | Meses | Porcentaje |\n`;
        output += `|------|-------|------------|\n`;
        output += `| I    | ${mesesI.m}     | ${((mesesI.m / totalMeses.meses) * 100).toFixed(0)}% |\n`;
        output += `| E    | ${mesesE.m}     | ${((mesesE.m / totalMeses.meses) * 100).toFixed(0)}% |\n`;
        output += `| P    | ${mesesP.m}     | ${((mesesP.m / totalMeses.meses) * 100).toFixed(0)}% |\n`;

        const threshold = Math.max(3, Math.ceil(totalMeses.meses * 0.6));
        output += `\n**Threshold:** ${threshold} meses (60% de ${totalMeses.meses})\n\n`;
        output += `**Tipos ESPERADOS:**\n`;
        if (mesesI.m >= threshold) output += `- Ingreso (I) ✓\n`;
        if (mesesE.m >= threshold) output += `- Egreso (E) ✓\n`;
        if (mesesP.m >= threshold) output += `- Pago (P) ✓\n`;
    }

    output += `\n`;
});

db.close();

// Guardar en archivo
const outputPath = join(__dirname, 'VERIFICACION_DATOS.md');
writeFileSync(outputPath, output, 'utf8');

console.log('Reporte generado en:', outputPath);
