/**
 * Script de Inspección de Base de Datos
 * Verifica las tablas y estructura antes de ejecutar la corrección
 */

import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(__dirname, '../../data/dev.db');

function inspeccionarDB() {
    console.log(`📂 Inspeccionando base de datos: ${DB_PATH}\n`);

    const db = new Database(DB_PATH, { readonly: true });

    try {
        // Obtener todas las tablas
        const tables = db.prepare(`
            SELECT name FROM sqlite_master 
            WHERE type='table'  
            ORDER BY name
        `).all() as any[];

        console.log(`📊 Tablas encontradas (${tables.length}):`);
        tables.forEach((t, i) => console.log(`   ${i + 1}. ${t.name}`));
        console.log('');

        // Ver estructura de empresas
        if (tables.some(t => t.name === 'empresas')) {
            console.log('🏢 Empresas registradas:');
            const empresas = db.prepare('SELECT * FROM empresas').all() as any[];
            empresas.forEach(e => {
                console.log(`   - ${e.razon_social || e.razonSocial}`);
                console.log(`     RFC: ${e.rfc}`);
                console.log(`     ID: ${e.id}`);
                console.log('');
            });
        }

        // Ver conteo de CFDIs por empresa
        const cfdiTable = tables.find(t => t.name.includes('cfdi'));
        if (cfdiTable) {
            console.log(`📄 CFDIs en tabla "${cfdiTable.name}":`);
            const cfdis = db.prepare(`SELECT empresa_id, COUNT(*) as total FROM ${cfdiTable.name} GROUP BY empresa_id`).all() as any[];
            cfdis.forEach(c => {
                console.log(`   Empresa ${c.empresa_id}: ${c.total} CFDIs`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        db.close();
    }
}

inspeccionarDB();
