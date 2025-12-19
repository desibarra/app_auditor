import { Module } from '@nestjs/common';
import { CfdiController } from './cfdi.controller';
import { CfdiService } from './cfdi.service';
import { CfdiParserService } from './services/cfdi-parser.service';

@Module({
    controllers: [CfdiController],
    providers: [CfdiService, CfdiParserService],
    exports: [CfdiService, CfdiParserService],
})
export class CfdiModule { }
