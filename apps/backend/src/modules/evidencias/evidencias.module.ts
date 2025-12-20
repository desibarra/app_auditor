import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { EvidenciasController } from './evidencias.controller';
import { EvidenciasService } from './evidencias.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [
        DatabaseModule,
        MulterModule.register(),
    ],
    controllers: [EvidenciasController],
    providers: [EvidenciasService],
    exports: [EvidenciasService],
})
export class EvidenciasModule { }
