import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { db } from '../../database/db';
import { expedientesDevolucionIva } from '../../database/schema/expedientes_devolucion_iva';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DevolucionesIvaService {
  private readonly logger = new Logger(DevolucionesIvaService.name);

  async createExpediente(createExpedienteDto: any) {
    const { rfcEmpresa, periodo, tipo } = createExpedienteDto;

    // Validate if the company exists
    const empresa = await db
      .select()
      .from(expedientesDevolucionIva)
      .where(eq(expedientesDevolucionIva.rfcEmpresa, rfcEmpresa))
      .limit(1);

    if (!empresa.length) {
      this.logger.warn(`Attempted to create expediente for non-existent empresa: ${rfcEmpresa}`);
      throw new NotFoundException('Empresa no encontrada');
    }

    // Create expediente
    const expediente = await db
      .insert(expedientesDevolucionIva)
      .values({
        empresaId: uuidv4(),
        rfcEmpresa,
        periodo,
        tipo,
        estado: 'Borrador',
      })
      .returning();

    this.logger.log(`Expediente created: ID ${expediente[0].id}, Empresa ${rfcEmpresa}, Periodo ${periodo}`);
    return expediente[0];
  }

  async listExpedientes(empresaId: string) {
    return db
      .select()
      .from(expedientesDevolucionIva)
      .where(eq(expedientesDevolucionIva.rfcEmpresa, empresaId));
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