import { Controller, Get, Query } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service';

@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get('periodos-disponibles')
  async getPeriodosDisponibles(@Query('empresaId') empresaId?: string) {
    return await this.auditoriaService.getPeriodosDisponibles(empresaId);
  }
}