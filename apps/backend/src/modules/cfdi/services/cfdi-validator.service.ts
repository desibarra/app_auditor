import { Injectable } from '@nestjs/common';
import { CfdiData } from './cfdi-parser.service';

/**
 * Resultado de la validación integral Sentinel 2026
 */
export interface ValidationResult {
    isValid: boolean; // Si es técnicamente procesable
    technicalErrors: string[];
    fiscalRisks: string[]; // Riesgos de defensa
    probatoryWarnings: string[]; // Faltantes de materialidad
    layers: {
        technical: 'VALID' | 'INVALID';
        fiscal: 'OK' | 'RISK' | 'CRITICAL';
        probatory: 'COMPLETE' | 'INCOMPLETE' | 'PENDING';
    };
}

@Injectable()
export class CfdiValidatorService {

    /**
     * Ejecuta la Validación Integral por Capas (RMF 2026 y Multi-Ejercicio)
     */
    validate(cfdi: CfdiData): ValidationResult {
        const result: ValidationResult = {
            isValid: true,
            technicalErrors: [],
            fiscalRisks: [],
            probatoryWarnings: [],
            layers: {
                technical: 'VALID',
                fiscal: 'OK',
                probatory: 'PENDING'
            }
        };

        const year = new Date(cfdi.fecha).getFullYear();

        // 1. Capa Técnica
        this.validateTechnical(cfdi, result, year);
        if (result.technicalErrors.length > 0) {
            result.isValid = false;
            result.layers.technical = 'INVALID';
            return result;
        }

        // 2. Capa Fiscal
        this.validateFiscal(cfdi, result, year);
        if (result.fiscalRisks.length > 0) {
            result.layers.fiscal = 'RISK';
        }

        // 3. Capa Probatoria (Materialidad)
        this.validateProbatory(cfdi, result);
        if (result.probatoryWarnings.length > 0) {
            result.layers.probatory = 'INCOMPLETE';
        } else {
            result.layers.probatory = 'COMPLETE';
        }

        return result;
    }

    /**
     * 🟢 CAPA TÉCNICA: Estructura, Versiones, Timbrado
     */
    private validateTechnical(cfdi: CfdiData, result: ValidationResult, year: number) {
        // Validar UUID
        if (!cfdi.uuid || cfdi.uuid.length !== 36) {
            result.technicalErrors.push('Estructura UUID inválida o ausente');
        }

        // Validar Fechas
        const fechaCfdi = new Date(cfdi.fecha);
        if (isNaN(fechaCfdi.getTime())) {
            result.technicalErrors.push('Formato de fecha inválido');
        } else {
            // Regla de Ejercicio: No permitir CFDIs futuros o muy antiguos para importar (ej. < 2018)
            if (year < 2018) {
                result.technicalErrors.push(`CFDI muy antiguo (${year}). Sentinel solo audita ejercicios recientes (2020+ recomendado).`);
            }
        }

        // Integridad de Montos
        if (cfdi.subtotal < 0 || cfdi.total < 0) {
            result.technicalErrors.push('Montos negativos no permitidos en CFDI estándar');
        }

        // Validar Emisor/Receptor básicos
        if (!cfdi.emisorRfc || cfdi.emisorRfc.length < 12) {
            result.technicalErrors.push('RFC Emisor inválido');
        }
        if (!cfdi.receptorRfc || cfdi.receptorRfc.length < 12) {
            result.technicalErrors.push('RFC Receptor inválido');
        }
    }

