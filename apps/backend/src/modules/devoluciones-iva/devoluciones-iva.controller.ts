import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DevolucionesIvaService } from './devoluciones-iva.service';
import { CreateExpedienteDto } from './dto/create-expediente.dto';
import { ExpedienteDetailDto } from './dto/expediente-detail.dto';

@ApiTags('Devoluciones IVA')
@Controller('devoluciones-iva')
export class DevolucionesIvaController {
  constructor(private readonly devolucionesIvaService: DevolucionesIvaService) {}

  @ApiOperation({ summary: 'Crear un nuevo expediente de devolución de IVA' })
  @ApiBody({ type: CreateExpedienteDto })
  @ApiResponse({ status: 201, description: 'Expediente creado exitosamente.' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada.' })
  @Post()
  async createExpediente(@Body() createExpedienteDto: CreateExpedienteDto) {
    return this.devolucionesIvaService.createExpediente(createExpedienteDto);
  }

  @ApiOperation({ summary: 'Listar expedientes de devolución de IVA por empresa' })
  @ApiQuery({ name: 'empresaId', required: true, description: 'RFC de la empresa' })
  @ApiResponse({ status: 200, description: 'Lista de expedientes.' })
  @Get()
  async listExpedientes(@Query('empresaId') empresaId: string) {
    return this.devolucionesIvaService.listExpedientes(empresaId);
  }

  @ApiOperation({ summary: 'Obtener el detalle de un expediente de devolución' })
  @ApiParam({ name: 'id', description: 'ID del expediente' })
  @ApiResponse({ status: 200, description: 'Detalle del expediente.', type: ExpedienteDetailDto })
  @ApiResponse({ status: 404, description: 'Expediente no encontrado.' })
  @Get(':id')
  async getExpedienteDetail(@Param('id') id: number) {
    return this.devolucionesIvaService.getExpedienteDetail(id);
  }

  @ApiOperation({ summary: 'Recalcular las cédulas de un expediente' })
  @ApiParam({ name: 'id', description: 'ID del expediente' })
  @ApiResponse({ status: 200, description: 'Cédulas recalculadas exitosamente.' })
  @Post(':id/cedulas/recalcular')
  async recalculateCedulas(@Param('id') id: number) {
    return this.devolucionesIvaService.generateCedulaIvaAcreditable(id);
  }
}