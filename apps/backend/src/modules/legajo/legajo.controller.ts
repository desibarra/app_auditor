import { Controller, Post, Body, Res, BadRequestException, UseGuards, SetMetadata } from '@nestjs/common';
import { Response } from 'express';
import { LegajoService } from './legajo.service';
import { RolesGuard } from '../../guards/roles.guard';
import { Permissions } from '../../common/roles.enum';

@Controller('legajo')
export class LegajoController {
    constructor(private readonly legajoService: LegajoService) { }

    @Post('exportar')
    @UseGuards(RolesGuard)
    @SetMetadata('roles', Permissions.GENERAR_PDF_EXCEL)
    async exportarLegajo(
        @Body() body: { empresaId: string; anio: number; mes: number },
        @Res() res: Response,
    ) {
        // Validación básica
        const { empresaId, anio, mes } = body;

        if (!empresaId || !anio || !mes) {
            throw new BadRequestException('Faltan parámetros: empresaId, anio, mes');
        }

        try {
            // Nota: generadorCierreMensual escribe directamente en el stream 'res'
            // No necesitamos hacer return, solo await para capturar errores síncronos antes del pipe
            await this.legajoService.generarCierreMensual(empresaId, Number(anio), Number(mes), res);
        } catch (error) {
            console.error('Error crítico al generar legajo:', error);
            // Si los headers ya se enviaron (porque el stream empezó), no podemos enviar JSON
            if (!res.headersSent) {
                if (error.status === 404) {
                    res.status(404).json({ message: error.message });
                } else {
                    res.status(500).json({ message: 'Error interno generando ZIP', detail: error.message });
                }
            } else {
                res.end(); // Cerrar stream roto
            }
        }
    }
}
