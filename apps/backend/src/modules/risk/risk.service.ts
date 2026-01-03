import { Injectable, Inject } from '@nestjs/common';
import * as schema from '../../database/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class RiskEngineService {
    constructor(
        @Inject('DRIZZLE_CLIENT') private db: any
    ) { }

    private logger = console;

    private parseCFDI(xml: string): any {
        // Implementación simulada para parsear CFDI
        return { uuid: 'CFDI_UUID', ObjetoImp: '02' };
    }

    private parseREP(xml: string): any {
        // Implementación simulada para parsear REP
        return { uuid: 'REP_UUID', ObjetoImpDR: '01' };
    }

    private hash(data: string): string {
        // Implementación simulada para generar hash
        return 'HASH';
    }

    private hallazgosRepository = {
        insert: async (data: any) => {
            console.log('Insertando hallazgo:', data);
        },
    };

    /**
     * Motor de Reglas de Deducibilidad (Sentinel)
     * Analiza si un CFDI es coherente con el giro del negocio.
     */
    async analyzeDeductibility(cfdi: any, empresaId: string) {
        // 1. Obtener giro de la empresa
        const empresa = await this.db.query.empresas.findFirst({
            where: eq(schema.empresas.id, empresaId)
        });

        if (!empresa || !empresa.sector) return; // No se puede analizar sin sector

        const sector = empresa.sector.toUpperCase();
        const descripcionLower = (cfdi.descripcion || '').toLowerCase();

        let riesgo: { nivel: string; titulo: string; descripcion: string; sugerencia: string } | null = null;

        // --- REGLAS DE NEGOCIO (MVP HARDCODED) ---

        // REGLA 1: AUTOTRANSPORTE vs MATERIALES DE CONSTRUCCIÓN
        if (sector.includes('AUTOTRANSPORTE') || sector.includes('LOGISTICA')) {
            if (descripcionLower.includes('cemento') || descripcionLower.includes('varilla') || descripcionLower.includes('ladrillo')) {
                riesgo = {
                    nivel: 'ALTO',
                    titulo: 'Posible No Deducible (Fuera de Giro)',
                    descripcion: `El concepto '${cfdi.descripcion}' (Materiales Construcción) es atípico para el sector '${sector}'.`,
                    sugerencia: 'Verificar si es para mantenimiento de terminal. Si no, clasificar como No Deducible.'
                };
            }
        }

        // REGLA 2: SERVICIOS MÉDICOS (General para Personas Morales)
        /*
        if (descripcionLower.includes('consulta medica') || descripcionLower.includes('hospital')) {
             // Solo flaggear si es PM (RFC longitud 12)
             if (empresa.rfc.length === 12) {
                 riesgo = { ... }
             }
        } 
        */

        // Si se detectó riesgo, guardar en DB
        if (riesgo) {
            await this.saveRisk(cfdi.uuid, empresaId, 'DEDUCIBILIDAD', riesgo);
        }

        // --- REGLA 3: LISTAS NEGRAS (EFOS) ---
        await this.checkBlacklist(cfdi.emisorRfc, cfdi.uuid, empresaId);

        // --- REGLA 4: ESTATUS SAT (Vigencia) ---
        // Simulado: Si el CFDI tiene > 30 días y no ha sido validado, check.
        // Aquí asumimos que al importar está Vigente, pero si se cancela después es el riesgo.
    }

    public async saveRisk(uuid: string, empresaId: string, tipo: string, data: any) {
        // Verificar si ya existe para no duplicar
        const existing = await this.db.query.cfdiRiesgos.findFirst({
            where: and(
                eq(schema.cfdiRiesgos.cfdiUuid, uuid),
                eq(schema.cfdiRiesgos.tipoRiesgo, tipo)
            )
        });

        if (existing) return;

        await this.db.insert(schema.cfdiRiesgos).values({
            cfdiUuid: uuid,
            empresaId,
            nivelRiesgo: data.nivel,
            tipoRiesgo: tipo,
            titulo: data.titulo,
            descripcion: data.descripcion,
            sugerencia: data.sugerencia,
            estadoRevision: 'PENDIENTE'
        });
    }

    private async checkBlacklist(rfc: string, uuid: string, empresaId: string) {
        // Mock Blacklist Check
        // En producción: Consultar tabla 'listas_negras_sat'
        const BLACKLIST_MOCK = ['EFOS69B001', 'MALO990101XXX'];

        if (BLACKLIST_MOCK.includes(rfc)) {
            await this.saveRisk(uuid, empresaId, 'LISTA_NEGRA', {
                nivel: 'ALTO',
                titulo: 'Proveedor en Lista Negra (69-B)',
                descripcion: `El RFC ${rfc} se encuentra listado por el SAT como EFOS (Definitivo).`,
                sugerencia: 'DETENER PAGOS INMEDIATAMENTE y consultar abogado fiscalista.'
            });
        }
    }

    /**
     * Validación cruzada entre CFDI origen y Complemento de Pago (REP)
     */
    async validateCfdiAndRep(cfdi: any, rep: any, empresaId: string) {
        // Extraer datos relevantes del CFDI origen
        const objetoImpOrigen = cfdi.objetoImp;
        const baseGravadaOrigen = cfdi.baseGravada;
        const baseNoObjetoOrigen = cfdi.baseNoObjeto;

        // Extraer datos relevantes del REP
        const objetoImpDR = rep.objetoImpDR;
        const basesDeclaradasREP = rep.basesDeclaradas;

        // Validar coherencia fiscal
        if (objetoImpOrigen === 'Sí objeto' && objetoImpDR === 'No objeto') {
            const riesgo = {
                nivel: 'ALTO',
                titulo: 'Inconsistencia Fiscal entre CFDI y REP',
                descripcion: 'Inconsistencia fiscal entre CFDI origen y Complemento de Pago. El tratamiento de Objeto de Impuesto no coincide.',
                sugerencia: 'Revisar los XML del CFDI origen y del REP para corregir la discrepancia.'
            };

            // Guardar el riesgo detectado
            await this.saveRisk(cfdi.uuid, empresaId, 'VALIDACION_CFDI_REP', {
                ...riesgo,
                codigo: 'REP-OBJ-001',
                impacto: 'Riesgo de rechazo de acreditamiento de IVA / Observación SAT por materialidad.',
                drillDown: {
                    uuidCfdiOrigen: cfdi.uuid,
                    objetoImpOrigen,
                    uuidRep: rep.uuid,
                    objetoImpDR,
                    diferencia: `ObjetoImp: ${objetoImpOrigen} vs ${objetoImpDR}`
                }
            });
        }
    }

    /**
     * Validación de consistencia entre CFDI y Complemento de Pago (REP)
     */
    async validateCFDIREPConsistency(cfdiXmlRaw: string, repXmlRaw: string) {
        const findings = [];
        let scoreImpact = 0;

        // 1. Parsear XMLs
        this.logger.log(`Parsing CFDI XML: ${cfdiXmlRaw}`);
        const cfdi = this.parseCFDI(cfdiXmlRaw);
        this.logger.log(`Parsed CFDI: ${JSON.stringify(cfdi)}`);

        this.logger.log(`Parsing REP XML: ${repXmlRaw}`);
        const rep = this.parseREP(repXmlRaw);
        this.logger.log(`Parsed REP: ${JSON.stringify(rep)}`);

        // 2. Extraer ObjetoImp del CFDI
        this.logger.log(`Extracting ObjetoImp from CFDI with UUID: ${cfdi.uuid}`);
        const cfdiObjetoImp = this.extractObjetoImp(cfdi);
        this.logger.log(`Extracted ObjetoImp: ${cfdiObjetoImp}`);

        // 3. Extraer ObjetoImpDR del REP
        this.logger.log(`Extracting ObjetoImpDR from REP with UUID: ${cfdi.uuid}`);
        const repObjetoImpDR = this.extractObjetoImpDR(rep, cfdi.uuid);
        this.logger.log(`Extracted ObjetoImpDR: ${repObjetoImpDR}`);

        // 4. VALIDACIÓN CRÍTICA: Comparar
        if (cfdiObjetoImp === '02' && repObjetoImpDR === '01') {
            this.logger.warn(`Discrepancy found: ObjetoImp=${cfdiObjetoImp}, ObjetoImpDR=${repObjetoImpDR}`);
            findings.push({
                codigo: 'REP-OBJ-001',
                nivel: 'ALTO',
                cfdi_uuid: cfdi.uuid,
                cfdi_objeto_imp: '02',
                rep_uuid: rep.uuid,
                rep_objeto_imp_dr: '01',
                tipo_discrepancia: 'OBJETO_IMP_MISMATCH',
                descripcion: 'Inconsistencia fiscal entre CFDI origen y Complemento de Pago',
                impacto: 'Riesgo de rechazo de acreditamiento de IVA',
                score_impact: -15
            });
            scoreImpact -= 15;
        }

        // 5. Persistir hallazgos
        for (const finding of findings) {
            await this.hallazgosRepository.insert({
                ...finding,
                cfdi_xml_hash: this.hash(cfdiXmlRaw),
                rep_xml_hash: this.hash(repXmlRaw),
                estado_hallazgo: 'detectado'
            });
        }

        return { findings, scoreImpact, isValid: findings.length === 0 };
    }

    private extractObjetoImp(cfdi: any): string {
        const conceptos = Array.isArray(cfdi.Conceptos?.Concepto)
            ? cfdi.Conceptos.Concepto
            : [cfdi.Conceptos?.Concepto];

        // Validar que TODOS los conceptos tengan el MISMO ObjetoImp
        const valores = conceptos.map(c => c.ObjetoImp).filter(v => v);
        const unique = [...new Set(valores)];

        if (unique.length > 1) {
            // ERROR: Conceptos con diferentes ObjetoImp
            return null;
        }

        return valores[0] || null;
    }

    private extractObjetoImpDR(rep: any, cfdiUuid: string): string {
        const pagos = Array.isArray(rep.Complemento?.Pagos20?.Pago)
            ? rep.Complemento.Pagos20.Pago
            : [rep.Complemento?.Pagos20?.Pago];

        for (const pago of pagos) {
            const docs = Array.isArray(pago.DoctoRelacionado)
                ? pago.DoctoRelacionado
                : [pago.DoctoRelacionado];

            for (const doc of docs) {
                if (doc.IdDocumento === cfdiUuid) {
                    return doc.ObjetoImpDR || null;
                }
            }
        }

        return null;
    }

    /**
     * Análisis mensual de datos
     * - Recorre todos los CFDIs y sus REPs relacionados
     * - Aplica la validación de consistencia
     */
    async analyzeMonthlyData() {
        const cfdis = await this.db.query.cfdiRecibidos.findMany();
        const reps = await this.db.query.complementosPagoRecibidos.findMany();

        for (const cfdi of cfdis) {
            const relatedReps = reps.filter(rep => rep.cfdiUuid === cfdi.uuid);

            for (const rep of relatedReps) {
                await this.validateCFDIREPConsistency(cfdi.xmlOriginal, rep.xmlOriginal);
            }
        }
    }
}
