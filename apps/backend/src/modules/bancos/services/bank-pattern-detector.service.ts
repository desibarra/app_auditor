/**
 * MOTOR DE DETECCIÓN BANCARIA MULTI-PATRON
 * ==========================================
 * Arquitectura: Zero-Dependency Pattern Recognition
 * Nivel: CONTALINK+ Grade
 * 
 * PRINCIPIOS:
 * 1. Detección automática por patrones estructurales
 * 2. Sin dependencias de librerías únicas
 * 3. Extensible para nuevos bancos
 * 4. Normalización a esquema universal
 */

export interface NormalizedMovimiento {
    fecha: Date;
    concepto: string;
    cargo: number;
    abono: number;
    saldo: number;
    referencia: string;
    banco: string;
}

export interface BankPattern {
    banco: string;
    confidence: number; // 0-1
    headerKeywords: string[];
    columnLayout: {
        fecha?: number;
        concepto?: number;
        cargo?: number;
        abono?: number;
        saldo?: number;
    };
}

export interface BankDetectionResult {
    banco: string;
    confidence: number;
    parser: 'BanBajio' | 'BBVA' | 'Santander' | 'Generic';
    metadata: {
        headerRow?: number;
        numeroCuenta?: string;
        periodo?: string;
        titular?: string;
    };
}

/**
 * CLASE PRINCIPAL: DETECTOR DE PATRONES
 */
export class BankPatternDetector {
    private static readonly PATTERNS: Record<string, {
        name: string;
        keywords: string[];
        structure: {
            dateFormats: RegExp[];
            amountFormat?: RegExp;
            accountPattern?: RegExp;
        };
    }> = {
            BanBajio: {
                name: 'BanBajío',
                keywords: ['BAJÍO', 'BANBAJIO', 'BANCO DEL BAJÍO'],
                structure: {
                    dateFormats: [/\d{2}\/\d{2}\/\d{4}/, /\d{4}-\d{2}-\d{2}/],
                    accountPattern: /\d{10}/,
                },
            },
            BBVA: {
                name: 'BBVA',
                keywords: ['BBVA', 'BANCOMER', 'BBVA BANCOMER'],
                structure: {
                    dateFormats: [/\d{2}\/\d{2}\/\d{4}/],
                    accountPattern: /\d{18}/,
                },
            },
            Santander: {
                name: 'Santander',
                keywords: ['SANTANDER', 'BANCO SANTANDER'],
                structure: {
                    dateFormats: [/\d{2}\/\d{2}\/\d{4}/],
                    accountPattern: /\d{11}/,
                },
            },
        };

    /**
     * Detecta el banco del archivo PDF/Excel
     */
    static async detect(fileContent: string | Buffer, fileName: string): Promise<BankDetectionResult> {
        const textContent = typeof fileContent === 'string'
            ? fileContent
            : fileContent.toString('utf-8');

        // Normalizar texto
        const normalizedText = textContent.toUpperCase();

        // Detectar por keywords
        let bestMatch: BankDetectionResult | null = null;
        let highestConfidence = 0;

        for (const [key, pattern] of Object.entries(this.PATTERNS)) {
            let confidence = 0;

            // Check keywords
            for (const keyword of pattern.keywords) {
                if (normalizedText.includes(keyword)) {
                    confidence += 0.3;
                }
            }

            // Check date formats
            for (const dateFormat of pattern.structure.dateFormats) {
                if (dateFormat.test(textContent)) {
                    confidence += 0.2;
                }
            }

            // Check account pattern
            if (pattern.structure.accountPattern?.test(textContent)) {
                confidence += 0.2;
            }

            if (confidence > highestConfidence) {
                highestConfidence = confidence;
                bestMatch = {
                    banco: pattern.name,
                    confidence,
                    parser: key as any,
                    metadata: {},
                };
            }
        }

        // Si no hay match claro, usar parser genérico
        if (!bestMatch || highestConfidence < 0.4) {
            return {
                banco: 'Desconocido',
                confidence: 0,
                parser: 'Generic',
                metadata: {},
            };
        }

        return bestMatch;
    }

