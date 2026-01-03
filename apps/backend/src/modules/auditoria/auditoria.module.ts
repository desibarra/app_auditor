import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuditoriaController } from './auditoria.controller';
import { AuditoriaService } from './auditoria.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AuditoriaController],
  providers: [AuditoriaService],
  exports: [AuditoriaService],
})
export class AuditoriaModule {}