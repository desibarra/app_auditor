import { Injectable, Logger, InternalServerErrorException, Optional, Inject } from '@nestjs/common';
import { S3Service } from '../../s3/s3.service';
import { Express } from 'express';
import { analysisSnapshots } from '../../database/schemas/analysis_snapshots.schema';
import { eq, desc } from 'drizzle-orm';
import { setTimeout } from 'timers/promises';

@Injectable()
export class ExpedientesService {
  private readonly logger = new Logger(ExpedientesService.name);

  constructor(
    @Inject('DRIZZLE_CLIENT') private readonly db: any,
    @Optional() private readonly s3Service?: S3Service,
  ) { }

  async uploadFile(file: Express.Multer.File, s3Key: string): Promise<string> {
    if (this.s3Service) {
      await this.s3Service.uploadFile(file, s3Key);
    } else {
      this.logger.warn('S3Service is not available. File upload skipped.');
    }
    return;
  }

  async findAllByEmpresa(empresaId: string) {
    try {
      const snapshots = await this.db
        .select()
        .from(analysisSnapshots)
        .where(eq(analysisSnapshots.empresaId, empresaId))
        .orderBy(desc(analysisSnapshots.timestampFinalizacion));

      // Mapear a la interfaz que espera el frontend
      return snapshots.map(s => ({
        id: s.id,
        folio: s.analysisEventId.substring(0, 8).toUpperCase(),
        nombre: `CIERRE MENSUAL ${s.periodo}`,
        montoTotalIva: 0, // Placeholder
        cantidadCfdis: 0, // Placeholder
        estado: 'COMPLETO',
        fechaCreacion: new Date(s.timestampFinalizacion).toISOString()
      }));
    } catch (error) {
      this.logger.error(`Error fetching expedientes for ${empresaId}`, error.stack);
      return [];
    }
  }

  async analyzePeriod(empresaId: string, periodo: string): Promise<void> {
    this.emitEvent('ANALYSIS_STARTED', { empresaId, periodo });

    try {
      const timeoutMs = 30000; // 30 seconds timeout
      const result = await Promise.race([
        this.performAnalysis(empresaId, periodo),
        setTimeout(timeoutMs).then(() => {
          throw new Error('Analysis timed out');
        }),
      ]);

      this.emitEvent('ANALYSIS_COMPLETED', { empresaId, periodo, resultado: result });

      // Persist snapshot
      await this.createSnapshot({
        empresaId,
        periodo,
        scoreTotal: result.scoreTotal,
        penalizaciones: JSON.stringify(result.penalizaciones),
        kpis: JSON.stringify(result.kpis),
        timestampFinalizacion: Date.now(),
        versionMotorAnalisis: '1.0.0',
        analysisEventId: result.eventId,
      });
    } catch (error) {
      this.logger.error(`Analysis failed for empresaId: ${empresaId}, periodo: ${periodo}`, error.stack);
      this.emitEvent('ANALYSIS_FAILED', { empresaId, periodo, error: error.message });
      throw new InternalServerErrorException('Analysis failed', error.message);
    }
  }

  private async createSnapshot(snapshot: any): Promise<void> {
    await this.db.insert(analysisSnapshots).values(snapshot);
    this.logger.log(`Snapshot created for empresaId: ${snapshot.empresaId}, periodo: ${snapshot.periodo}`);
  }

  private async performAnalysis(empresaId: string, periodo: string): Promise<any> {
    // Placeholder for actual analysis logic
    return {
      scoreTotal: 85,
      penalizaciones: [{ tipo: 'delay', valor: 5 }],
      kpis: { indicador1: 100, indicador2: 200 },
      eventId: `EV-${Date.now().toString().substring(8)}`,
    };
  }

  private emitEvent(eventType: string, payload: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    this.logger.log(`Event: ${eventType}, Payload: ${JSON.stringify({ ...payload, timestamp })}`);
  }
}
