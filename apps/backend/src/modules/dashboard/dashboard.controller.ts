import { Controller, Get, Param } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('health')
    health() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'SaaS Fiscal PyMEs API',
        };
    }

    @Get('overview/:empresaId')
    async getOverview(@Param('empresaId') empresaId: string) {
        return this.dashboardService.getOverview(empresaId);
    }

    @Get('overview/demo-empresa')
    getDemoEmpresaOverview() {
        return this.dashboardService.getDemoEmpresaOverview();
    }
}
