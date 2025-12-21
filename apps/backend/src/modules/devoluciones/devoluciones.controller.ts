import { Controller, Get, Post, Body, Param, Headers, ParseIntPipe, UseGuards } from '@nestjs/common';
import { DevolucionesService } from './devoluciones.service';

@Controller('devoluciones')
export class DevolucionesController {
    constructor(private readonly devolucionesService: DevolucionesService) { }

    @Get()
    async findAll(@Headers('x-empresa-id') empresaId: string) {
        return await this.devolucionesService.findAll(empresaId);
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return await this.devolucionesService.findOne(id);
    }

    @Get(':id/cedulas')
    async getCedulas(@Param('id', ParseIntPipe) id: number) {
        return await this.devolucionesService.getCedulas(id);
    }

    @Post()
    async create(
        @Headers('x-empresa-id') empresaId: string,
        @Body() body: { periodo: string; nombre: string }
    ) {
        return await this.devolucionesService.create(empresaId, body.periodo, body.nombre);
    }
}
