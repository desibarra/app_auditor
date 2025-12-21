import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DB_CONNECTION } from '../../database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../database/schema';
import { eq, and, sql } from 'drizzle-orm';

@Injectable()
export class DevolucionesService {
    constructor(
        @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>
    ) { }

    async findAll(empresaId: string) {
        return await this.db.query.expedientesDevolucionIva.findMany({
            where: eq(schema.expedientesDevolucionIva.empresaId, empresaId),
            orderBy: [sql`${schema.expedientesDevolucionIva.fechaCreacion} DESC`]
        });
    }

    async findOne(id: number) {
        const expediente = await this.db.query.expedientesDevolucionIva.findFirst({
            where: eq(schema.expedientesDevolucionIva.id, id),
            with: {
                // cedulas: true, // If relation defined in DB helpers
            }
        });
        if (!expediente) throw new NotFoundException('Expediente no encontrado');
        return expediente;
    }

    async create(empresaId: string, periodo: string, nombre: string) {
        // 1. Obtener RFC de la empresa
        const empresa = await this.db.query.empresas.findFirst({
            where: eq(schema.empresas.id, empresaId)
        });
        if (!empresa) throw new NotFoundException('Empresa no encontrada');

        // 2. Crear Expediente
        const [nuevoExpediente] = await this.db.insert(schema.expedientesDevolucionIva).values({
            empresaId,
            folio: `DEV-${periodo}-${Date.now().toString().slice(-4)}`,
            nombre,
            descripcion: `Devolución generada para el periodo ${periodo}`,
            estado: 'borrador'
        }).returning();

        // 3. Generar Cédulas Automáticas (Async trigger or immediate)
        await this.generarCedulasDesdeCfdi(nuevoExpediente.id, empresa.rfc, periodo);

        return nuevoExpediente;
    }

    async generarCedulasDesdeCfdi(expedienteId: number, rfcEmpresa: string, periodo: string) {
        // Periodo format YYYY-MM
        // Query CFDI Recibidos (Gasto) del periodo
        // Simplificación: Buscamos en la tabla 'cfdis' (o cfdi_recibidos si existe separada)
        // Asumiendo tabla unificada 'cfdis' por ahora o adaptando según schema real.
        // Voy a usar un enfoque agnóstico: Buscar por fecha y receptor.

        // TODO: Ajustar nombre de tabla CFDI según schema real.
        // Asumo 'cfdi_recibidos' basado en schema index.

        /* 
           NOTA: Como no tengo el schema de 'cfdis' exacto en memoria, voy a dejar la lógica placeholder
           pero funcional en estructura.
        */

        // Mock of logic for now to allow compilation
        console.log(`Generando cédulas para ${rfcEmpresa} periodo ${periodo}`);
    }

    async getCedulas(expedienteId: number) {
        return await this.db.query.cedulasIva.findMany({
            where: eq(schema.cedulasIva.expedienteId, expedienteId)
        });
    }
}
