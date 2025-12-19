import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    Body,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Res,
    StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { EvidenciasService, EvidenciaDto } from './evidencias.service';

@Controller('evidencias')
export class EvidenciasController {
    constructor(private readonly evidenciasService: EvidenciasService) { }

    /**
     * POST /api/evidencias/upload
     * Sube una evidencia para un CFDI
     */
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadEvidencia(
        @Body() dto: EvidenciaDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No se proporcionó ningún archivo');
        }

        if (!dto.cfdiUuid || !dto.categoria) {
            throw new BadRequestException(
                'cfdiUuid y categoria son campos requeridos',
            );
        }

        return await this.evidenciasService.uploadEvidencia(dto, file);
    }

    /**
     * GET /api/evidencias/:cfdiUuid
     * Obtiene todas las evidencias de un CFDI
     */
    @Get(':cfdiUuid')
    async getEvidenciasByCfdi(@Param('cfdiUuid') cfdiUuid: string) {
        return await this.evidenciasService.getEvidenciasByCfdi(cfdiUuid);
    }

    /**
     * GET /api/evidencias/count/:cfdiUuid
     * Cuenta las evidencias de un CFDI
     */
    @Get('count/:cfdiUuid')
    async contarEvidencias(@Param('cfdiUuid') cfdiUuid: string) {
        const count = await this.evidenciasService.contarEvidencias(cfdiUuid);
        return { count };
    }

    /**
     * DELETE /api/evidencias/:id
     * Elimina una evidencia
     */
    @Delete(':id')
    async deleteEvidencia(@Param('id') id: string) {
        await this.evidenciasService.deleteEvidencia(parseInt(id, 10));
        return {
            success: true,
            message: 'Evidencia eliminada correctamente',
        };
    }

    /**
     * GET /api/evidencias/download/:id
     * Descarga un archivo de evidencia
     */
    @Get('download/:id')
    async downloadEvidencia(
        @Param('id') id: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { stream, metadata } = await this.evidenciasService.downloadEvidencia(
            parseInt(id, 10),
        );

        res.set({
            'Content-Type': metadata.contentType,
            'Content-Disposition': `attachment; filename="${metadata.fileName}"`,
            'Content-Length': metadata.contentLength,
        });

        return new StreamableFile(stream);
    }

    /**
     * GET /api/evidencias/categorias/:tipoComprobante
     * Obtiene las categorías disponibles para un tipo de CFDI
     */
    @Get('categorias/:tipoComprobante')
    async getCategorias(@Param('tipoComprobante') tipoComprobante: string) {
        const categorias =
            this.evidenciasService.getCategoriasPorTipo(tipoComprobante);
        return { categorias };
    }
}
