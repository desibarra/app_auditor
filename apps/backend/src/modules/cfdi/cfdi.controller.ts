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
    Body,
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
        try {
            console.log('[CFDI Upload] Iniciando importación de XML...');
            console.log('[CFDI Upload] Archivo recibido:', file ? file.originalname : 'NO FILE');
            console.log('[CFDI Upload] EmpresaId param:', empresaId);

            if (!file) {
                console.error('[CFDI Upload] ERROR: No se proporcionó ningún archivo');
                throw new BadRequestException('No se proporcionó ningún archivo');
            }

            const resultado = await this.cfdiService.importarXml(file, empresaId);
            console.log('[CFDI Upload] Importación exitosa:', resultado.uuid);
            return resultado;
        } catch (error) {
            console.error('[CFDI Upload] ERROR durante importación:', error.message);
            console.error('[CFDI Upload] Stack:', error.stack);
            throw error;
        }
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

    @Post('sincronizar-sat')
    async sincronizarSat(@Body() body: { empresaId: string }) {
        if (!body.empresaId) {
            throw new BadRequestException('Se requiere empresaId');
        }
        return await this.cfdiService.sincronizarEmpresa(body.empresaId);
    }

    /**
     * GET /api/cfdi/resumen-mensual
     * 📊 TABLA DE CONTROL MENSUAL - INDEPENDIENTE DE FILTROS
     * 
     * Retorna conteo de CFDIs por mes y tipo de comprobante
     * Para detectar faltantes rápidamente
     */
    @Get('resumen-mensual')
    async getResumenMensual(@Query('empresaId') empresaId: string) {
        if (!empresaId) {
            throw new BadRequestException('Se requiere el ID de la empresa');
        }

        return await this.cfdiService.getResumenMensual(empresaId);
    }

    /**
     * GET /api/cfdi/metricas
     * 📈 MÉTRICAS REACTIVAS EN TIEMPO REAL
     * 
     * Retorna KPIs para cards superiores
     * Se recalcula SIEMPRE desde BD (no cache)
     */
    @Get('metricas')
    async getMetricas(
        @Query('empresaId') empresaId: string,
        @Query('mes') mes?: string, // YYYY-MM
    ) {
        if (!empresaId) {
            throw new BadRequestException('Se requiere el ID de la empresa');
        }

        return await this.cfdiService.getMetricas(empresaId, mes);
    }

    /**
     * 📊 ENDPOINTS CFDI EMITIDOS
     * ==========================
     * Rutas dedicadas para CFDIs donde empresa es EMISOR
     */

    /**
     * GET /api/cfdi/emitidos/resumen-mensual
     * Resumen mensual de CFDIs EMITIDOS
     */
    @Get('emitidos/resumen-mensual')
    async getResumenMensualEmitidos(@Query('empresaId') empresaId: string) {
        if (!empresaId) {
            throw new BadRequestException('Se requiere el ID de la empresa');
        }

        return await this.cfdiService.getResumenMensualEmitidos(empresaId);
    }

    /**
     * GET /api/cfdi/emitidos/metricas
     * KPIs de CFDIs EMITIDOS
     */
    @Get('emitidos/metricas')
    async getMetricasEmitidos(
        @Query('empresaId') empresaId: string,
        @Query('mes') mes?: string,
    ) {
        if (!empresaId) {
            throw new BadRequestException('Se requiere el ID de la empresa');
        }

        return await this.cfdiService.getMetricasEmitidos(empresaId, mes);
    }

    // === 🚀 ENDPOINTS SEGREGADOS (SAT-Grade I/N/P/E) ===
    // Soporta filtros: mes (YYYY-MM) OR fechaInicio/fechaFin (YYYY-MM-DD)

    @Get('emitidos/ingresos')
    async getEmitidosIngresos(
        @Query('empresaId') id: string,
        @Query('mes') mes?: string,
        @Query('fechaInicio') fi?: string,
        @Query('fechaFin') ff?: string
    ) {
        if (!id) throw new BadRequestException('ID requerido');
        return await this.cfdiService.getEmitidosIngresos(id, mes, fi, ff);
    }

    @Get('emitidos/nomina')
    async getEmitidosNomina(
        @Query('empresaId') id: string,
        @Query('mes') mes?: string,
        @Query('fechaInicio') fi?: string,
        @Query('fechaFin') ff?: string
    ) {
        if (!id) throw new BadRequestException('ID requerido');
        return await this.cfdiService.getEmitidosNomina(id, mes, fi, ff);
    }

    @Get('emitidos/pagos')
    async getEmitidosPagos(
        @Query('empresaId') id: string,
        @Query('mes') mes?: string,
        @Query('fechaInicio') fi?: string,
        @Query('fechaFin') ff?: string
    ) {
        if (!id) throw new BadRequestException('ID requerido');
        return await this.cfdiService.getEmitidosPagos(id, mes, fi, ff);
    }

    @Get('emitidos/egresos')
    async getEmitidosEgresos(
        @Query('empresaId') id: string,
        @Query('mes') mes?: string,
        @Query('fechaInicio') fi?: string,
        @Query('fechaFin') ff?: string
    ) {
        if (!id) throw new BadRequestException('ID requerido');
        return await this.cfdiService.getEmitidosEgresos(id, mes, fi, ff);
    }

    @Get('recibidos/gastos')
    async getRecibidosGastos(
        @Query('empresaId') id: string,
        @Query('mes') mes?: string,
        @Query('fechaInicio') fi?: string,
        @Query('fechaFin') ff?: string
    ) {
        if (!id) throw new BadRequestException('ID requerido');
        return await this.cfdiService.getRecibidosGastos(id, mes, fi, ff);
    }

    @Get('recibidos/egresos')
    async getRecibidosEgresos(
        @Query('empresaId') id: string,
        @Query('mes') mes?: string,
        @Query('fechaInicio') fi?: string,
        @Query('fechaFin') ff?: string
    ) {
        if (!id) throw new BadRequestException('ID requerido');
        return await this.cfdiService.getRecibidosEgresos(id, mes, fi, ff);
    }

    @Get('recibidos/pagos')
    async getRecibidosPagos(
        @Query('empresaId') id: string,
        @Query('mes') mes?: string,
        @Query('fechaInicio') fi?: string,
        @Query('fechaFin') ff?: string
    ) {
        if (!id) throw new BadRequestException('ID requerido');
        return await this.cfdiService.getRecibidosPagos(id, mes, fi, ff);
    }
}
