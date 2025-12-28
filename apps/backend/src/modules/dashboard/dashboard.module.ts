import { Module } from '@nestjs/common';
import { SentinelController } from './dashboard.controller';
import { StatsModule } from '../stats/stats.module';

@Module({
    imports: [StatsModule],
    controllers: [SentinelController],
    providers: [],
})
export class SentinelModule { }
