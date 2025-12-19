import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
    constructor(private readonly statsService: StatsService) { }

    /**
     * GET /api/stats/resumen?empresaId=xxx
     * Obtiene el resumen de estadísticas para una empresa
     */
    @Get('resumen')
    async getResumen(@Query('empresaId') empresaId: string) {
        if (!empresaId) {
            throw new BadRequestException('empresaId es requerido');
        }

        return await this.statsService.getResumen(empresaId);
    }

    /**
     * GET /api/stats/dashboard?empresaId=xxx
     * Obtiene datos completos del dashboard incluyendo histórico de 6 meses
     */
    @Get('dashboard')
    async getDashboard(@Query('empresaId') empresaId: string) {
        if (!empresaId) {
            throw new BadRequestException('empresaId es requerido');
        }

        return await this.statsService.getDashboard(empresaId);
    }
}
