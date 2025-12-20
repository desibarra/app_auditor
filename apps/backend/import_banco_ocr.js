const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { createWorker } = require('tesseract.js');
const { pdf } = require('pdf-to-img');
const { randomUUID } = require('crypto');

async function main() {
    console.log('\n🚀 Importación OCR - BanBajío Sep 2025\n');

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

        // OCR
        const worker = await createWorker('spa');
        const doc = await pdf(fs.readFileSync(pdfFile.p), { scale: 1.5 });

        let txt = '';
        let p = 0;
        for await (const img of doc) {
            if (p++ >= 10) break;
            console.log(`📖 ${p}/10...`);
            txt += (await worker.recognize(img)).data.text + '\n';
        }
        await worker.terminate();

        txt = txt.toUpperCase();
        console.log(`✅ ${txt.length} chars\n`);

        // Extraer
        const movs = [];
        for (const ln of txt.split('\n')) {
            if (ln.includes('RESUMEN')) break;
            const dt = ln.match(/(\d{1,2})[\s\/\-]([A-Z]{3,12})/);
            const $ = ln.match(/[\d,]+\.\d{2}/g);
            if (dt && $) {
                const desc = ln.substring(dt[0].length).trim().substring(0, 150);
                const amt = parseFloat($[$.length >= 2 ? $.length - 2 : 0].replace(/,/g, ''));
                movs.push({
                    fecha: `2025-09-${dt[1].padStart(2, '0')}`,
                    desc: desc || 'MOV',
                    monto: amt,
                    tipo: desc.includes('ABONO') || desc.includes('CLIP') ? 'ABONO' : 'CARGO'
                });
            }
        }

        console.log(`📊 ${movs.length} movs\n`);

        // Guardar
        const ecId = randomUUID();
        db.prepare(`INSERT INTO estados_cuenta (id, empresa_id, banco, cuenta, anio, mes, archivo_path) 
            VALUES (?, 'empresa-pnk140311qm2', 'BANBAJÍO', '****', 2025, 9, ?)`).run(ecId, `/uploads/bancos/empresa-pnk140311qm2/${pdfFile.n}`);

        const ins = db.prepare(`INSERT INTO movimientos_bancarios (id, estado_cuenta_id, fecha, descripcion, monto, tipo, conciliado) 
            VALUES (?, ?, ?, ?, ?, ?, 0)`);

        movs.forEach(m => {
            const $ = m.tipo === 'CARGO' ? -Math.abs(m.monto) : Math.abs(m.monto);
            ins.run(randomUUID(), ecId, m.fecha, m.desc, $, m.tipo);
        });

        db.close();
        console.log(`✅ ${movs.length} importados!\nRecarga: http://localhost:3001/bancos\n`);

    } catch (e) {
        console.error('❌', e.message);
    }
}

main();
