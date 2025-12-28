import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { StatsService } from '../stats/stats.service';

@Controller('sentinel')
export class SentinelController {
    constructor(private readonly statsService: StatsService) { }

    /**
     * GET /api/sentinel/summary
     * Endpoint unificado SentinelEngine
     */
    @Get('summary')
    async getSummary(
        @Query('empresaId') empresaId: string,
        @Query('periodo') periodo: string,
        @Query('flujo') flujo: 'EMITIDOS' | 'RECIBIDOS' | 'PAGOS' = 'RECIBIDOS'
    ) {
        console.log(`[SentinelController] GET /summary. id=${empresaId}, p=${periodo}, f=${flujo}`);
        if (!empresaId || !periodo) {
            throw new BadRequestException('empresaId y periodo son requeridos');
        }
        return await this.statsService.getSentinelSummary(empresaId, periodo, flujo);
    }

    /**
     * GET /api/sentinel/alerts
     */
    @Get('alerts')
    async getAlerts(
        @Query('empresaId') empresaId: string,
        @Query('mes') mes: string,
        @Query('vista') vista: 'emitidos' | 'recibidos' = 'recibidos',
        @Query('flujo') flujo: string = 'gastos'
    ) {
        if (!empresaId || !mes) {
            throw new BadRequestException('empresaId y mes son requeridos');
        }
        return await this.statsService.getAlerts(empresaId, mes, vista, flujo);
    }

    /**
     * GET /api/sentinel/tendencia
     */
    @Get('tendencia')
    async getTendenciaAnual(
        @Query('empresaId') empresaId: string,
        @Query('flujo') flujo: 'emitidos' | 'recibidos' = 'recibidos'
    ) {
        if (!empresaId) {
            throw new BadRequestException('empresaId es requerido');
        }
        return await this.statsService.getTendenciaAnual(empresaId);
    }
}
