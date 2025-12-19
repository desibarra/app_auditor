import {
    Controller,
    Post,
    Get,
    Delete,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Query,
    Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CfdiService } from './cfdi.service';

@Controller('cfdi')
export class CfdiController {
    constructor(private readonly cfdiService: CfdiService) { }

    /**
     * POST /api/cfdi/importar-xml
     * Importa un archivo XML de CFDI
     * empresaId es opcional - se detecta automáticamente por RFC
     */
    @Post('importar-xml')
    @UseInterceptors(FileInterceptor('file'))
    async importarXml(
        @UploadedFile() file: Express.Multer.File,
        @Query('empresaId') empresaId?: string,
    ) {
        if (!file) {
            throw new BadRequestException('No se proporcionó ningún archivo');
        }

        return await this.cfdiService.importarXml(file, empresaId);
    }

    /**
     * GET /api/cfdi/recientes
     * Obtiene los últimos CFDIs importados de una empresa
     */
    @Get('recientes')
    async getRecientes(
        @Query('empresaId') empresaId: string,
        @Query('limit') limit?: string,
    ) {
        if (!empresaId) {
            throw new BadRequestException('Se requiere el ID de la empresa');
        }

        const limitNum = limit ? parseInt(limit, 10) : 10;
        return await this.cfdiService.getRecientes(empresaId, limitNum);
    }

    /**
     * GET /api/cfdi/empresas
     * Obtiene la lista de empresas registradas
     */
    @Get('empresas')
    async getEmpresas() {
        return await this.cfdiService.getEmpresas();
    }

    /**
     * GET /api/cfdi/all
     * Obtiene todos los CFDIs con paginación y filtros
     */
    @Get('all')
    async getAllCfdis(
        @Query('empresaId') empresaId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('fechaInicio') fechaInicio?: string,
        @Query('fechaFin') fechaFin?: string,
        @Query('rfcEmisor') rfcEmisor?: string,
        @Query('tipoComprobante') tipoComprobante?: string,
    ) {
        if (!empresaId) {
            throw new BadRequestException('Se requiere el ID de la empresa');
        }

        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 20;

        const filters = {
            fechaInicio,
            fechaFin,
            rfcEmisor,
            tipoComprobante,
        };

        return await this.cfdiService.getAllCfdis(empresaId, pageNum, limitNum, filters);
    }

    /**
     * GET /api/cfdi/detalle/:uuid
     * Obtiene el detalle completo de un CFDI
     */
    @Get('detalle/:uuid')
    async getCfdiDetalle(@Param('uuid') uuid: string) {
        return await this.cfdiService.getCfdiDetalle(uuid);
    }

    /**
     * DELETE /api/cfdi/:uuid
     * Elimina un CFDI
     */
    @Delete(':uuid')
    async deleteCfdi(@Param('uuid') uuid: string) {
        return await this.cfdiService.deleteCfdi(uuid);
    }
}
