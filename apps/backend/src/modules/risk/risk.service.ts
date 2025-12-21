import { Injectable, Inject } from '@nestjs/common';
import * as schema from '../../database/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class RiskEngineService {
    constructor(
        @Inject('DRIZZLE_CLIENT') private db: any
    ) { }

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

    private async saveRisk(uuid: string, empresaId: string, tipo: string, data: any) {
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
}
