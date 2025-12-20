/**
 * Script de Corrección de Asignación de CFDIs
 * 
 * Problema: 568 XMLs fueron asignados a KOPPARA cuando deberían estar en Traslados de Vanguardia
 * Causa: El usuario estaba en el perfil de KOPPARA al momento de la carga
 * Solución: Reasignar CFDIs basándose en el RFC receptor del XML
 */

import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(__dirname, '../../data/dev.db');

interface Empresa {
    id: string;
    rfc: string;
    razon_social: string;
}

interface CfdiMalAsignado {
    uuid: string;
    receptor_rfc: string;
    emisor_nombre: string;
    total: number;
    empresa_id_actual: string;
    empresa_id_correcto: string;
}

async function corregirAsignacionCfdis() {
    console.log('🔍 Iniciando auditoría y corrección de CFDIs...\n');

    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');

    try {
        // 1. Obtener todas las empresas registradas
        console.log('📊 Paso 1: Obteniendo empresas registradas...');
        const empresas = db.prepare(`
            SELECT id, rfc, razon_social 
            FROM empresas 
            WHERE activa = 1
        `).all() as Empresa[];

        console.log(`   ✓ Encontradas ${empresas.length} empresas activas:`);
        empresas.forEach(e => console.log(`     - ${e.razon_social} (${e.rfc}) [ID: ${e.id}]`));
        console.log('');

        // Crear un mapa RFC -> EmpresaID para búsqueda rápida
        const rfcToEmpresaId = new Map<string, string>();
        empresas.forEach(e => rfcToEmpresaId.set(e.rfc.toUpperCase(), e.id));

        // 2. Encontrar CFDIs mal asignados
        console.log('🔎 Paso 2: Buscando CFDIs mal asignados...');
        const todosLosCfdis = db.prepare(`
            SELECT 
                uuid,
                receptor_rfc,
                emisor_nombre,
                total,
                empresa_id,
                fecha_importacion
            FROM cfdi_recibidos
            ORDER BY fecha_importacion DESC
        `).all() as any[];

        const cfdisParaCorregir: CfdiMalAsignado[] = [];

        for (const cfdi of todosLosCfdis) {
            const empresaIdCorrecta = rfcToEmpresaId.get(cfdi.receptor_rfc.toUpperCase());

            if (empresaIdCorrecta && empresaIdCorrecta !== cfdi.empresa_id) {
                cfdisParaCorregir.push({
                    uuid: cfdi.uuid,
                    receptor_rfc: cfdi.receptor_rfc,
                    emisor_nombre: cfdi.emisor_nombre,
                    total: cfdi.total,
                    empresa_id_actual: cfdi.empresa_id,
                    empresa_id_correcto: empresaIdCorrecta,
                });
            }
        }

        console.log(`   ✓ Encontrados ${cfdisParaCorregir.length} CFDIs mal asignados\n`);

        if (cfdisParaCorregir.length === 0) {
            console.log('✅ No hay CFDIs que corregir. Todo está en orden.');
            db.close();
            return;
        }

        // 3. Mostrar resumen por empresa
        console.log('📋 Paso 3: Resumen de correcciones por empresa:');
        const porEmpresa = new Map<string, { actual: string, correcto: string, count: number }>();

        for (const cfdi of cfdisParaCorregir) {
            const key = `${cfdi.empresa_id_actual}→${cfdi.empresa_id_correcto}`;
            if (!porEmpresa.has(key)) {
                porEmpresa.set(key, {
                    actual: cfdi.empresa_id_actual,
                    correcto: cfdi.empresa_id_correcto,
                    count: 0
                });
            }
            porEmpresa.get(key)!.count++;
        }

        porEmpresa.forEach((info, key) => {
            const empresaActual = empresas.find(e => e.id === info.actual);
            const empresaCorrecta = empresas.find(e => e.id === info.correcto);
            console.log(`   ${info.count} CFDIs: ${empresaActual?.razon_social || info.actual} → ${empresaCorrecta?.razon_social || info.correcto}`);
        });
        console.log('');

        // 4. Confirmar y ejecutar corrección
        console.log('⚙️  Paso 4: Ejecutando corrección...');

        const updateStmt = db.prepare(`
            UPDATE cfdi_recibidos 
            SET empresa_id = ?, 
                fecha_actualizacion = ?
            WHERE uuid = ?
        `);

        const transaction = db.transaction((cfdis: CfdiMalAsignado[]) => {
            let corregidos = 0;
            const timestamp = Date.now();

            for (const cfdi of cfdis) {
                updateStmt.run(cfdi.empresa_id_correcto, timestamp, cfdi.uuid);
                corregidos++;

                if (corregidos % 100 === 0) {
                    console.log(`   Procesados: ${corregidos}/${cfdis.length}...`);
                }
            }

            return corregidos;
        });

        const totalCorregidos = transaction(cfdisParaCorregir);
        console.log(`   ✓ Corregidos: ${totalCorregidos} CFDIs\n`);

        // 5. Verificación final
        console.log('✅ Paso 5: Verificación final...');

        for (const empresa of empresas) {
            const count = db.prepare(`
                SELECT COUNT(*) as total
                FROM cfdi_recibidos
                WHERE empresa_id = ?
            `).get(empresa.id) as any;

            console.log(`   ${empresa.razon_social}: ${count.total} CFDIs`);
        }

        console.log('\n🎉 ¡Corrección completada exitosamente!');
        console.log('\n📝 Reporte generado:');
        console.log(`   - Total de CFDIs corregidos: ${totalCorregidos}`);
        console.log(`   - Archivo de base de datos: ${DB_PATH}`);

    } catch (error) {
        console.error('❌ Error durante la corrección:', error);
        throw error;
    } finally {
        db.close();
    }
}

// Ejecutar script
corregirAsignacionCfdis()
    .then(() => {
        console.log('\n✓ Script finalizado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n✗ Script falló:', error);
        process.exit(1);
    });
