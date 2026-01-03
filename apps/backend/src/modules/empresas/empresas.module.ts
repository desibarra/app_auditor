import { Module } from '@nestjs/common';
import { EmpresasController } from './empresas.controller';
import { EmpresasService } from './empresas.service';
import { CryptoService } from '../../common/crypto.service';

@Module({
    controllers: [EmpresasController],
    providers: [EmpresasService, CryptoService],
})
export class EmpresasModule { }
