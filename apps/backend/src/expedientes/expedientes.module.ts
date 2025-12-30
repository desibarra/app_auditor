import { Module } from '@nestjs/common';
import { ExpedientesController } from './expedientes.controller';
import { ExpedientesService } from './expedientes.service';
import { DatabaseModule } from '../database/database.module';
import { S3Module } from '../s3/s3.module';

@Module({
    imports: [
        DatabaseModule, // Provee DatabaseService
        S3Module,       // Provee S3Service
    ],
    controllers: [ExpedientesController],
    providers: [ExpedientesService],
    exports: [
        ExpedientesService, // 👈 CLAVE para que otros módulos lo usen sin romper DI
    ],
})
export class ExpedientesModule {}
