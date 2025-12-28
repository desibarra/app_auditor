import { Injectable, Inject } from '@nestjs/common';
import { StatsService } from '../stats/stats.service';

@Injectable()
export class DashboardService {
    constructor(
        private readonly statsService: StatsService
    ) { }

    async getOverview(empresaId: string) {
        // Redirigir a StatsService para consistencia única de datos (SQL PURO)
        return this.statsService.getDashboard(empresaId);
    }
}
