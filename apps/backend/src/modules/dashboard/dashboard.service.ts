import { Injectable, Inject } from '@nestjs/common';
import { cfdiRiesgos } from '../../database/schema';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class DashboardService {
    constructor(@Inject('DRIZZLE_CLIENT') private db: any) { }

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
            topAlertas: await this.getTopRisks(empresaId),
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

    async getTopRisks(empresaId: string) {
        // Fetch real alerts from DB
        const riesgos = await this.db.select()
            .from(cfdiRiesgos)
            .where(eq(cfdiRiesgos.empresaId, empresaId))
            .orderBy(desc(cfdiRiesgos.fechaAnalisis))
            .limit(5);

        return riesgos.map(r => ({
            id: r.id,
            tipo: r.tipoRiesgo.toLowerCase(),
            nivel: r.nivelRiesgo.toLowerCase(),
            mensaje: r.titulo,
            fecha: r.fechaAnalisis
        }));
    }
}