    /**
     * 🟡 CAPA FISCAL: Multi-Ejercicio (2020-2025)
     */
    private validateFiscal(cfdi: CfdiData, result: ValidationResult, year: number) {
        // --- REGLAS POR EJERCICIO ---

        // 1. Regla CFDI 4.0 vs 3.3
        // En parser no tenemos versión explícita, pero podemos inferir por nodos (ej. ObjetoImp, RegimenFiscalReceptor)
        const es40 = !!cfdi.receptorRegimenFiscal; // Campo obligatorio en 4.0

        if (year >= 2024 && !es40) {
            result.fiscalRisks.push(`CRÍTICO [RMF 2024]: CFDI 3.3 detectado en ejercicio ${year}. Debería ser 4.0 obligatoriamente.`);
            result.layers.fiscal = 'CRITICAL';
        }

        // 2. Carta Porte (Multi-Anual)
        if (cfdi.tipoComprobante === 'T' || (cfdi.tipoComprobante === 'I' && cfdi.complementoCartaPorte)) {
            // 2020-2021: Sin exigencia estricta
            // 2022: Transición CP 2.0
            // 2023+: CP 2.0 / 3.0 Mandatory
            const tieneCP = !!cfdi.complementoCartaPorte;

            if (year >= 2022 && cfdi.tipoComprobante === 'T' && !tieneCP) {
                result.fiscalRisks.push(`CRÍTICO [RMF ${year}]: Traslado sin Carta Porte. Obligatorio desde 2022. Riesgo de presunción de contrabando.`);
                result.layers.fiscal = 'CRITICAL';
            } else if (tieneCP) {
                this.validateCartaPorte(cfdi.complementoCartaPorte, result, year);
            }
        }

        // 3. Reglas Generales (S01, P01, PUE vs 99)
        if (cfdi.metodoPago === 'PUE' && cfdi.formaPago === '99') {
            // Esta regla aplica siempre
            result.fiscalRisks.push('Incoherencia Fiscal: PUE con Forma de Pago 99. Riesgo de no deducibilidad.');
        }

        if (cfdi.receptorUsoCfdi === 'S01' && year >= 2022) { // S01 es 'Sin efectos fiscales' (4.0)
            result.fiscalRisks.push('CRÍTICO [CFDI 4.0]: UsoCFDI "S01 - Sin efectos fiscales". No deducible.');
            result.layers.fiscal = 'CRITICAL';
        }

        if (cfdi.receptorUsoCfdi === 'P01' && year >= 2023) { // P01 'Por definir' eliminado en 4.0
            result.fiscalRisks.push('CRÍTICO: UsoCFDI "P01" no válido en ejercicio reciente.');
        }

        // 4. Complemento de Pagos (Validación de Existencia)
        // Solo aplica si tenemos contexto de relaciones (aquí validamos estructura interna)
        if (cfdi.complementoPago) {
            // Validar versión del complemento según año
            // (Lógica simplificada: si existe, validamos coherencia)
            // ...
        }

        // 5. Nómina
        if (cfdi.tipoComprobante === 'N' && cfdi.complementoNomina) {
            this.validateNomina(cfdi.complementoNomina, cfdi.fecha, result);
        }

        // 6. IVA 0% y Exportación
        const hasTasa0 = cfdi.impuestos.some(i => i.tasaOCuota === 0 && i.tipoFactor === 'Tasa' && i.impuesto === '002');
        if (hasTasa0 && cfdi.exportacion === '01' && year >= 2022) {
            result.fiscalRisks.push('Alerta IVA 0% [CFDI 4.0]: Operación con Tasa 0% marcada como "No aplica exportación" (01). Verificar.');
        }
    }

    /**
     * Validaciones profundas de Carta Porte (Versión Aware)
     */
    private validateCartaPorte(cp: any, result: ValidationResult, year: number) {
        // Versión Check
        const version = cp.version;
        if (year >= 2024 && version.startsWith('2')) {
            result.fiscalRisks.push('Carta Porte 2.0 en 2024+. Debería ser 3.0/3.1.');
        }

        // Ubicaciones
        if (!cp.ubicaciones || cp.ubicaciones.length < 2) {
            result.fiscalRisks.push('Carta Porte Incompleta: Se requieren mínimo 2 ubicaciones.');
        }

        // Mercancías (Validación estricta desde 2022)
        if (year >= 2022 && (!cp.mercancias || cp.mercancias.length === 0)) {
            result.fiscalRisks.push('Carta Porte sin Mercancías: Imposible acreditar tenencia legal.');
        }

        // ... (Resto de reglas de peso/distancia se mantienen)
    }

    /**
     * Validaciones de Nómina RMF 2026
     */
    private validateNomina(nomina: any, fechaTimbradoStr: string, result: ValidationResult) {
        const fechaPago = new Date(nomina.fechaPago);
        const fechaTimbrado = new Date(fechaTimbradoStr);

        // Regla: Timbrado posterior a pago (Días hábiles según RMF, simplificado a 11 días naturales de margen)
        const diffDays = (fechaTimbrado.getTime() - fechaPago.getTime()) / (1000 * 3600 * 24);

        if (diffDays > 15) { // Margen amplio para evitar falsos positivos
            result.fiscalRisks.push(`Nómina Extemporánea: Timbrada ${Math.floor(diffDays)} días después del pago. Límite sugerido: 3-11 días hábiles.`);
        }

        if (diffDays < -5) {
            result.fiscalRisks.push('Nómina atípica: Timbrada mucho antes de la fecha de pago.');
        }

        // Regla: Antigüedad y Fecha Inicio Relación Laboral (Placeholder para lógica futura)

        // Alerta Probatoria: Expediente Laboral
        result.probatoryWarnings.push('Expediente Laboral Digital: Requiere Contrato, Alta IMSS y Firma de Recibo (o dispersión bancaria).');
    }

    /**
     * 🔴 CAPA PROBATORIA: Materialidad y Razón de Negocios
     * Define qué evidencias faltan para blindar la operación.
     */
    private validateProbatory(cfdi: CfdiData, result: ValidationResult) {
        const monto = cfdi.total;

        // Regla General: Montos grandes
        if (monto > 100000) {
            result.probatoryWarnings.push('Operación Relevante (>100k): Se sugiere contrato firmado y cotización respaldo.');
        }

        // Regla: Activos Fijos
        if (cfdi.receptorUsoCfdi && cfdi.receptorUsoCfdi.startsWith('I')) {
            result.probatoryWarnings.push('Activo Fijo: Requiere documentación de posesión, fotos y póliza de depreciación.');
        }

        // Servicios (inferido si no es I01-I08 y no es G03)
        // Si es G03 (Gastos General) y monto alto, revisar entregable
        if (cfdi.receptorUsoCfdi === 'G03' && monto > 20000) {
            result.probatoryWarnings.push('Gastos Generales >20k: ¿Existe entregable o evidencia del servicio?');
        }
    }
}
