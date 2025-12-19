import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { CfdiModule } from './modules/cfdi/cfdi.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DatabaseModule } from './database/database.module';
import { ExpedientesModule } from './modules/expedientes/expedientes.module';
import { EvidenciasModule } from './modules/evidencias/evidencias.module';
import { StatsModule } from './modules/stats/stats.module';
import { S3Module } from './s3/s3.module';
import { SeedModule } from './modules/seed/seed.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        DatabaseModule,
        AuthModule,
        EmpresasModule,
        CfdiModule,
        DashboardModule,
        ExpedientesModule,
        EvidenciasModule,
        StatsModule,
        S3Module,
        SeedModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
