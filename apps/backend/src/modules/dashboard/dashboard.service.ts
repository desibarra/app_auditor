import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
    async getOverview(empresaId: string) {
        // TODO: Consultar métricas reales de BD
        return {
            empresaId,
            kpis: {
                cfdiDelMes: {
                    total: 145,
                    ingresos: 89,
                    egresos: 56,
                },
                alertasActivas: {
                    total: 12,
                    alta: 3,
                    media: 5,
                    baja: 4,
                },
                gastoProveedoresRiesgo: 18.5, // porcentaje
                expedientesIncompletos: 7,
            },
            topAlertas: [
                {
                    id: '1',
                    tipo: 'proveedor_efos',
                    nivel: 'alta',
                    mensaje: 'Proveedor XYZ identificado como posible EFOS',
                    fecha: new Date().toISOString(),
                },
                {
                    id: '2',
                    tipo: 'cfdi_sin_evidencia',
                    nivel: 'media',
                    mensaje: '5 CFDI de servicios sin expediente de materialidad',
                    fecha: new Date().toISOString(),
                },
                {
                    id: '3',
                    tipo: 'tasa_atipica',
                    nivel: 'media',
                    mensaje: 'Tasa efectiva de ISR inusualmente baja (8.2%)',
                    fecha: new Date().toISOString(),
                },
            ],
            ingresosEgresos: [
                { mes: 'Jul', ingresos: 450000, egresos: 320000 },
                { mes: 'Ago', ingresos: 520000, egresos: 380000 },
                { mes: 'Sep', ingresos: 480000, egresos: 350000 },
                { mes: 'Oct', ingresos: 510000, egresos: 390000 },
                { mes: 'Nov', ingresos: 490000, egresos: 370000 },
                { mes: 'Dic', ingresos: 550000, egresos: 410000 },
            ],
        };
    }

    getDemoEmpresaOverview() {
        return {
            totalCfdiMes: {
                ingresos: 120,
                egresos: 80,
            },
            alertasActivas: {
                alta: 5,
                media: 10,
            },
            gastoProveedoresRiesgo: 25, // porcentaje
            expedientesIncompletos: 3,
        };
    }
}
