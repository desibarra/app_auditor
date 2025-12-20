import { Controller, Post, Get, Delete, Body, Query, Param, UseInterceptors, UploadedFile, BadRequestException, Logger, InternalServerErrorException, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BancosService } from './bancos.service';
import { Response } from 'express';

@Controller('bancos')
export class BancosController {
    private readonly logger = new Logger(BancosController.name);

    constructor(private readonly bancosService: BancosService) { }

    @Get('ping')
    ping() {
        this.logger.log('Ping endpoint reached');
        return { status: 'ok', module: 'Bancos' };
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadEstadoCuenta(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { empresaId: string; banco: string; anio: number; mes: number; cuenta: string }
    ) {
        if (!file) throw new BadRequestException('Archivo requerido');
        if (!body.empresaId || !body.banco || !body.anio || !body.mes || !body.cuenta) {
            throw new BadRequestException('Faltan datos obligatorios');
        }

        try {
            return await this.bancosService.procesarEstadoCuenta(file, body.empresaId, body.banco, body.cuenta, Number(body.anio), Number(body.mes));
        } catch (error) {
            this.logger.error(`Error procesando archivo: ${error.message}`, error.stack);
            throw new InternalServerErrorException(error.message || 'Error interno al procesar estado de cuenta');
        }
    }

    @Get('movimientos')
    async getMovimientos(
        @Query('empresaId') empresaId: string,
        @Query('anio') anio: number,
        @Query('mes') mes: number
    ) {
        try {
            return await this.bancosService.getMovimientos(empresaId, Number(anio), Number(mes));
        } catch (error) {
            this.logger.error(`Error fetching movimientos: ${error.message}`, error.stack);
            throw new InternalServerErrorException(error.message);
        }
    }

    @Post('conciliar')
    async conciliarMovimiento(
        @Body() body: { movimientoId: string; cfdiUuid: string }
    ) {
        return await this.bancosService.conciliar(body.movimientoId, body.cfdiUuid);
    }

    @Delete(':id')
    async deleteEstadoCuenta(@Param('id') id: string) {
        return await this.bancosService.deleteEstadoCuenta(id);
    }

    @Delete('periodo')
    async deletePeriodo(
        @Query('empresaId') empresaId: string,
        @Query('anio') anio: number,
        @Query('mes') mes: number
    ) {
        return await this.bancosService.deletePeriodo(empresaId, Number(anio), Number(mes));
    }

    @Get('export-excel')
    async exportExcel(
        @Query('empresaId') empresaId: string,
        @Query('anio') anio: number,
        @Query('mes') mes: number,
        @Res() res: Response
    ) {
        const buffer = await this.bancosService.exportarExcel(empresaId, Number(anio), Number(mes));
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename=Reporte_Bancos_${mes}_${anio}.xlsx`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
}
