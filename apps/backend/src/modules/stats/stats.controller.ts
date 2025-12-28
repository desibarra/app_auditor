import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
    constructor(private readonly statsService: StatsService) { }

    /**
     * GET /api/stats/resumen?empresaId=xxx
     * Obtiene el resumen de estadísticas para una empresa
     */
    @Get('summary-old')
    async getResumen(@Query('empresaId') empresaId: string) {
        // Obsoleto, redirigir o eliminar
        return { message: 'Use sentinel-summary' };
    }

    /**
     * GET /api/stats/dashboard?empresaId=xxx&mes=YYYY-MM&rol=emitidos|recibidos
     * Obtiene datos completos del dashboard incluyendo histórico de 6 meses
     */
    @Get('dashboard')
    async getDashboard(
        @Query('empresaId') empresaId: string,
        @Query('mes') mes?: string,
        @Query('rol') rol: 'emitidos' | 'recibidos' = 'recibidos'
    ) {
        if (!empresaId) {
            throw new BadRequestException('empresaId es requerido');
        }

        return await this.statsService.getDashboard(empresaId, mes, rol);
    }

    /**
     * GET /api/stats/sentinel-summary
     * Endpoint unificado migrado para evitar 404s
     */
    @Get('sentinel-summary')
    async getSentinelSummary(
        @Query('empresaId') empresaId: string,
        @Query('periodo') periodo: string,
        @Query('flujo') flujo: 'EMITIDOS' | 'RECIBIDOS' | 'PAGOS' = 'RECIBIDOS'
    ) {
        if (!empresaId || !periodo) {
            throw new BadRequestException('empresaId y periodo son requeridos');
        }
        return await this.statsService.getSentinelSummary(empresaId, periodo, flujo);
    }
}