    /**
     * Extrae número de cuenta del texto
     */
    static extractAccountNumber(text: string, banco: string): string | null {
        const pattern = this.PATTERNS[banco]?.structure.accountPattern;
        if (!pattern) return null;

        const match = text.match(pattern);
        return match ? match[0] : null;
    }
}

/**
 * PARSER: BANBAJÍO
 */
export class BanBajioParser {
    static parse(content: string): NormalizedMovimiento[] {
        const movements: NormalizedMovimiento[] = [];

        // Implementación específica para BanBajío
        // TODO: Parsear estructura específica del PDF de BanBajío

        return movements;
    }

    static detectColumns(headerRow: string): { fecha: number; concepto: number; cargo: number; abono: number; saldo: number } {
        // Detectar posición de columnas basándose en encabezados
        const headers = headerRow.split(/\s{2,}/); // Split por múltiples espacios

        return {
            fecha: headers.findIndex(h => /fecha/i.test(h)),
            concepto: headers.findIndex(h => /concepto|descripci[oó]n/i.test(h)),
            cargo: headers.findIndex(h => /cargo|retiro/i.test(h)),
            abono: headers.findIndex(h => /abono|dep[oó]sito/i.test(h)),
            saldo: headers.findIndex(h => /saldo/i.test(h)),
        };
    }
}

/**
 * PARSER: BBVA
 */
export class BBVAParser {
    static parse(content: string): NormalizedMovimiento[] {
        const movements: NormalizedMovimiento[] = [];

        // TODO: Implementar parser específico de BBVA

        return movements;
    }
}

/**
 * PARSER: SANTANDER
 */
export class SantanderParser {
    static parse(content: string): NormalizedMovimiento[] {
        const movements: NormalizedMovimiento[] = [];

        // TODO: Implementar parser específico de Santander

        return movements;
    }
}

/**
 * PARSER: GENÉRICO (Fallback)
 */
export class GenericBankParser {
    static parse(content: string): NormalizedMovimiento[] {
        const movements: NormalizedMovimiento[] = [];

        // Intenta detectar patrones genéricos
        const lines = content.split('\n');

        for (const line of lines) {
            // Buscar líneas que parezcan movimientos
            const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
            const amountMatch = line.match(/(\d{1,3}(,\d{3})*(\.\d{2})?)/g);

            if (dateMatch && amountMatch && amountMatch.length >= 2) {
                // Potencial movimiento detectado
                // TODO: Parsear con heurísticas
            }
        }

        return movements;
    }
}

/**
 * SERVICIO PRINCIPAL: BANK IMPORT SERVICE
 * Con Confidence Score Defensivo
 */
