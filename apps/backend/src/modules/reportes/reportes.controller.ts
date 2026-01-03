import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ReportesService } from './reportes.service';

/**
 * 📊 CONTROLADOR DE REPORTES SAT
 * Endpoints dedicados para reportes oficiales
 */
@Controller('reportes')
export class ReportesController {
    constructor(private readonly reportesService: ReportesService) { }

    /**
     * GET /api/reportes/sat-rep
     * Genera reporte SAT de Flujo de Efectivo basado en REPs
     * 
     * @param empresaId - ID de la empresa
     * @param year - Año fiscal (YYYY)
     * @returns Reporte mensual con desglose de impuestos
     */
    @Get('sat-rep')
    async getReporteSatRep(
        @Query('empresaId') empresaId: string,
        @Query('year') year: string,
    ) {
        if (!empresaId || !year) {
            throw new BadRequestException('Se requiere empresaId y year (YYYY)');
        }

        return await this.reportesService.getReporteSatRep(empresaId, year);
    }
}
