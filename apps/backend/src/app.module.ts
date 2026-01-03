import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { CfdiModule } from './modules/cfdi/cfdi.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { DatabaseModule } from './database/database.module';
import { ExpedientesModule } from './modules/expedientes/expedientes.module';
import { S3Module } from './s3/s3.module';
import { SeedModule } from './modules/seed/seed.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { EvidenciasModule } from './modules/evidencias/evidencias.module';
import { StatsModule } from './modules/stats/stats.module';

// Incluye módulo de auditoría para endpoint periodos-disponibles
@Module({
    imports: [
        StatsModule, // Movido al inicio para forzar carga
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        DatabaseModule,
        AuthModule,
        EmpresasModule,
        CfdiModule,
        DashboardModule,
        AuditoriaModule,
        ExpedientesModule,
        S3Module,
        SeedModule,
        ReportesModule,
        EvidenciasModule,
        StatsModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
