import { Controller, Get, Post, Put, Body, Query, Param, BadRequestException, Res, StreamableFile } from '@nestjs/common';
import { ExpedientesService } from './expedientes.service';
import { Response } from 'express';

@Controller('expedientes')
export class ExpedientesController {
    constructor(private readonly expedientesService: ExpedientesService) { }

    /**
     * POST /api/expedientes
     * Crea un nuevo expediente de devolución de IVA
     */
    @Post()
    async crearExpediente(@Body() body: {
        empresaId: string;
        nombre: string;
        descripcion?: string;
        cfdiUuids: string[];
        creadoPor?: string;
    }) {
        if (!body.empresaId) {
            throw new BadRequestException('empresaId es requerido');
        }

        if (!body.nombre) {
            throw new BadRequestException('nombre es requerido');
        }

        if (!body.cfdiUuids || !Array.isArray(body.cfdiUuids) || body.cfdiUuids.length === 0) {
            throw new BadRequestException('Debe seleccionar al menos un CFDI');
        }

        return await this.expedientesService.crearExpediente(body);
    }

    /**
     * GET /api/expedientes?empresaId=xxx
     * Lista todos los expedientes de una empresa
     */
    @Get()
    async listarExpedientes(@Query('empresaId') empresaId: string) {
        if (!empresaId) {
            throw new BadRequestException('empresaId es requerido');
        }

        return await this.expedientesService.listarExpedientes(empresaId);
    }

    /**
     * GET /api/expedientes/:id
     * Obtiene el detalle completo de un expediente
     */
    @Get(':id')
    async getDetalleExpediente(@Param('id') id: string) {
        const expedienteId = parseInt(id, 10);

        if (isNaN(expedienteId)) {
            throw new BadRequestException('ID de expediente inválido');
        }

        return await this.expedientesService.getDetalleExpediente(expedienteId);
    }

    /**
     * GET /api/expedientes/:id/descargar-zip
     * Descarga el legajo digital completo del expediente en formato ZIP
     */
    @Get(':id/descargar-zip')
    async descargarZip(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: Response
    ) {
        const expedienteId = parseInt(id, 10);

        if (isNaN(expedienteId)) {
            throw new BadRequestException('ID de expediente inválido');
        }

        // Obtener detalle para el nombre del archivo
        const detalle = await this.expedientesService.getDetalleExpediente(expedienteId);
        const nombreArchivo = `${detalle.expediente.folio}_Legajo_Digital.zip`;

        // Generar ZIP
        const zipStream = await this.expedientesService.generarZipExpediente(expedienteId);

        // Configurar headers
        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
        });

        return new StreamableFile(zipStream);
    }

    /**
     * PUT /api/expedientes/:id/estado
     * Actualiza el estado de un expediente
     */
    @Put(':id/estado')
    async actualizarEstado(
        @Param('id') id: string,
        @Body() body: {
            estado: string;
            observaciones?: string;
        }
    ) {
        const expedienteId = parseInt(id, 10);

        if (isNaN(expedienteId)) {
            throw new BadRequestException('ID de expediente inválido');
        }

        if (!body.estado) {
            throw new BadRequestException('estado es requerido');
        }

        // Validar estados permitidos
        const estadosPermitidos = ['borrador', 'enviado', 'en_revision', 'aprobado', 'rechazado', 'completado'];
        if (!estadosPermitidos.includes(body.estado)) {
            throw new BadRequestException(`Estado inválido. Permitidos: ${estadosPermitidos.join(', ')}`);
        }

        return await this.expedientesService.actualizarEstado(
            expedienteId,
            body.estado,
            body.observaciones
        );
    }
}