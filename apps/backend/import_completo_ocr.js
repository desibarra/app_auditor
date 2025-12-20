const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { createWorker } = require('tesseract.js');
const { pdf } = require('pdf-to-img');
const { randomUUID } = require('crypto');

async function main() {
    console.log('\n🚀 Importación OCR COMPLETA - BanBajío Sep 2025\n');

    try {
        const dbPath = path.join(__dirname, '../../saas_fiscal.db');
        const db = new Database(dbPath);

        // Limpiar periodo
        db.prepare(`DELETE FROM movimientos_bancarios WHERE estado_cuenta_id IN 
            (SELECT id FROM estados_cuenta WHERE empresa_id = 'empresa-pnk140311qm2' AND anio = 2025 AND mes = 9)`).run();
        db.prepare(`DELETE FROM estados_cuenta WHERE empresa_id = 'empresa-pnk140311qm2' AND anio = 2025 AND mes = 9`).run();

        // Buscar PDF
        const dir = path.join(__dirname, 'uploads', 'bancos', 'empresa-pnk140311qm2');
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'))
            .map(f => ({ n: f, p: path.join(dir, f), t: fs.statSync(path.join(dir, f)).mtime }))
            .sort((a, b) => b.t - a.t);

        const pdfFile = files[0];
        console.log(`📄 ${pdfFile.n}\n`);

        // OCR - TODAS las páginas
        const worker = await createWorker('spa');
        const doc = await pdf(fs.readFileSync(pdfFile.p), { scale: 1.5 });

        let txt = '';
        let p = 0;
        for await (const img of doc) {
            p++;
            console.log(`📖 ${p}...`);
            txt += (await worker.recognize(img)).data.text + '\n';
        }
        await worker.terminate();

        txt = txt.toUpperCase();
        console.log(`✅ ${txt.length} chars de ${p} páginas\n`);

        // Extraer movimientos - REGEX MEJORADO
        const movs = [];
        const lines = txt.split('\n');

        // Regex más flexible para fechas: "1 SEP", "01 SEP", "1SEP", "01SEP"
        const dateRegex = /(\d{1,2})\s*(SEP|SEPT|SEPTIEMBRE)/i;
        // Money: buscar patrones de dinero con $ o sin $
        const moneyRegex = /\$?\s*[\d,]+\.\d{2}/g;

        for (let i = 0; i < lines.length; i++) {
            const ln = lines[i].trim();

            // Detener si llegamos a secciones de resumen
            if (ln.includes('RESUMEN') || ln.includes('TOTAL DE MOVIMIENTOS') ||
                ln.includes('SALDO PROMEDIO') || ln.includes('DIAS TRANSCURRIDOS')) {
                console.log(`⏸️ Detenido en línea con: ${ln.substring(0, 50)}`);
                break;
            }

            const dtMatch = ln.match(dateRegex);
            const moneyMatches = ln.match(moneyRegex);

            if (dtMatch && moneyMatches && moneyMatches.length >= 1) {
                // Extraer descripción (todo entre la fecha y los montos)
                let desc = ln.substring(dtMatch[0].length).trim();

                // Quitar los montos de la descripción
                moneyMatches.forEach(m => {
                    desc = desc.replace(m, '');
                });
                desc = desc.replace(/\s{2,}/g, ' ').trim().substring(0, 200);

                // Obtener montos
                const amounts = moneyMatches.map(m => parseFloat(m.replace(/[$,\s]/g, '')));

                // Heurística: si hay 3 montos, probablemente son [deposito, cargo, saldo]
                // Si hay 2: [monto, saldo]
                // Si hay 1: [monto]
                let deposito = 0;
                let cargo = 0;

                if (amounts.length >= 3) {
                    deposito = amounts[0];
                    cargo = amounts[1];
                } else if (amounts.length >= 2) {
                    // Determinar si es cargo o abono por palabras clave
                    if (desc.includes('ABONO') || desc.includes('DEPOSITO') ||
                        desc.includes('CLIP') || desc.includes('STRIPE') ||
                        desc.includes('TRANSFERENCIA RECIBIDA')) {
                        deposito = amounts[0];
                    } else {
                        cargo = amounts[0];
                    }
                } else {
                    // Solo un monto, usar heurística de descripción
                    if (desc.includes('ABONO') || desc.includes('DEPOSITO') || desc.includes('CLIP')) {
                        deposito = amounts[0];
                    } else {
                        cargo = amounts[0];
                    }
                }

                // Si tenemos un monto válido, agregarlo
                if (deposito > 0 || cargo > 0) {
                    movs.push({
                        fecha: `2025-09-${dtMatch[1].padStart(2, '0')}`,
                        desc: desc || 'MOVIMIENTO BANCARIO',
                        deposito: deposito,
                        cargo: cargo
                    });
                }
            }
        }

        console.log(`📊 ${movs.length} movimientos extraídos\n`);

        // Calcular totales
        const totalDepositos = movs.reduce((sum, m) => sum + m.deposito, 0);
        const totalCargos = movs.reduce((sum, m) => sum + m.cargo, 0);

        console.log(`💰 Total Depósitos: $${totalDepositos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
        console.log(`💸 Total Cargos: $${totalCargos.toLocaleString('es-MX', { minimumFractionDigits: 2 })}\n`);

        // Guardar
        const ecId = randomUUID();
        db.prepare(`INSERT INTO estados_cuenta (id, empresa_id, banco, cuenta, anio, mes, archivo_path) 
            VALUES (?, 'empresa-pnk140311qm2', 'BANBAJÍO', '****', 2025, 9, ?)`).run(ecId, `/uploads/bancos/empresa-pnk140311qm2/${pdfFile.n}`);

        const ins = db.prepare(`INSERT INTO movimientos_bancarios (id, estado_cuenta_id, fecha, descripcion, monto, tipo, conciliado) 
            VALUES (?, ?, ?, ?, ?, ?, 0)`);

        movs.forEach(m => {
            if (m.deposito > 0) {
                ins.run(randomUUID(), ecId, m.fecha, `${m.desc} [ABONO]`, m.deposito, 'ABONO');
            }
            if (m.cargo > 0) {
                ins.run(randomUUID(), ecId, m.fecha, `${m.desc} [CARGO]`, -m.cargo, 'CARGO');
            }
        });

        const totalMovs = movs.reduce((sum, m) => sum + (m.deposito > 0 ? 1 : 0) + (m.cargo > 0 ? 1 : 0), 0);

        db.close();
        console.log(`✅ ${totalMovs} movimientos guardados\n`);
        console.log('Ejecuta: node copy_data.js\n');

    } catch (e) {
        console.error('❌', e.message);
    }
}

main();
