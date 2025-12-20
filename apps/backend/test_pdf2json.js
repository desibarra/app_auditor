const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

async function testPdf2Json() {
    console.log('\n🔍 Probando extracción con pdf2json...\n');

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

    const pdfParser = new PDFParser();

    const result = await new Promise((resolve, reject) => {
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
            try {
                let fullText = '';

                if (pdfData.Pages) {
                    console.log(`📊 Páginas: ${pdfData.Pages.length}\n`);

                    pdfData.Pages.forEach((page, pageNum) => {
                        const textsByY = new Map();

                        if (page.Texts) {
                            page.Texts.forEach((text) => {
                                const y = Math.round(text.y * 100);
                                const decodedText = decodeURIComponent(text.R[0].T);

                                if (!textsByY.has(y)) {
                                    textsByY.set(y, []);
                                }
                                textsByY.get(y).push(decodedText);
                            });
                        }

                        const sortedY = Array.from(textsByY.keys()).sort((a, b) => a - b);
                        sortedY.forEach(y => {
                            fullText += textsByY.get(y).join(' ') + '\n';
                        });
                    });
                }

                resolve(fullText);
            } catch (error) {
                reject(error);
            }
        });

        pdfParser.on('pdfParser_dataError', reject);

        const buffer = fs.readFileSync(latestFile.path);
        pdfParser.parseBuffer(buffer);
    });

    const pdfText = result.toUpperCase();

    console.log('─'.repeat(80));
    console.log('PRIMEROS 1000 CARACTERES:');
    console.log('─'.repeat(80));
    console.log(pdfText.substring(0, 1000));
    console.log('─'.repeat(80));
    console.log(`\n✅ Total caracteres: ${pdfText.length}\n`);

    // Probar regex
    const lines = pdfText.split('\n');
    const dateRegex = /(\d{1,2})[\s\/\-]([A-Z]{3,12}|[A-Z]{2}\.?|\d{2})(?:[\s\/\-]\d{2,4})?/;
    const moneyRegex = /(-?[\d,]{1,}\.\d{2})/g;

    let matches = 0;
    console.log('🔍 PRIMERAS 10 LÍNEAS CON COINCIDENCIAS:\n');

    for (let i = 0; i < lines.length && matches < 10; i++) {
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
}

testPdf2Json().catch(console.error);
