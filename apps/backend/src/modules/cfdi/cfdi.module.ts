import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CfdiController } from './cfdi.controller';
import { CfdiService } from './cfdi.service';
import { CfdiParserService } from './services/cfdi-parser.service';
import { memoryStorage } from 'multer';
import { RiskModule } from '../risk/risk.module';
import { CfdiBulkService } from './services/cfdi-bulk.service';
import { CfdiValidatorService } from './services/cfdi-validator.service';

@Module({
    imports: [
        MulterModule.register({
            storage: memoryStorage(),
            limits: {
                fileSize: 100 * 1024 * 1024, // 100MB por archivo
                files: 1000, // Máximo 1000 archivos
            },
        }),
        RiskModule,
    ],
    controllers: [CfdiController],
    providers: [CfdiService, CfdiParserService, CfdiValidatorService, CfdiBulkService],
    exports: [CfdiService, CfdiParserService, CfdiValidatorService, CfdiBulkService],
})
export class CfdiModule { }
