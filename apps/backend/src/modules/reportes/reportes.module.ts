import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { DatabaseModule } from '../../database/database.module';

/**
 * 📊 MÓDULO DE REPORTES SAT
 * Módulo independiente para generación de reportes oficiales
 */
@Module({
    imports: [DatabaseModule],
    controllers: [ReportesController],
    providers: [ReportesService],
    exports: [ReportesService],
})
export class ReportesModule { }
