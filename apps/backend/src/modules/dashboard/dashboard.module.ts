import { Module } from '@nestjs/common';
import { SentinelController, DashboardUIController } from './dashboard.controller';
import { StatsModule } from '../stats/stats.module';

@Module({
    imports: [StatsModule],
    controllers: [SentinelController, DashboardUIController],
    providers: [],
})
export class SentinelModule { }