export class BankImportService {
    /**
     * Procesa un archivo bancario detectando automáticamente el banco
     * 
     * 🛡️ DEFENSA FISCAL:
     * - confidence_score se GUARDA en BD
     * - score < 80 → marca origen_no_confiable = true
     * - Parser genérico NO puede marcar banco identificado
     */
    static async processFile(file: Buffer | string, fileName: string): Promise<{
        banco: string;
        bancoDetectado: string | null;
        parserUsado: 'BanBajio' | 'BBVA' | 'Santander' | 'Generic';
        confidenceScore: number; // 0-100
        origenNoConfiable: boolean;
        movimientos: NormalizedMovimiento[];
        metadata: any;
    }> {
        // 1. Detectar banco
        const detection = await BankPatternDetector.detect(file, fileName);

        // Convertir confidence de 0-1 a 0-100
        const confidenceScore = Math.round(detection.confidence * 100);

        console.log(`[BANK IMPORT] Banco detectado: ${detection.banco} (${confidenceScore}% confianza)`);

        // 2. Validar confidence score
        const origenNoConfiable = confidenceScore < 80;

        if (origenNoConfiable) {
            console.warn(
                `[BANK IMPORT] ⚠️  Confidence score bajo (${confidenceScore}%). ` +
                `Marcando como origen_no_confiable.`
            );
        }

        // 3. Usar parser apropiado
        let movimientos: NormalizedMovimiento[] = [];
        const content = typeof file === 'string' ? file : file.toString('utf-8');

        switch (detection.parser) {
            case 'BanBajio':
                movimientos = BanBajioParser.parse(content);
                break;

            case 'BBVA':
                movimientos = BBVAParser.parse(content);
                break;

            case 'Santander':
                movimientos = SantanderParser.parse(content);
                break;

            case 'Generic':
            default:
                movimientos = GenericBankParser.parse(content);
                break;
        }

        // 4. Determinar bancoDetectado
        // 🔒 REGLA: Parser genérico NO puede marcar banco identificado
        let bancoDetectado: string | null = null;

        if (detection.parser !== 'Generic' && confidenceScore >= 40) {
            bancoDetectado = detection.banco;
        }

        return {
            banco: detection.banco, // Nombre del banco (puede ser "Desconocido")
            bancoDetectado,  // null si es genérico o confidence bajo
            parserUsado: detection.parser,
            confidenceScore,  // 🔐 CRÍTICO: Se guarda en BD
            origenNoConfiable,  // 🔐 CRÍTICO: Flag de defensa
            movimientos,
            metadata: detection.metadata,
        };
    }

    /**
     * Valida que los movimientos estén balanceados
     */
    static validateBalance(movimientos: NormalizedMovimiento[]): {
        isValid: boolean;
        totalCargos: number;
        totalAbonos: number;
        saldoInicial: number;
        saldoFinal: number;
        diferencia: number;
    } {
        if (movimientos.length === 0) {
            return {
                isValid: false,
                totalCargos: 0,
                totalAbonos: 0,
                saldoInicial: 0,
                saldoFinal: 0,
                diferencia: 0,
            };
        }

        const totalCargos = movimientos.reduce((sum, m) => sum + m.cargo, 0);
        const totalAbonos = movimientos.reduce((sum, m) => sum + m.abono, 0);
        const saldoInicial = movimientos[0].saldo - movimientos[0].abono + movimientos[0].cargo;
        const saldoFinal = movimientos[movimientos.length - 1].saldo;
        const saldoCalculado = saldoInicial + totalAbonos - totalCargos;
        const diferencia = Math.abs(saldoFinal - saldoCalculado);

        return {
            isValid: diferencia < 0.01, // Tolerancia de 1 centavo
            totalCargos,
            totalAbonos,
            saldoInicial,
            saldoFinal,
            diferencia,
        };
    }

    /**
     * 📊 Genera reporte de confianza por banco
     */
    static generarReporteConfianza(procesados: Array<{
        archivo: string;
        banco: string;
        parser: string;
        confidence: number;
        movimientos: number;
    }>): {
        porBanco: Map<string, { archivos: number; confidencePromedio: number; }>;
        archivosNoConfiables: number;
        totalArchivos: number;
    } {
        const porBanco = new Map<string, { archivos: number; confidencePromedio: number; }>();
        let archivosNoConfiables = 0;

        for (const proc of procesados) {
            // Agrupar por banco
            if (!porBanco.has(proc.banco)) {
                porBanco.set(proc.banco, { archivos: 0, confidencePromedio: 0 });
            }

            const stats = porBanco.get(proc.banco)!;
            const nuevoPromedio =
                (stats.confidencePromedio * stats.archivos + proc.confidence) /
                (stats.archivos + 1);

            stats.archivos++;
            stats.confidencePromedio = nuevoPromedio;

            // Contar no confiables
            if (proc.confidence < 80) {
                archivosNoConfiables++;
            }
        }

        return {
            porBanco,
            archivosNoConfiables,
            totalArchivos: procesados.length,
        };
    }
}
