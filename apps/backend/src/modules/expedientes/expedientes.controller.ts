import { Controller, Post, Get, Body, Query, UseGuards, SetMetadata } from '@nestjs/common';
import { RolesGuard } from '../../guards/roles.guard';
import { Permissions } from '../../common/roles.enum';
import { ExpedientesService } from './expedientes.service';

@Controller('expedientes')
export class ExpedientesController {
  constructor(private readonly expedientesService: ExpedientesService) { }

  @Get()
  async getExpedientes(@Query('empresaId') empresaId: string) {
    return this.expedientesService.findAllByEmpresa(empresaId);
  }

  @Post('iniciar-analisis')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', Permissions.INICIAR_ANALISIS)
  async iniciarAnalisis(@Body() body: any) {
    return this.expedientesService.analyzePeriod(body.empresaId, body.periodo);
  }

  @Post('re-analizar-periodo')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', Permissions.RE_ANALIZAR_PERIODO)
  async reAnalizarPeriodo(@Body() body: any) {
    return this.expedientesService.analyzePeriod(body.empresaId, body.periodo);
  }
}