import { Module } from '@nestjs/common';
import { DevolucionesIvaService } from './devoluciones-iva.service';
import { DevolucionesIvaController } from './devoluciones-iva.controller';

@Module({
  controllers: [DevolucionesIvaController],
  providers: [DevolucionesIvaService],
})
export class DevolucionesIvaModule {}