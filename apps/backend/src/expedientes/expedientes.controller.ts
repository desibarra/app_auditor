import { Controller, Post, Get, Param, Body, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ExpedientesService } from './expedientes.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('expedientes')
export class ExpedientesController {
    constructor(private readonly expedientesService: ExpedientesService) {}

    @Post(':uuid')
    async updateExpediente(@Param('uuid') uuid: string, @Body() body: any) {
        return this.expedientesService.updateExpediente(uuid, body);
    }

    @Post(':uuid/upload')
    @UseInterceptors(FilesInterceptor('files'))
    async uploadFiles(@Param('uuid') uuid: string, @UploadedFiles() files: Array<Express.Multer.File>) {
        return this.expedientesService.uploadFiles(uuid, files);
    }

    @Post(':uuid/complete')
    async markComplete(@Param('uuid') uuid: string) {
        return this.expedientesService.markComplete(uuid);
    }

    @Get(':uuid/progress')
    async getProgress(@Param('uuid') uuid: string) {
        return this.expedientesService.getProgress(uuid);
    }
}