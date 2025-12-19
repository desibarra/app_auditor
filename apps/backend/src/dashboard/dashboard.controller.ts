import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('ingresos-egresos')
    async getIngresosEgresos() {
        return this.dashboardService.getIngresosEgresos();
    }

    @Get('cfdi-del-mes')
    async getCfdiDelMes() {
        return this.dashboardService.getCfdiDelMes();
    }

    @Get('alertas-activas')
    async getAlertasActivas() {
        return this.dashboardService.getAlertasActivas();
    }

    @Get('gasto-proveedores-riesgo')
    async getGastoProveedoresRiesgo() {
        return this.dashboardService.getGastoProveedoresRiesgo();
    }

    @Get('expedientes-incompletos')
    async getExpedientesIncompletos() {
        return this.dashboardService.getExpedientesIncompletos();
    }
}