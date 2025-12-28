import { Module } from '@nestjs/common';
import { DevolucionesController } from './devoluciones.controller';
import { DevolucionesService } from './devoluciones.service';
import { CfdiModule } from '../cfdi/cfdi.module';

@Module({
    imports: [CfdiModule],
    controllers: [DevolucionesController],
    providers: [DevolucionesService],
    exports: [DevolucionesService],
})
export class DevolucionesModule { }
