import { Controller, Get, Post, Body, Param, Query, BadRequestException, Logger } from '@nestjs/common';
import { DevolucionesService } from './devoluciones.service';

@Controller('devoluciones')
export class DevolucionesController {
    private readonly logger = new Logger(DevolucionesController.name);

    constructor(private readonly devolucionesService: DevolucionesService) { }

    /**
     * GET /api/devoluciones?empresaId=...
     * Lista trámites reales de la empresa.
     */
    @Get()
    async getByEmpresa(@Query('empresaId') empresaId: string) {
        if (!empresaId) {
            throw new BadRequestException('Falta parámetro empresaId');
        }
        return await this.devolucionesService.getByEmpresa(empresaId);
    }

    /**
     * GET /api/devoluciones/:id
     * Detalle completo del expediente de devolución.
     */
    @Get(':id')
    async getById(@Param('id') id: string) {
        const result = await this.devolucionesService.getById(parseInt(id));
        if (!result) {
            throw new BadRequestException('El trámite solicitado no existe.');
        }
        return result;
    }

    /**
     * POST /api/devoluciones
     * Genera un nuevo trámite basado en el Informe SAT-GRADE del periodo.
     */
    @Post()
    async create(@Body() body: { empresaId: string; periodo: string }) {
        if (!body.empresaId || !body.periodo) {
            throw new BadRequestException('Se requiere empresaId y periodo (YYYY-MM).');
        }

        try {
            this.logger.log(`Solicitud de nuevo trámite IVA: ${body.empresaId} @ ${body.periodo}`);
            return await this.devolucionesService.createFromReport(body.empresaId, body.periodo);
        } catch (error) {
            this.logger.error(`Error creando trámite: ${error.message}`);
            throw error;
        }
    }

    /**
     * GET /api/devoluciones/pre-valuation
     * Realiza una auditoría previa sin guardar para mostrar en el modal.
     */
    @Get('pre-valuation')
    async preValuation(
        @Query('empresaId') empresaId: string,
        @Query('periodo') periodo: string
    ) {
        if (!empresaId || !periodo) throw new BadRequestException('Faltan parámetros');
        return await this.devolucionesService.preValuation(empresaId, periodo);
    }
}
