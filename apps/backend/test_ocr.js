const fs = require('fs');
const path = require('path');

async function testOCR() {
    console.log('\n🔍 Probando OCR con Tesseract.js...\n');

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
        console.log(`📄 Archivo: ${latestFile.name}`);
        console.log(`📅 Fecha: ${latestFile.mtime}\n`);

        const buffer = fs.readFileSync(latestFile.path);

        console.log('Inicializando worker OCR...');
        const worker = await createWorker('spa');
        console.log('✅ Worker inicializado\n');

        console.log('Convirtiendo PDF a imágenes...');
        const document = await pdf(buffer, { scale: 2.0 });
        console.log('✅ PDF convertido\n');

        let fullText = '';
        let pageCount = 0;

        console.log('Procesando páginas...\n');
        for await (const image of document) {
            pageCount++;
            console.log(`Procesando página ${pageCount}...`);

            const { data: { text } } = await worker.recognize(image);
            fullText += text + '\n\n';
            console.log(`  ✅ ${text.length} caracteres extraídos`);

            if (pageCount >= 2) {  // Solo primeras 2 páginas para prueba
                console.log('\n⏸️ Deteniendo en página 2 para prueba...');
                break;
            }
        }

        await worker.terminate();

        const pdfText = fullText.toUpperCase();

        console.log('\n' + '─'.repeat(80));
        console.log('PRIMEROS 1000 CARACTERES:');
        console.log('─'.repeat(80));
        console.log(pdfText.substring(0, 1000));
        console.log('─'.repeat(80));
        console.log(`\n✅ Total: ${pdfText.length} caracteres de ${pageCount} páginas\n`);

        // Probar regex
        const lines = pdfText.split('\n');
        const dateRegex = /(\d{1,2})[\s\/\-]([A-Z]{3,12}|[A-Z]{2}\.?|\d{2})(?:[\s\/\-]\d{2,4})?/;
        const moneyRegex = /(-?[\d,]{1,}\.\d{2})/g;

        let matches = 0;
        console.log('🔍 PRIMERAS 5 LÍNEAS CON COINCIDENCIAS:\n');

        for (let i = 0; i < lines.length && matches < 5; i++) {
            const line = lines[i].trim();
            const dateMatch = line.match(dateRegex);
            const moneyMatches = line.match(moneyRegex);

            if (dateMatch && moneyMatches && moneyMatches.length >= 1) {
                matches++;
                console.log(`Línea ${i}:`);
                console.log(`  ${line.substring(0, 120)}`);
                console.log(`  Fecha: ${dateMatch[0]} | Montos: ${moneyMatches.join(', ')}\n`);
            }
        }

        console.log(`✅ Total coincidencias: ${matches}\n`);

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    }
}

testOCR().catch(console.error);
