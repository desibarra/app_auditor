import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { DatabaseModule } from '../../database/database.module';
import { CacheService } from '../../common/cache.service';

@Module({
    imports: [DatabaseModule],
    controllers: [StatsController],
    providers: [StatsService, CacheService],
    exports: [StatsService],
})
export class StatsModule { }
