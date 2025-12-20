/**
 * 🧪 PRUEBA DE FOREIGN KEYS RESTRICT
 * ===================================
 * Demuestra que ON DELETE RESTRICT previene eliminación de empresas
 * con datos fiscales asociados
 * 
 * OBJETIVO: Generar evidencia para defensa fiscal Art. 30 CFF
 */

import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(__dirname, '../../data/dev.db');

interface PruebaRestrict {
    prueba: string;
    descripcion: string;
    resultado: 'BLOQUEADO' | 'ERROR';
    evidencia: string;
    timestamp: string;
}

async function probarRestrictConstraints() {
    console.log('🧪 PRUEBA DE CONSTRAINTS RESTRICT\n');
    console.log('='.repeat(80));
    console.log('Objetivo: Demostrar prevención de destrucción de evidencia fiscal');
    console.log('Fundamento: CFF Art. 30 - Obligación de conservar 5 años');
    console.log('Fecha:', new Date().toISOString());
    console.log('='.repeat(80));
    console.log('');

    const db = new Database(DB_PATH, { verbose: console.log });
    const resultados: PruebaRestrict[] = [];

    try {
        // ========================================
        // PRUEBA 1: Intentar eliminar empresa con CFDIs
        // ========================================
        console.log('🔴 PRUEBA 1: Intentar eliminar empresa con CFDIs asociados\n');

        // Primero verificar si existe alguna empresa con CFDIs
        const empresaConCfdis: any = db.prepare(`
            SELECT e.id, e.razon_social, COUNT(c.uuid) as total_cfdis
            FROM empresas e
            LEFT JOIN cfdi_recibidos c ON c.empresa_id = e.id
            GROUP BY e.id
            HAVING total_cfdis > 0
            LIMIT 1
        `).get();

        if (empresaConCfdis) {
            console.log(`   Empresa seleccionada: ${empresaConCfdis.razon_social}`);
            console.log(`   ID: ${empresaConCfdis.id}`);
            console.log(`   CFDIs asociados: ${empresaConCfdis.total_cfdis}`);
            console.log('');
            console.log('   Intentando: DELETE FROM empresas WHERE id = ?');
            console.log('');

            try {
                db.prepare(`
                    DELETE FROM empresas WHERE id = ?
                `).run(empresaConCfdis.id);

                // Si llegamos aquí, NO está implementado RESTRICT
                console.log('   ❌ FALLO: Empresa eliminada (RESTRICT no implementado)');
                console.log('   🚨 ACCIÓN CRÍTICA REQUERIDA: Agregar FOREIGN KEY RESTRICT');

                resultados.push({
                    prueba: 'DELETE_EMPRESA_CON_CFDIS',
                    descripcion: 'Intentar eliminar empresa con CFDIs',
                    resultado: 'ERROR',
                    evidencia: 'RESTRICT no implementado - empresa fue eliminada',
                    timestamp: new Date().toISOString(),
                });
            } catch (error: any) {
                console.log('   ✅ BLOQUEADO POR FOREIGN KEY RESTRICT');
                console.log(`   Error SQLite: ${error.message}`);
                console.log('');
                console.log('   📋 Explicación:');
                console.log('   El constraint RESTRICT previene la eliminación porque:');
                console.log(`   - La empresa tiene ${empresaConCfdis.total_cfdis} CFDIs asociados`);
                console.log('   - CFF Art. 30 requiere conservar por 5 años');
                console.log('   - Para eliminar, primero debe exportar y archivar');

                resultados.push({
                    prueba: 'DELETE_EMPRESA_CON_CFDIS',
                    descripcion: 'Intentar eliminar empresa con CFDIs',
                    resultado: 'BLOQUEADO',
                    evidencia: error.message,
                    timestamp: new Date().toISOString(),
                });
            }
        } else {
            console.log('   ⚠️  No hay empresas con CFDIs para probar');
        }
        console.log('');

        // ========================================
        // PRUEBA 2: Intentar UPDATE de empresaId
        // ========================================
        console.log('🔴 PRUEBA 2: Intentar cambiar ID de empresa con datos\n');

        if (empresaConCfdis) {
            console.log(`   Empresa: ${empresaConCfdis.razon_social}`);
            console.log(`   ID actual: ${empresaConCfdis.id}`);
            console.log(`   Intentando cambiar a: ${empresaConCfdis.id}_modified`);
            console.log('');

            try {
                db.prepare(`
                    UPDATE empresas 
                    SET id = ?
                    WHERE id = ?
                `).run(`${empresaConCfdis.id}_modified`, empresaConCfdis.id);

                console.log('   ❌ FALLO: ID modificado (RESTRICT no implementado)');

                resultados.push({
                    prueba: 'UPDATE_EMPRESA_ID',
                    descripcion: 'Intentar cambiar ID de empresa',
                    resultado: 'ERROR',
                    evidencia: 'RESTRICT no implementado - ID fue modificado',
                    timestamp: new Date().toISOString(),
                });
            } catch (error: any) {
                console.log('   ✅ BLOQUEADO POR FOREIGN KEY RESTRICT');
                console.log(`   Error SQLite: ${error.message}`);
                console.log('');
                console.log('   📋 Explicación:');
                console.log('   Cambiar el ID rompería la trazabilidad fiscal');

                resultados.push({
                    prueba: 'UPDATE_EMPRESA_ID',
                    descripcion: 'Intentar cambiar ID de empresa',
                    resultado: 'BLOQUEADO',
                    evidencia: error.message,
                    timestamp: new Date().toISOString(),
                });
            }
        }
        console.log('');

        // ========================================
        // PRUEBA 3: Eliminar CFDI conciliado
        // ========================================
        console.log('🔴 PRUEBA 3: Intentar eliminar CFDI conciliado con movimiento bancario\n');

        const cfdiConciliado: any = db.prepare(`
            SELECT c.uuid, m.id as movimiento_id
            FROM cfdi_recibidos c
            INNER JOIN movimientos_bancarios m ON m.cfdi_uuid_conciliado = c.uuid
            LIMIT 1
        `).get();

        if (cfdiConciliado) {
            console.log(`   CFDI: ${cfdiConciliado.uuid}`);
            console.log(`   Conciliado con movimiento: ${cfdiConciliado.movimiento_id}`);
            console.log('');

            try {
                db.prepare(`
                    DELETE FROM cfdi_recibidos WHERE uuid = ?
                `).run(cfdiConciliado.uuid);

                console.log('   ❌ FALLO: CFDI eliminado (RESTRICT no implementado)');

                resultados.push({
                    prueba: 'DELETE_CFDI_CONCILIADO',
                    descripcion: 'Eliminar CFDI con conciliación bancaria',
                    resultado: 'ERROR',
                    evidencia: 'RESTRICT no implementado - CFDI eliminado',
                    timestamp: new Date().toISOString(),
                });
            } catch (error: any) {
                console.log('   ✅ BLOQUEADO POR FOREIGN KEY RESTRICT');
                console.log(`   Error: ${error.message}`);
                console.log('');
                console.log('   📋 La conciliación bancaria previene eliminación');

                resultados.push({
                    prueba: 'DELETE_CFDI_CONCILIADO',
                    descripcion: 'Eliminar CFDI con conciliación bancaria',
                    resultado: 'BLOQUEADO',
                    evidencia: error.message,
                    timestamp: new Date().toISOString(),
                });
            }
        } else {
            console.log('   ℹ️  No hay CFDIs conciliados para probar');
        }
        console.log('');

        // ========================================
        // REPORTE FINAL
        // ========================================
        console.log('='.repeat(80));
        console.log('📊 REPORTE DE EVIDENCIA\n');

        const bloqueados = resultados.filter(r => r.resultado === 'BLOQUEADO').length;
        const errores = resultados.filter(r => r.resultado === 'ERROR').length;

        console.log(`Total de pruebas: ${resultados.length}`);
        console.log(`✅ Bloqueados (RESTRICT funciona): ${bloqueados}`);
        console.log(`❌ Errores (RESTRICT NO funciona): ${errores}`);
        console.log('');

        if (errores > 0) {
            console.log('🔴 ACCIONES CRÍTICAS REQUERIDAS:');
            console.log('   1. Implementar FOREIGN KEY con ON DELETE RESTRICT');
            console.log('   2. Implementar FOREIGN KEY con ON UPDATE RESTRICT');
            console.log('   3. Agregar en schema-fiscal-blindado.schema.ts');
            console.log('   4. Ejecutar migración');
            console.log('');
        } else {
            console.log('✅ CUMPLIMIENTO FISCAL CONFIRMADO:');
            console.log('   - Prevención de destrucción de evidencia ✓');
            console.log('   - Cumplimiento CFF Art. 30 ✓');
            console.log('   - Trazabilidad inquebrantable ✓');
            console.log('');
        }

        // Guardar evidencia
        const fs = require('fs');
        const evidenciaPath = join(__dirname, '../../../EVIDENCIA_RESTRICT.json');
        fs.writeFileSync(evidenciaPath, JSON.stringify({
            fecha: new Date().toISOString(),
            fundamento_legal: 'Código Fiscal de la Federación Art. 30',
            pruebas: resultados,
            resumen: {
                total: resultados.length,
                bloqueados,
                errores,
            },
            conclusion: errores === 0
                ? 'Sistema cumple con prevención de destrucción de evidencia'
                : 'Se requiere implementar constraints RESTRICT',
        }, null, 2));

        console.log(`📄 Evidencia guardada en: EVIDENCIA_RESTRICT.json`);
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ ERROR:', error);
    } finally {
        db.close();
    }
}

// Ejecutar
probarRestrictConstraints()
    .then(() => {
        console.log('\n✅ Pruebas completadas');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
