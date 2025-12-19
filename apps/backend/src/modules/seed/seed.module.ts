import { Module } from '@nestjs/common';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { DatabaseService } from '../../database/database.service';
import { ExpedientesService } from '../expedientes/expedientes.service';
import { S3Module } from '../../s3/s3.module';
import { ExpedientesModule } from '../expedientes/expedientes.module';

@Module({
  imports: [
    S3Module,
    ExpedientesModule,
  ],
  controllers: [SeedController],
  providers: [SeedService, DatabaseService, ExpedientesService],
})
export class SeedModule {}