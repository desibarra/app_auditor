import { Controller, Get, Post, Put, Delete, Body, Param, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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

    @Post(':id/fiel')
    @UseInterceptors(FileFieldsInterceptor([
        { name: 'cer', maxCount: 1 },
        { name: 'key', maxCount: 1 },
    ]))
    async uploadFiel(
        @Param('id') id: string,
        @UploadedFiles() files: { cer?: Express.Multer.File[], key?: Express.Multer.File[] },
        @Body() body: { passwordFiel: string, passwordCiec?: string }
    ) {
        const cerFile = files.cer?.[0];
        const keyFile = files.key?.[0];

        return this.empresasService.actualizarFiel(id, {
            cer: cerFile,
            key: keyFile,
            passwordFiel: body.passwordFiel,
            passwordCiec: body.passwordCiec
        });
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

