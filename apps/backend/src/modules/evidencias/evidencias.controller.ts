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
import { CreateEvidenciaDto } from './dto/create-evidencia.dto';

@Controller('evidencias')
export class EvidenciasController {
    constructor(private readonly evidenciasService: EvidenciasService) { }

    /**
     * POST /api/evidencias/upload
     * Sube una evidencia para un CFDI
     */
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        limits: { fileSize: 50 * 1024 * 1024 } // 50MB explícito
    }))
    async uploadEvidencia(
        @Body() dto: CreateEvidenciaDto,
        @UploadedFile() file: Express.Multer.File,
    ) {
        // Logs de Verdad
        console.log('⬇️ Datos recibidos:', {
            uuid: dto?.cfdiUuid,
            cat: dto?.categoria,
            size: file?.size,
            filename: file?.originalname
        });

        try {
            if (!file) {
                console.error('❌ Error: No se recibió archivo');
                throw new BadRequestException('No se proporcionó ningún archivo (Multer falló o archivo vacío)');
            }

            // Mapeamos al DTO del servicio (que sigue siendo interface por ahora, o any)
            const evidenciaDto = {
                cfdiUuid: dto.cfdiUuid,
                categoria: dto.categoria,
                descripcion: dto.descripcion
            };

            const result = await this.evidenciasService.uploadEvidencia(evidenciaDto, file);
            console.log('✅ Evidencia subida con éxito:', result.evidencia.id);
            return result;
        } catch (error) {
            console.error('🚨 ERROR CRÍTICO EN UPLOAD:', error);
            throw error;
        }
    }

    /**
     * GET /api/evidencias/categorias/:tipoComprobante
     * Obtiene las categorías disponibles para un tipo de CFDI
     * IMPORTANTE: Esta ruta debe ir ANTES de :cfdiUuid para evitar conflictos
     */
    @Get('categorias/:tipoComprobante')
    async getCategorias(@Param('tipoComprobante') tipoComprobante: string) {
        const categorias =
            this.evidenciasService.getCategoriasPorTipo(tipoComprobante);
        return { categorias };
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
     * GET /api/evidencias/:cfdiUuid
     * Obtiene todas las evidencias de un CFDI
     */
    @Get(':cfdiUuid')
    async getEvidenciasByCfdi(@Param('cfdiUuid') cfdiUuid: string) {
        return await this.evidenciasService.getEvidenciasByCfdi(cfdiUuid);
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
            'Content-Disposition': `attachment; filename=\"${metadata.fileName}\"`,
            'Content-Length': metadata.contentLength,
        });

        return new StreamableFile(stream);
    }
}
