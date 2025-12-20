const fs = require('fs');
const path = require('path');

async function testPdfJs() {
    console.log('\n🔍 Probando extracción con pdfjs-dist...\n');

    // Buscar el PDF más reciente
    const bancosDir = path.join(__dirname, 'uploads', 'bancos', 'empresa-pnk140311qm2');
    const files = fs.readdirSync(bancosDir)
        .filter(f => f.endsWith('.pdf'))
        .map(f => ({
            name: f,
            path: path.join(bancosDir, f),
            mtime: fs.statSync(path.join(bancosDir, f)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) {
        console.log('❌ No se encontraron archivos PDF');
        return;
    }

    const latestFile = files[0];
    console.log(`📄 Archivo: ${latestFile.name}`);
    console.log(`📅 Fecha: ${latestFile.mtime}\n`);

    const buffer = fs.readFileSync(latestFile.path);

    try {
        // Importar pdfjs-dist
        const pdfjsLib = require('pdfjs-dist');
        console.log('✅ pdfjs-dist cargado correctamente\n');

        // Cargar el PDF
        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const pdfDocument = await loadingTask.promise;

        console.log(`📊 Páginas: ${pdfDocument.numPages}\n`);

        // Extraer texto de la primera página
        const page = await pdfDocument.getPage(1);
        const textContent = await page.getTextContent();

        console.log(`📝 Items en página 1: ${textContent.items.length}\n`);

        // Reconstruir el texto
        let lastY = -1;
        let pageText = '';

        textContent.items.forEach((item) => {
            const y = item.transform[5];

            if (lastY !== -1 && Math.abs(y - lastY) > 2) {
                pageText += '\n';
            }

            pageText += item.str + ' ';
            lastY = y;
        });

        const pdfText = pageText.toUpperCase();

        console.log('─'.repeat(80));
        console.log('PRIMEROS 1000 CARACTERES:');
        console.log('─'.repeat(80));
        console.log(pdfText.substring(0, 1000));
        console.log('─'.repeat(80));
        console.log(`\n✅ Total caracteres extraídos: ${pdfText.length}\n`);

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
        console.error('❌ ERROR:', error.message);
        console.error(error.stack);
    }
}

testPdfJs().catch(console.error);
