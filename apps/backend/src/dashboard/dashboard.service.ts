import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DashboardService {
    constructor(private readonly databaseService: DatabaseService) {}

    async getIngresosEgresos() {
        const query = `
            SELECT 
                TO_CHAR(fecha, 'YYYY-MM') AS month,
                SUM(CASE WHEN tipo = 'I' THEN monto ELSE 0 END) AS ingresos,
                SUM(CASE WHEN tipo = 'E' THEN monto ELSE 0 END) AS egresos
            FROM cfdi
            WHERE fecha >= NOW() - INTERVAL '6 months'
            GROUP BY month
            ORDER BY month;
        `;

        return this.databaseService.query(query);
    }

    async getCfdiDelMes() {
        const query = `
            SELECT 
                SUM(CASE WHEN tipo = 'I' THEN 1 ELSE 0 END) AS ingresos,
                SUM(CASE WHEN tipo = 'E' THEN 1 ELSE 0 END) AS egresos
            FROM cfdi
            WHERE fecha >= date_trunc('month', NOW());
        `;

        return this.databaseService.query(query);
    }

    async getAlertasActivas() {
        const query = `
            SELECT 
                SUM(CASE WHEN nivel = 'alta' THEN 1 ELSE 0 END) AS alta,
                SUM(CASE WHEN nivel = 'media' THEN 1 ELSE 0 END) AS media
            FROM alertas_riesgo
            WHERE activa = true;
        `;

        return this.databaseService.query(query);
    }

    async getGastoProveedoresRiesgo() {
        const query = `
            SELECT 
                COALESCE(SUM(monto), 0) * 100 / NULLIF(SUM(total_egresos), 0) AS porcentaje
            FROM (
                SELECT 
                    monto,
                    SUM(CASE WHEN tipo = 'E' THEN monto ELSE 0 END) OVER () AS total_egresos
                FROM cfdi
                WHERE proveedor_riesgo = true
            ) subquery;
        `;

        return this.databaseService.query(query);
    }

    async getExpedientesIncompletos() {
        const query = `
            SELECT COUNT(*) AS incompletos
            FROM expedientes_materialidad
            WHERE completo = false;
        `;

        return this.databaseService.query(query);
    }
}