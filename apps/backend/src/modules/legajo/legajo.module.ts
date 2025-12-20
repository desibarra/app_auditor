import { Module } from '@nestjs/common';
import { LegajoController } from './legajo.controller';
import { LegajoService } from './legajo.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [LegajoController],
    providers: [LegajoService],
})
export class LegajoModule { }
