import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { expedientesDevolucionIva, expedienteCfdi } from '../../database/schema/expedientes_devolucion.schema';
import { cfdiRecibidos } from '../../database/schema/cfdi_recibidos.schema';
import { cfdiImpuestos } from '../../database/schema/cfdi_impuestos.schema';
import { documentosSoporte } from '../../database/schema/documentos_soporte';

interface CrearExpedienteDto {
  empresaId: string;
  nombre: string;
  descripcion?: string;
  cfdiUuids: string[];
  creadoPor?: string;
}

@Injectable()
export class ExpedientesService {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: any) { }

  /**
   * Crea un nuevo expediente de devolución de IVA
   * VALIDACIÓN CRÍTICA: Solo permite CFDIs con materialidad completa (🟢)
   */
  async crearExpediente(dto: CrearExpedienteDto) {
    // 1. Validar que haya CFDIs seleccionados
    if (!dto.cfdiUuids || dto.cfdiUuids.length === 0) {
      throw new BadRequestException('Debe seleccionar al menos un CFDI');
    }

    // 2. Validar materialidad de CADA CFDI (CRÍTICO)
    const validacionMaterialidad = await this.validarMaterialidadCfdis(dto.cfdiUuids);

    if (!validacionMaterialidad.todosValidos) {
      const cfdisInvalidos = validacionMaterialidad.cfdisInvalidos
        .map(c => `${c.uuid} (${c.numEvidencias} evidencias)`)
        .join(', ');

      throw new BadRequestException(
        `No se puede crear el expediente. Los siguientes CFDIs no tienen materialidad completa (requieren 3+ evidencias): ${cfdisInvalidos}`
      );
    }

    // 3. Obtener datos de los CFDIs y calcular totales
    const datosCfdis = await this.obtenerDatosCfdis(dto.cfdiUuids);

    if (datosCfdis.length === 0) {
      throw new BadRequestException('No se encontraron CFDIs válidos');
    }

    // 4. Calcular montos totales
    const montoTotalIva = datosCfdis.reduce((sum, cfdi) => sum + Number(cfdi.totalIva), 0);
    const montoTotalFacturas = datosCfdis.reduce((sum, cfdi) => sum + Number(cfdi.total), 0);

    // 5. Generar folio único
    const folio = await this.generarFolio(dto.empresaId);

    // 6. Crear el expediente (transacción)
    try {
      // Insertar expediente
      const [expediente] = await this.db
        .insert(expedientesDevolucionIva)
        .values({
          empresaId: dto.empresaId,
          folio,
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          montoTotalIva: montoTotalIva.toString(),
          montoTotalFacturas: montoTotalFacturas.toString(),
          cantidadCfdis: datosCfdis.length,
          estado: 'borrador',
          creadoPor: dto.creadoPor || 'sistema',
        })
        .returning();

      // Insertar relaciones CFDI-Expediente
      const relacionesCfdi = datosCfdis.map(cfdi => ({
        expedienteId: expediente.id,
        cfdiUuid: cfdi.uuid,
        ivaAcreditable: cfdi.totalIva.toString(),
        agregadoPor: dto.creadoPor || 'sistema',
      }));

      await this.db.insert(expedienteCfdi).values(relacionesCfdi);

      return {
        success: true,
        expediente: {
          id: expediente.id,
          folio: expediente.folio,
          nombre: expediente.nombre,
          montoTotalIva,
          montoTotalFacturas,
          cantidadCfdis: datosCfdis.length,
          estado: expediente.estado,
          fechaCreacion: expediente.fechaCreacion,
        },
        cfdisIncluidos: datosCfdis.length,
      };
    } catch (error) {
      console.error('Error al crear expediente:', error);
      throw new BadRequestException('Error al crear el expediente');
    }
  }

  /**
   * Valida que todos los CFDIs tengan materialidad completa (3+ evidencias)
   */
  private async validarMaterialidadCfdis(cfdiUuids: string[]) {
    const cfdisInvalidos = [];

    for (const uuid of cfdiUuids) {
      // Contar evidencias completadas
      const evidencias = await this.db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(documentosSoporte)
        .where(
          and(
            eq(documentosSoporte.cfdiUuid, uuid),
            eq(documentosSoporte.estado, 'completado'),
          ),
        );

      const numEvidencias = Number(evidencias[0]?.count || 0);

      // Validación: Requiere 3+ evidencias (🟢)
      if (numEvidencias < 3) {
        cfdisInvalidos.push({
          uuid,
          numEvidencias,
          estatusMaterialidad: numEvidencias === 0 ? '🔴' : '🟡',
        });
      }
    }

    return {
      todosValidos: cfdisInvalidos.length === 0,
      cfdisInvalidos,
    };
  }

  /**
   * Obtiene los datos de los CFDIs incluyendo el IVA acreditable
   */
  private async obtenerDatosCfdis(cfdiUuids: string[]) {
    const cfdis = [];

    for (const uuid of cfdiUuids) {
      // Obtener datos del CFDI
      const [cfdi] = await this.db
        .select()
        .from(cfdiRecibidos)
        .where(eq(cfdiRecibidos.uuid, uuid));

      if (!cfdi) continue;

      // Obtener impuestos (IVA)
      const impuestos = await this.db
        .select()
        .from(cfdiImpuestos)
        .where(eq(cfdiImpuestos.cfdiUuid, uuid));

      // Calcular IVA total (trasladado - retenido)
      let totalIva = 0;
      impuestos.forEach((imp: any) => {
        if (imp.tipo === 'traslado' && imp.impuesto === '002') {
          // IVA trasladado
          totalIva += Number(imp.importe || 0);
        } else if (imp.tipo === 'retencion' && imp.impuesto === '002') {
          // IVA retenido (restar)
          totalIva -= Number(imp.importe || 0);
        }
      });

      cfdis.push({
        uuid: cfdi.uuid,
        folio: cfdi.folio,
        serie: cfdi.serie,
        fecha: cfdi.fecha,
        emisorRfc: cfdi.emisorRfc,
        emisorNombre: cfdi.emisorNombre,
        total: Number(cfdi.total),
        totalIva,
      });
    }

    return cfdis;
  }

  /**
   * Genera un folio único para el expediente
   */
  private async generarFolio(empresaId: string): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Contar expedientes de este mes
    const count = await this.db
      .select({
        total: sql<number>`COUNT(*)`,
      })
      .from(expedientesDevolucionIva)
      .where(eq(expedientesDevolucionIva.empresaId, empresaId));

    const numero = String((count[0]?.total || 0) + 1).padStart(3, '0');

    return `DEV-${year}${month}-${numero}`;
  }

  /**
   * Obtiene el detalle completo de un expediente
   */
  async getDetalleExpediente(expedienteId: number) {
    // Obtener expediente
    const [expediente] = await this.db
      .select()
      .from(expedientesDevolucionIva)
      .where(eq(expedientesDevolucionIva.id, expedienteId));

    if (!expediente) {
      throw new NotFoundException('Expediente no encontrado');
    }

    // Obtener CFDIs del expediente
    const relacionesCfdi = await this.db
      .select()
      .from(expedienteCfdi)
      .where(eq(expedienteCfdi.expedienteId, expedienteId));

    // Obtener detalles de cada CFDI con sus evidencias
    const cfdisConEvidencias = [];

    for (const relacion of relacionesCfdi) {
      const [cfdi] = await this.db
        .select()
        .from(cfdiRecibidos)
        .where(eq(cfdiRecibidos.uuid, relacion.cfdiUuid));

      if (!cfdi) continue;

      // Obtener evidencias del CFDI
      const evidencias = await this.db
        .select()
        .from(documentosSoporte)
        .where(
          and(
            eq(documentosSoporte.cfdiUuid, relacion.cfdiUuid),
            eq(documentosSoporte.estado, 'completado'),
          ),
        );

      cfdisConEvidencias.push({
        uuid: cfdi.uuid,
        folio: cfdi.folio,
        serie: cfdi.serie,
        fecha: cfdi.fecha,
        emisorRfc: cfdi.emisorRfc,
        emisorNombre: cfdi.emisorNombre,
        total: Number(cfdi.total),
        ivaAcreditable: Number(relacion.ivaAcreditable),
        evidencias: evidencias.map(ev => ({
          id: ev.id,
          categoria: ev.categoriaEvidencia,
          descripcion: ev.descripcionEvidencia,
          archivo: ev.archivo,
          fechaSubida: ev.fechaSubida,
        })),
        numEvidencias: evidencias.length,
        estatusMaterialidad: evidencias.length >= 3 ? '🟢' : evidencias.length > 0 ? '🟡' : '🔴',
      });
    }

    return {
      expediente: {
        id: expediente.id,
        folio: expediente.folio,
        nombre: expediente.nombre,
        descripcion: expediente.descripcion,
        montoTotalIva: Number(expediente.montoTotalIva),
        montoTotalFacturas: Number(expediente.montoTotalFacturas),
        cantidadCfdis: expediente.cantidadCfdis,
        estado: expediente.estado,
        fechaCreacion: expediente.fechaCreacion,
        fechaEnvio: expediente.fechaEnvio,
        observaciones: expediente.observaciones,
      },
      cfdis: cfdisConEvidencias,
      resumen: {
        totalCfdis: cfdisConEvidencias.length,
        totalIvaRecuperable: Number(expediente.montoTotalIva),
        totalFacturas: Number(expediente.montoTotalFacturas),
        totalEvidencias: cfdisConEvidencias.reduce((sum, c) => sum + c.numEvidencias, 0),
      },
    };
  }

  /**
   * Lista todos los expedientes de una empresa
   */
  async listarExpedientes(empresaId: string) {
    const expedientes = await this.db
      .select()
      .from(expedientesDevolucionIva)
      .where(eq(expedientesDevolucionIva.empresaId, empresaId))
      .orderBy(expedientesDevolucionIva.fechaCreacion);

    return expedientes.map(exp => ({
      id: exp.id,
      folio: exp.folio,
      nombre: exp.nombre,
      montoTotalIva: Number(exp.montoTotalIva),
      cantidadCfdis: exp.cantidadCfdis,
      estado: exp.estado,
      fechaCreacion: exp.fechaCreacion,
    }));
  }

  /**
   * Actualiza el estado de un expediente
   */
  async actualizarEstado(expedienteId: number, nuevoEstado: string, observaciones?: string) {
    const updates: any = {
      estado: nuevoEstado,
      fechaModificacion: new Date(),
    };

    if (nuevoEstado === 'enviado') {
      updates.fechaEnvio = new Date();
    } else if (nuevoEstado === 'completado') {
      updates.fechaCompletado = new Date();
    }

    if (observaciones) {
      updates.observaciones = observaciones;
    }

    await this.db
      .update(expedientesDevolucionIva)
      .set(updates)
      .where(eq(expedientesDevolucionIva.id, expedienteId));

    return { success: true, nuevoEstado };
  }
}