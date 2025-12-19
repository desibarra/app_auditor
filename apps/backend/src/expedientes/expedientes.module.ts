import { Module } from '@nestjs/common';
import { ExpedientesController } from './expedientes.controller';
import { ExpedientesService } from './expedientes.service';
import { DatabaseModule } from '../database/database.module';
import { S3Module } from '../s3/s3.module';

@Module({
    imports: [DatabaseModule, S3Module],
    controllers: [ExpedientesController],
    providers: [ExpedientesService],
})
export class ExpedientesModule {}