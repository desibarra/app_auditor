import { Module } from '@nestjs/common';
import { RiskEngineService } from './risk.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [RiskEngineService],
    exports: [RiskEngineService]
})
export class RiskModule { }
