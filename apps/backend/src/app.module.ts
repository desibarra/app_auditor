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
import { LegajoModule } from './modules/legajo/legajo.module';
import { BancosModule } from './modules/bancos/bancos.module';

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
        LegajoModule,
        BancosModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
