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
        const year = new Date().getFullYear().toString();
        return await this.statsService.getTendenciaAnual(empresaId, year);
    }
}


@Controller('dashboard')
export class DashboardUIController {
    @Get('overview/demo-empresa')
    getDemoOverview() {
        return {
            totalCfdiMes: {
                ingresos: 1250000.50,
                egresos: 850000.25
            },
            alertasActivas: {
                alta: 3,
                media: 5
            },
            gastoProveedoresRiesgo: 12.5,
            expedientesIncompletos: 8,
            topAlertas: [
                {
                    id: '1',
                    mensaje: 'Proveedor en lista negra del SAT (EFOS)',
                    nivel: 'alta',
                    fecha: new Date().toISOString()
                },
                {
                    id: '2',
                    mensaje: 'Factura con fecha futura detectada',
                    nivel: 'media',
                    fecha: new Date().toISOString()
                },
                {
                    id: '4',
                    mensaje: 'Monto inusual en gastos de viaje',
                    nivel: 'alta',
                    fecha: new Date().toISOString()
                }
            ]
        };
    }
}
