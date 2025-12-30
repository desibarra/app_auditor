import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { EmpresasService, CrearEmpresaDto } from './empresas.service';

@Controller('empresas')
export class EmpresasController {
    constructor(private readonly empresasService: EmpresasService) { }

    @Get()
    async findAll() {
        return this.empresasService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.empresasService.findOne(id);
    }

    @Post()
    async create(@Body() body: CrearEmpresaDto) {
        try {
            return await this.empresasService.create(body);
        } catch (error: any) {
            // DEBUG: Devolver error completo
            return {
                _debug: true,
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                    response: error.response,
                    status: error.status
                }
            };
        }
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() body: Partial<CrearEmpresaDto>) {
        return this.empresasService.update(id, body);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.empresasService.delete(id);
    }
}
