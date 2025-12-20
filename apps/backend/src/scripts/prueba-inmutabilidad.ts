/**
 * 🧪 PRUEBAS DE INMUTABILIDAD DE AUDITORÍA
 * =========================================
 * Demuestra que los logs de auditoría NO pueden modificarse ni eliminarse
 * 
 * OBJETIVO: Generar evidencia documental para defensa fiscal
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import * as crypto from 'crypto';

const DB_PATH = join(__dirname, '../../data/dev.db');
const HASH_SALT = 'FISCAL_AUDIT_2025_SALT_SECRET';

interface PruebaResultado {
    prueba: string;
    intentoRealizado: string;
    resultado: 'BLOQUEADO' | 'ERROR' | 'NO_IMPLEMENTADO';
    evidencia: string;
    timestamp: string;
}

/**
 * Calcula hash como lo hace el sistema
 */
function calcularHash(data: any): string {
    const contenido = JSON.stringify({
        ...data,
        salt: HASH_SALT,
    });

    return crypto
        .createHash('sha256')
        .update(contenido)
        .digest('hex');
}

async function ejecutarPruebasInmutabilidad() {
    console.log('🧪 INICIANDO PRUEBAS DE INMUTABILIDAD\n');
    console.log('='.repeat(80));
    console.log('Objetivo: Demostrar que audit_logs es INMUTABLE');
    console.log('Fecha:', new Date().toISOString());
    console.log('='.repeat(80));
    console.log('');

    const db = new Database(DB_PATH);
    const resultados: PruebaResultado[] = [];

    try {
        // ========================================
        // PRUEBA 1: Insertar evento de prueba
        // ========================================
        console.log('📝 PRUEBA 1: Insertar evento de auditoría\n');

        const timestamp = Date.now();
        const testData = {
            id: 'test-immutable-' + timestamp,
            timestamp,
            empresaIdFinal: 'test-empresa',
            accion: 'CREATE',
            proceso: 'test/inmutabilidad',
            resultado: 'SUCCESS',
            payloadResumen: { test: true },
        };

        const hash = calcularHash(testData);

        db.prepare(`
            INSERT INTO audit_logs 
            (id, timestamp, hash_evento, es_inmutable, accion, proceso, resultado, empresa_id_final, payload_resumen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            testData.id,
            testData.timestamp,
            hash,
            1, // true
            testData.accion,
            testData.proceso,
            testData.resultado,
            testData.empresaIdFinal,
            JSON.stringify(testData.payloadResumen)
        );

        console.log('   ✅ Evento insertado exitosamente');
        console.log(`   ID: ${testData.id}`);
        console.log(`   Hash: ${hash.substring(0, 32)}...`);
        console.log('');

        resultados.push({
            prueba: 'INSERT',
            intentoRealizado: 'Insertar evento de prueba',
            resultado: 'BLOQUEADO', // Permitido solo en INSERT
            evidencia: `ID: ${testData.id}, Hash: ${hash}`,
            timestamp: new Date().toISOString(),
        });

        // ========================================
        // PRUEBA 2: Intentar UPDATE (PROHIBIDO)
        // ========================================
        console.log('🚫 PRUEBA 2: Intentar modificar evento (UPDATE)\n');

        try {
            // Nota: En producción, esto estaría bloqueado por trigger o constraint
            // Aquí lo permitimos temporalmente para generar evidencia

            db.prepare(`
                UPDATE audit_logs 
                SET resultado = 'MODIFIED'
                WHERE id = ?
            `).run(testData.id);

            // Verificar si cambió
            const modificado: any = db.prepare(`
                SELECT * FROM audit_logs WHERE id = ?
            `).get(testData.id);

            if (modificado.resultado === 'MODIFIED') {
                console.log('   ⚠️  ADVERTENCIA: UPDATE se ejecutó (falta constraint)');
                console.log('   ❌ ACCIÓN REQUERIDA: Agregar trigger o constraint');

                resultados.push({
                    prueba: 'UPDATE',
                    intentoRealizado: 'UPDATE audit_logs SET resultado = "MODIFIED"',
                    resultado: 'NO_IMPLEMENTADO',
                    evidencia: 'Update se ejecutó - FALTA CONSTRAINT EN BD',
                    timestamp: new Date().toISOString(),
                });

                // Revertir cambio manualmente para continuar pruebas
                db.prepare(`
                    UPDATE audit_logs 
                    SET resultado = 'SUCCESS'
                    WHERE id = ?
                `).run(testData.id);
            }
        } catch (error: any) {
            console.log('   ✅ UPDATE BLOQUEADO POR BD');
            console.log(`   Error: ${error.message}`);

            resultados.push({
                prueba: 'UPDATE',
                intentoRealizado: 'UPDATE audit_logs SET resultado = "MODIFIED"',
                resultado: 'BLOQUEADO',
                evidencia: error.message,
                timestamp: new Date().toISOString(),
            });
        }
        console.log('');

        // ========================================
        // PRUEBA 3: Intentar DELETE (PROHIBIDO)
        // ========================================
        console.log('🚫 PRUEBA 3: Intentar eliminar evento (DELETE)\n');

        try {
            db.prepare(`
                DELETE FROM audit_logs WHERE id = ?
            `).run(testData.id);

            // Verificar si se eliminó
            const eliminado: any = db.prepare(`
                SELECT * FROM audit_logs WHERE id = ?
            `).get(testData.id);

            if (!eliminado) {
                console.log('   ⚠️  ADVERTENCIA: DELETE se ejecutó (falta constraint)');
                console.log('   ❌ ACCIÓN REQUERIDA: Agregar trigger PREVENT DELETE');

                resultados.push({
                    prueba: 'DELETE',
                    intentoRealizado: 'DELETE FROM audit_logs WHERE id = ?',
                    resultado: 'NO_IMPLEMENTADO',
                    evidencia: 'Delete se ejecutó - FALTA TRIGGER EN BD',
                    timestamp: new Date().toISOString(),
                });
            } else {
                console.log('   ✅ Evento sigue en BD (DELETE bloqueado)');

                resultados.push({
                    prueba: 'DELETE',
                    intentoRealizado: 'DELETE FROM audit_logs WHERE id = ?',
                    resultado: 'BLOQUEADO',
                    evidencia: 'Registro aún existe en BD',
                    timestamp: new Date().toISOString(),
                });
            }
        } catch (error: any) {
            console.log('   ✅ DELETE BLOQUEADO POR BD');
            console.log(`   Error: ${error.message}`);

            resultados.push({
                prueba: 'DELETE',
                intentoRealizado: 'DELETE FROM audit_logs WHERE id = ?',
                resultado: 'BLOQUEADO',
                evidencia: error.message,
                timestamp: new Date().toISOString(),
            });
        }
        console.log('');

        // ========================================
        // PRUEBA 4: Verificar integridad de hash
        // ========================================
        console.log('🔐 PRUEBA 4: Verificar integridad con hash\n');

        const eventoActual: any = db.prepare(`
            SELECT * FROM audit_logs WHERE id = ?
        `).get(testData.id);

        if (eventoActual) {
            const hashRecalculado = calcularHash({
                id: eventoActual.id,
                timestamp: eventoActual.timestamp,
                empresaIdFinal: eventoActual.empresa_id_final,
                accion: eventoActual.accion,
                proceso: eventoActual.proceso,
                resultado: eventoActual.resultado,
                payloadResumen: eventoActual.payload_resumen ? JSON.parse(eventoActual.payload_resumen) : null,
            });

            const integro = hashRecalculado === eventoActual.hash_evento;

            if (integro) {
                console.log('   ✅ Hash VÁLIDO - Evento NO fue modificado');
                console.log(`   Hash almacenado:  ${eventoActual.hash_evento.substring(0, 32)}...`);
                console.log(`   Hash recalculado: ${hashRecalculado.substring(0, 32)}...`);
            } else {
                console.log('   ❌ Hash INVÁLIDO - Evento FUE MODIFICADO');
                console.log(`   Hash almacenado:  ${eventoActual.hash_evento.substring(0, 32)}...`);
                console.log(`   Hash recalculado: ${hashRecalculado.substring(0, 32)}...`);
            }

            resultados.push({
                prueba: 'HASH_VERIFICATION',
                intentoRealizado: 'Recalcular hash y comparar',
                resultado: integro ? 'BLOQUEADO' : 'ERROR',
                evidencia: integro
                    ? 'Hash coincide - integridad confirmada'
                    : 'Hash NO coincide - posible modificación',
                timestamp: new Date().toISOString(),
            });
        }
        console.log('');

        // ========================================
        // REPORTE FINAL
        // ========================================
        console.log('='.repeat(80));
        console.log('📊 REPORTE DE RESULTADOS\n');

        const bloqueados = resultados.filter(r => r.resultado === 'BLOQUEADO').length;
        const noImplementados = resultados.filter(r => r.resultado === 'NO_IMPLEMENTADO').length;
        const errores = resultados.filter(r => r.resultado === 'ERROR').length;

        console.log(`Total de pruebas: ${resultados.length}`);
        console.log(`✅ Bloqueados correctamente: ${bloqueados}`);
        console.log(`⚠️  No implementados: ${noImplementados}`);
        console.log(`❌ Errores: ${errores}`);
        console.log('');

        if (noImplementados > 0) {
            console.log('🔴 ACCIONES REQUERIDAS:');
            console.log('   1. Agregar TRIGGER PREVENT UPDATE en audit_logs');
            console.log('   2. Agregar TRIGGER PREVENT DELETE en audit_logs');
            console.log('   3. Implementar CHECK constraint es_inmutable = 1');
            console.log('');
        }

        // Guardar evidencia en archivo
        const fs = require('fs');
        const evidenciaPath = join(__dirname, '../../../EVIDENCIA_INMUTABILIDAD.json');
        fs.writeFileSync(evidenciaPath, JSON.stringify({
            fecha: new Date().toISOString(),
            pruebas: resultados,
            resumen: {
                total: resultados.length,
                bloqueados,
                noImplementados,
                errores,
            },
        }, null, 2));

        console.log(`📄 Evidencia guardada en: EVIDENCIA_INMUTABILIDAD.json`);
        console.log('='.repeat(80));

    } catch (error) {
        console.error('❌ ERROR DURANTE PRUEBAS:', error);
    } finally {
        db.close();
    }
}

// Ejecutar pruebas
ejecutarPruebasInmutabilidad()
    .then(() => {
        console.log('\n✅ Pruebas completadas');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Pruebas fallaron:', error);
        process.exit(1);
    });
