const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = fs.existsSync('data/dev.db') ? 'data/dev.db' : 'sqlite/dev.db';
console.log(`Conectando a BD: ${dbPath}`);
const db = new Database(dbPath);

console.log('--- EJECUCIÓN FORENSE INICIO ---');

// 1. Verificar Tablas
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'cfdi%'").all();
console.log('Tablas CFDI:', tables.map(t => t.name));

const tabla = tables.find(t => t.name === 'cfdi') ? 'cfdi' : 'cfdi_recibidos';
console.log(`\n👉 TABLA OBJETIVO: ${tabla}`);

// 2. Verificar Columnas (Rol vs RFC)
const columns = db.prepare(`PRAGMA table_info(${tabla})`).all().map(c => c.name);
const tieneRol = columns.includes('rol');
const tieneFechaEmision = columns.includes('fecha_emision');
const campoFecha = tieneFechaEmision ? 'fecha_emision' : 'fecha';

console.log(`Esquema detectado: Fecha='${campoFecha}', Rol=${tieneRol ? 'SÍ' : 'NO'}`);

// 3. EJECUTAR QUERIES DEL USUARIO
console.log('\n--- RESULTADOS ---');

// Q1: XML Noviembre
const q1 = db.prepare(`SELECT COUNT(*) as total FROM ${tabla} WHERE strftime('%Y-%m', ${campoFecha}) = '2025-11'`).get();
console.log(`1️⃣ TOTAL XML NOVIEMBRE 2025: ${q1.total}`);

// Q2: Emitidos
let q2;
if (tieneRol) {
    q2 = db.prepare(`SELECT COUNT(*) as total FROM ${tabla} WHERE strftime('%Y-%m', ${campoFecha}) = '2025-11' AND rol = 'EMISOR'`).get();
    console.log(`2️⃣ EMITIDOS (Campo Rol): ${q2.total}`);
} else {
    // Fallback RFC si no hay rol
    q2 = db.prepare(`SELECT COUNT(*) as total FROM ${tabla} WHERE strftime('%Y-%m', ${campoFecha}) = '2025-11' AND emisor_rfc = 'TVA060209QL6'`).get();
    console.log(`2️⃣ EMITIDOS (Inferencia RFC TVA...): ${q2.total}`);
}

// Q3: Por Tipo
const q3 = db.prepare(`SELECT tipo_comprobante, COUNT(*) as count FROM ${tabla} WHERE strftime('%Y-%m', ${campoFecha}) = '2025-11' GROUP BY tipo_comprobante`).all();
console.log('3️⃣ DESGLOSE POR TIPO:');
console.log('3️⃣ DESGLOSE POR TIPO:', JSON.stringify(q3));

console.log('--- EJECUCIÓN FORENSE FIN ---');
