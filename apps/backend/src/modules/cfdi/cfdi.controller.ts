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
        @Query('empresaId') empresaIdQuery?: string,
        @Body('empresaId') empresaIdBody?: string,
    ) {
        const empresaId = empresaIdQuery || empresaIdBody;
        try {
            console.log('[CFDI Upload] Iniciando importación de XML...');
            console.log('[CFDI Upload] Archivo recibido:', file ? file.originalname : 'NO FILE');
            console.log('[CFDI Upload] EmpresaId (Query|Body):', empresaId);

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
    async sincronizarSat(@Body() body: { empresaId: string, periodo?: string }) {
        if (!body.empresaId) {
            throw new BadRequestException('Se requiere empresaId');
        }
        return await this.cfdiService.sincronizarEmpresa(body.empresaId, body.periodo);
    }

    /**
     * GET /api/cfdi/resumen-mensual
     * 📊 TABLA DE CONTROL MENSUAL - INDEPENDIENTE DE FILTROS
     * 
     * Retorna conteo de CFDIs por mes y tipo de comprobante
     * Para detectar faltantes rápidamente
     */
    @Get('resumen-mensual')
    async getResumenMensual(
        @Query('empresaId') empresaId: string,
        @Query('rol') rol?: 'EMITIDO' | 'RECIBIDO' | 'AMBOS'
    ) {
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

    /**
     * 🔍 ENDPOINT DE AUDITORÍA FORENSE
     * Uso exclusivo para drill-down desde tablas de control.
     */
    @Get('auditoria/detalle')
    async getDetalleAuditoria(
        @Query('empresaId') empresaId: string,
        @Query('rol') rol: 'EMISOR' | 'RECEPTOR',
        @Query('tipo') tipo: string,
        @Query('mes') mes: string
    ) {
        if (!empresaId || !rol || !tipo || !mes) throw new BadRequestException('Faltan parámetros de auditoría');
        return await this.cfdiService.getDetalleAuditoria(empresaId, rol, tipo, mes);
    }

    /**
     * 🛡️ ENDPOINT AUDITORÍA 1x1 - DEFENSA FISCAL SAT
     * GET /api/cfdi/detalle-mes/:empresaId/:mes/:dominio/:tipo
     * 
     * Retorna TODOS los CFDIs de un mes específico con información completa
     * para auditoría forense y defensa ante SAT
     */
    @Get('detalle-mes/:empresaId/:mes/:dominio/:tipo')
    async getDetalleMes(
        @Param('empresaId') empresaId: string,
        @Param('mes') mes: string,
        @Param('dominio') dominio: 'emitidos' | 'recibidos',
        @Param('tipo') tipo: 'ingresos' | 'egresos' | 'nomina' | 'pagos'
    ) {
        return await this.cfdiService.getDetalleAuditoria(
            empresaId,
            (dominio === 'emitidos' ? 'EMISOR' : 'RECEPTOR'),
            (tipo === 'ingresos' ? 'I' : tipo === 'egresos' ? 'E' : tipo === 'nomina' ? 'N' : 'P'),
            mes
        );
    }



    // TEMPORALMENTE DESHABILITADO - Método no existe en servicio
    // /**
    //  * 🛡️ ENDPOINT REPORTE PAGOS Y COMPLEMENTOS (SAT-GRADE)
    //  * GET /api/cfdi/pagos-complementos
    //  * Relaciona Facturas PPD con sus Complementos de Pago
    //  */
    // @Get('pagos-complementos')
    // async getPagosComplementos(
    //     @Query('empresaId') empresaId: string,
    //     @Query('mes') mes: string
    // ) {
    //     if (!empresaId || !mes) throw new BadRequestException('Faltan empresaId o mes (YYYY-MM)');
    //     return await this.cfdiService.getReportePagosComplementos(empresaId, mes);
    // }


    /**
     * 🛡️ INFORME MENSUAL DE DEFENSA FISCAL SAT-GRADE
     * GET /api/cfdi/defense-report
     * Genera informe completo para devolución de IVA
     */
    @Get('defense-report')
    async defenseReport(
        @Query('empresaId') empresaId: string,
        @Query('mes') mes: string,
    ) {
        console.log('[DEFENSE REPORT] Iniciando generación...', { empresaId, mes });

        if (!empresaId || !mes) {
            console.error('[DEFENSE REPORT] ERROR: Faltan parámetros', { empresaId, mes });
            throw new BadRequestException('Faltan empresaId o mes (YYYY-MM)');
        }

        const resultado = await this.cfdiService.generateDefenseReport(empresaId, mes);
        console.log('[DEFENSE REPORT] ✅ Generado exitosamente');
        return resultado;
    }

    /**
     * 💰 COMPLEMENTOS DE PAGO - TRAZABILIDAD FISCAL
     * GET /api/cfdi/complementos-pago
     * Muestra qué CFDIs están pagados, cuáles tienen complemento y cuáles NO
     */
    @Get('complementos-pago')
    async getComplementosPago(
        @Query('empresaId') empresaId: string,
        @Query('periodo') periodo: string,
        @Query('origen') origen: 'RECIBIDOS' | 'EMITIDOS' = 'RECIBIDOS'
    ) {
        console.log('[COMPLEMENTOS PAGO] Iniciando...', { empresaId, periodo, origen });

        if (!empresaId || !periodo) {
            console.error('[COMPLEMENTOS PAGO] ERROR: Faltan parámetros', { empresaId, periodo });
            throw new BadRequestException('Faltan empresaId o periodo (YYYY-MM)');
        }

        const resultado = await this.cfdiService.getComplementosPago(empresaId, periodo, origen);
        console.log('[COMPLEMENTOS PAGO] ✅ Completado exitosamente');
        return resultado;
    }

    /**
     * 💰 DETALLE AUDITABLE - COMPLEMENTOS DE PAGO
     * GET /api/cfdi/complementos-pago/detalle
     */
    @Get('complementos-pago/detalle')
    async getComplementosPagoDetalle(
        @Query('empresaId') empresaId: string,
        @Query('periodo') periodo: string,
        @Query('estadoComplemento') estadoComplemento: string,
        @Query('origen') origen: 'RECIBIDOS' | 'EMITIDOS' = 'RECIBIDOS'
    ) {
        if (!empresaId || !periodo || !estadoComplemento) {
            throw new BadRequestException('Faltan parámetros empresaId, periodo o estadoComplemento');
        }

        return await this.cfdiService.getComplementosPagoDetalle(empresaId, periodo, estadoComplemento, origen);
    }

    /**
     * GET /api/cfdi/historial-estatus
     * Retorna bitácora de cambios de estatus SAT
     */
    @Get('historial-estatus')
    async getHistorialEstatus(@Query('empresaId') empresaId: string) {
        if (!empresaId) throw new BadRequestException('Se requiere empresaId');
        return await this.cfdiService.getHistorialCambiosEstatus(empresaId);
    }
}
