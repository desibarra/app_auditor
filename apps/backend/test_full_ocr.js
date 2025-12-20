const fs = require('fs');
const path = require('path');

async function fullOCRTest() {
    console.log('\n🚀 Prueba completa de extracción OCR...\n');

    try {
        const { createWorker } = require('tesseract.js');
        const { pdf } = require('pdf-to-img');

        const bancosDir = path.join(__dirname, 'uploads', 'bancos', 'empresa-pnk140311qm2');
        const files = fs.readdirSync(bancosDir)
            .filter(f => f.endsWith('.pdf'))
            .map(f => ({
                name: f,
                path: path.join(bancosDir, f),
                mtime: fs.statSync(path.join(bancosDir, f)).mtime
            }))
            .sort((a, b) => b.mtime - a.mtime);

        const latestFile = files[0];
        console.log(`📄 Archivo: ${latestFile.name}\n`);

        const buffer = fs.readFileSync(latestFile.path);

        const worker = await createWorker('spa');
        console.log('✅ Worker inicializado\n');

        const document = await pdf(buffer, { scale: 1.5 });
        let fullText = '';
        let pageCount = 0;
        const MAX_PAGES = 5;

        console.log('📖 Procesando páginas...\n');
        for await (const image of document) {
            if (pageCount >= MAX_PAGES) break;

            pageCount++;
            console.log(`Procesando página ${pageCount}/${MAX_PAGES}...`);

            const start = Date.now();
            const { data: { text } } = await worker.recognize(image);
            const elapsed = ((Date.now() - start) / 1000).toFixed(1);

            fullText += text + '\n\n';
            console.log(`  ✅ ${text.length} caracteres en ${elapsed}s`);
        }

        await worker.terminate();

        const pdfText = fullText.toUpperCase();
        console.log(`\n📊 Total: ${pdfText.length} caracteres de ${pageCount} páginas\n`);

        // Probar extracción de movimientos
        const lines = pdfText.split('\n');
        const dateRegex = /(\d{1,2})[\s\/\-]([A-Z]{3,12}|[A-Z]{2}\.?|\d{2})(?:[\s\/\-]\d{2,4})?/;
        const moneyRegex = /(-?[\d,]{1,}\.\d{2})/g;

        let movimientos = [];

        for (const line of lines) {
            const trimmed = line.trim();
            const dateMatch = trimmed.match(dateRegex);
            const moneyMatches = trimmed.match(moneyRegex);

            if (dateMatch && moneyMatches && moneyMatches.length >= 1) {
                movimientos.push({
                    fecha: dateMatch[0],
                    descripcion: trimmed.substring(0, 80),
                    montos: moneyMatches
                });
            }
        }

        console.log('═'.repeat(80));
        console.log(`✅ MOVIMIENTOS DETECTADOS: ${movimientos.length}`);
        console.log('═'.repeat(80));

        if (movimientos.length > 0) {
            console.log('\n📋 PRIMEROS 10 MOVIMIENTOS:\n');
            movimientos.slice(0, 10).forEach((mov, i) => {
                console.log(`${i + 1}. Fecha: ${mov.fecha}`);
                console.log(`   Descripción: ${mov.descripcion}`);
                console.log(`   Montos: ${mov.montos.join(', ')}\n`);
            });
        }

        console.log(`\n🎯 Objetivo: 56 movimientos`);
        console.log(`📍 Detectados: ${movimientos.length} movimientos`);
        console.log(`${movimientos.length >= 50 ? '✅' : '⚠️'} ${movimientos.length >= 50 ? 'ÉXITO' : 'PARCIAL'}\n`);

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
    }
}

fullOCRTest().catch(console.error);
