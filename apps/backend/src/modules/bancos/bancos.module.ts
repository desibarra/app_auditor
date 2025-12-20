import { Module } from '@nestjs/common';
import { BancosService } from './bancos.service';
import { BancosController } from './bancos.controller';
import { BancosImportController } from './bancos-import.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [BancosController, BancosImportController],
    providers: [BancosService],
    exports: [BancosService],
})
export class BancosModule { }
