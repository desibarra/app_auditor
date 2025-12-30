import { Controller, Post, Body, UseGuards, SetMetadata } from '@nestjs/common';
import { RolesGuard } from '../../guards/roles.guard';
import { Permissions } from '../../common/roles.enum';

@Controller('expedientes')
export class ExpedientesController {
  @Post('iniciar-analisis')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', Permissions.INICIAR_ANALISIS)
  async iniciarAnalisis(@Body() body: any) {
    // ...existing logic...
  }

  @Post('re-analizar-periodo')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', Permissions.RE_ANALIZAR_PERIODO)
  async reAnalizarPeriodo(@Body() body: any) {
    // ...existing logic...
  }
}