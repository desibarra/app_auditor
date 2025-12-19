import { ApiProperty } from '@nestjs/swagger';

export class CreateExpedienteDto {
  @ApiProperty({ example: 'ABC123456789', description: 'RFC de la empresa' })
  rfcEmpresa: string;

  @ApiProperty({ example: '2025-12', description: 'Periodo en formato YYYY-MM' })
  periodo: string;

  @ApiProperty({ example: 'saldos a favor de IVA', description: 'Tipo de devolución' })
  tipo: string;
}

export const endpoints = {
  createExpediente: {
    method: 'POST',
    path: '/devoluciones-iva',
    description: 'Crear un nuevo expediente de devolución de IVA',
    body: CreateExpedienteDto,
    response: {
      id: Number,
      rfcEmpresa: String,
      periodo: String,
      tipo: String,
      estado: String,
      fechaCreacion: String,
    },
  },

  listExpedientes: {
    method: 'GET',
    path: '/devoluciones-iva',
    description: 'Listar expedientes de devolución de IVA por empresa',
    queryParams: {
      rfcEmpresa: { type: 'string', required: false },
      estado: { type: 'string', required: false },
    },
    response: [
      {
        id: Number,
        rfcEmpresa: String,
        periodo: String,
        tipo: String,
        estado: String,
        fechaCreacion: String,
      },
    ],
  },

  getExpedienteDetail: {
    method: 'GET',
    path: '/devoluciones-iva/:id',
    description: 'Obtener el detalle de un expediente de devolución',
    response: {
      id: Number,
      rfcEmpresa: String,
      periodo: String,
      tipo: String,
      estado: String,
      cedulas: Array,
      documentos: Array,
    },
  },

  recalculateCedulas: {
    method: 'POST',
    path: '/devoluciones-iva/:id/cedulas/recalcular',
    description: 'Recalcular las cédulas de un expediente',
    response: {
      message: String,
    },
  },

  exportExpediente: {
    method: 'POST',
    path: '/devoluciones-iva/:id/exportar',
    description: 'Exportar un expediente completo para FED',
    response: {
      file: 'binary',
    },
  },
};