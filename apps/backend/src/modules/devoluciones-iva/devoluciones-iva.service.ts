import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { db } from '../../database/db';
import { expedientesDevolucionIva } from '../../database/schema/expedientes_devolucion_iva';
import { eq } from 'drizzle-orm';

@Injectable()
export class DevolucionesIvaService {
  private readonly logger = new Logger(DevolucionesIvaService.name);

  async createExpediente(createExpedienteDto: any) {
    const { rfcEmpresa, periodo, empresaId } = createExpedienteDto;

    // Generar Folio y Datos mínimos para cumplir Schema
    // Asumimos periodo como string "YYYY-MM" o similar, o lo forzamos
    const ejercicio = new Date().getFullYear();
    const mes = new Date().getMonth() + 1;
    const folio = `DEV-${rfcEmpresa}-${Date.now()}`;

    // Create expediente
    const expediente = await db
      .insert(expedientesDevolucionIva)
      .values({
        empresaId: empresaId || 'UNKNOWN',
        rfcEmpresa: rfcEmpresa || 'UNKNOWN',
        folioControl: folio,
        ejercicio,
        periodo: mes,
        estatusTramite: 'BORRADOR',
        observaciones: 'Creado automáticamente'
      })
      .returning();

    this.logger.log(`Expediente created: ID ${expediente[0].id}, Folio ${folio}`);
    return expediente[0];
  }

  async listExpedientes(empresaId: string) {
    // Fix: usar empresaId en lugar de rfcEmpresa si es lo que se pasa
    return db
      .select()
      .from(expedientesDevolucionIva)
      // Ajustar filtro según lo que se tenga. Si empresaId es UUID, usar empresaId.
      .where(eq(expedientesDevolucionIva.empresaId, empresaId));
  }

  async getExpedienteDetail(id: number) {
    const expediente = await db
      .select()
      .from(expedientesDevolucionIva)
      .where(eq(expedientesDevolucionIva.id, id))
      .limit(1);

    if (!expediente.length) {
      throw new NotFoundException('Expediente no encontrado');
    }

    return expediente[0];
  }

  async generateCedulaIvaAcreditable(expedienteId: number) {
    this.logger.log(`Generating Cedula IVA Acreditable for expediente ID: ${expedienteId}`);
    // Implementation logic here
  }
}