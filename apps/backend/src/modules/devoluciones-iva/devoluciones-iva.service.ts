import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { db } from '../../database/db';
import { expedientesDevolucionIva } from '../../database/schema/expedientes_devolucion_iva';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DevolucionesIvaService {
  private readonly logger = new Logger(DevolucionesIvaService.name);

  async createExpediente(createExpedienteDto: any) {
    const { rfcEmpresa, periodo, tipo, ejercicio } = createExpedienteDto;

    // Create expediente
    const values: any = {
      empresaId: uuidv4(),
      rfcEmpresa,
      periodo: periodo || 1,
      ejercicio: ejercicio || 2025,
      folioControl: `EXP-${Date.now()}`,
      estatusTramite: 'BORRADOR',
    };

    const expediente = await db
      .insert(expedientesDevolucionIva)
      .values(values)
      .returning();

    this.logger.log(`Expediente created: ID ${expediente[0].id}, Empresa ${rfcEmpresa}`);
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
  }
}