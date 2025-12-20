import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { CfdiController } from './cfdi.controller';
import { CfdiService } from './cfdi.service';
import { CfdiParserService } from './services/cfdi-parser.service';
import { memoryStorage } from 'multer';

@Module({
    imports: [
        MulterModule.register({
            storage: memoryStorage(),
            limits: {
                fileSize: 100 * 1024 * 1024, // 100MB por archivo
                files: 1000, // Máximo 1000 archivos
            },
        }),
    ],
    controllers: [CfdiController],
    providers: [CfdiService, CfdiParserService],
    exports: [CfdiService, CfdiParserService],
})
export class CfdiModule { }
