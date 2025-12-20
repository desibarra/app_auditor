const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

async function debugPdfExtraction() {
    // Buscar el archivo PDF más reciente
    const bancosDir = path.join(__dirname, 'uploads', 'bancos', 'empresa-pnk140311qm2');

    if (!fs.existsSync(bancosDir)) {
        console.log('❌ Directorio no encontrado:', bancosDir);
        return;
    }

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
    console.log(`\n📄 Analizando: ${latestFile.name}`);
    console.log(`📅 Fecha: ${latestFile.mtime}\n`);

    const buffer = fs.readFileSync(latestFile.path);

    // Probar extracción con pagerender personalizado
    const data = await pdf(buffer, {
        pagerender: (pageData) => {
            return pageData.getTextContent({ normalizeWhitespace: true })
                .then((textContent) => {
                    let lastY, text = '';
                    for (let item of textContent.items) {
                        if (lastY == item.transform[5] || !lastY) {
                            text += item.str + ' ';
                        } else {
                            text += '\n' + item.str + ' ';
                        }
                        lastY = item.transform[5];
                    }
                    return text;
                });
        }
    });

    const pdfText = data.text.toUpperCase();

    console.log('📊 ESTADÍSTICAS:');
    console.log(`   - Páginas: ${data.numpages}`);
    console.log(`   - Caracteres totales: ${pdfText.length}`);
    console.log(`   - Líneas totales: ${pdfText.split('\n').length}\n`);

    console.log('📝 PRIMEROS 1000 CARACTERES:');
    console.log('─'.repeat(80));
    console.log(pdfText.substring(0, 1000));
    console.log('─'.repeat(80));

    // Probar regex
    const lines = pdfText.split('\n');
    const dateRegex = /(\d{1,2})[\s\/\-]([A-Z]{3,12}|[A-Z]{2}\.?|\d{2})(?:[\s\/\-]\d{2,4})?/;
    const moneyRegex = /(-?[\d,]{1,}\.\d{2})/g;

    let matches = 0;
    console.log('\n🔍 PRIMERAS 10 LÍNEAS CON COINCIDENCIAS:');
    console.log('─'.repeat(80));

    for (let i = 0; i < lines.length && matches < 10; i++) {
        const line = lines[i].trim();
        const dateMatch = line.match(dateRegex);
        const moneyMatches = line.match(moneyRegex);

        if (dateMatch && moneyMatches && moneyMatches.length >= 1) {
            matches++;
            console.log(`\nLínea ${i}:`);
            console.log(`  Texto: ${line.substring(0, 100)}`);
            console.log(`  Fecha: ${dateMatch[0]}`);
            console.log(`  Montos: ${moneyMatches.join(', ')}`);
        }
    }

    console.log('\n─'.repeat(80));
    console.log(`\n✅ Total de coincidencias encontradas: ${matches}`);

    if (matches === 0) {
        console.log('\n⚠️  NO SE ENCONTRARON COINCIDENCIAS');
        console.log('\n📋 MUESTRA DE LÍNEAS (primeras 30):');
        lines.slice(0, 30).forEach((line, i) => {
            if (line.trim()) {
                console.log(`${i}: ${line.substring(0, 120)}`);
            }
        });
    }
}

debugPdfExtraction().catch(console.error);
