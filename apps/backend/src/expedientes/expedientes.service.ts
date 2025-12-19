import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class ExpedientesService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly s3Service: S3Service,
    ) {}

    async updateExpediente(uuid: string, body: any) {
        const { tipoGasto, notas, estatus } = body;
        const query = `
            UPDATE expedientes_materialidad
            SET tipo_gasto = $1, notas = $2, estatus = $3
            WHERE uuid = $4;
        `;
        await this.databaseService.query(query, [tipoGasto, notas, estatus, uuid]);
        return { message: 'Expediente actualizado correctamente.' };
    }

    async uploadFiles(uuid: string, files: Array<Express.Multer.File>) {
        const uploadedFiles = [];
        for (const file of files) {
            const s3Key = `${uuid}/${file.originalname}`;
            await this.s3Service.uploadFile(file.buffer, s3Key);
            const query = `
                INSERT INTO archivo_expediente (uuid_expediente, nombre, tipo)
                VALUES ($1, $2, $3);
            `;
            await this.databaseService.query(query, [uuid, file.originalname, file.mimetype]);
            uploadedFiles.push({ name: file.originalname, type: file.mimetype });
        }
        return { message: 'Archivos subidos correctamente.', files: uploadedFiles };
    }

    async getProgress(uuid: string) {
        const query = `
            SELECT tipo_gasto, 
                (CASE WHEN tipo_gasto IS NOT NULL THEN 30 ELSE 0 END) +
                (CASE WHEN EXISTS (
                    SELECT 1 FROM archivo_expediente WHERE uuid_expediente = $1 AND tipo = 'contrato'
                ) THEN 40 ELSE 0 END) +
                (CASE WHEN EXISTS (
                    SELECT 1 FROM archivo_expediente WHERE uuid_expediente = $1 AND tipo = 'pago'
                ) THEN 30 ELSE 0 END) AS progress
            FROM expedientes_materialidad
            WHERE uuid = $1;
        `;
        const result = await this.databaseService.query(query, [uuid]);
        return result[0];
    }

    async markComplete(uuid: string) {
        const query = `
            UPDATE expedientes_materialidad
            SET estatus = 'Completo'
            WHERE uuid = $1;
        `;
        await this.databaseService.query(query, [uuid]);

        // Trigger recalculation of risk and alerts
        await this.recalculateRisk(uuid);

        return { message: 'Expediente marcado como completo.' };
    }

    async recalculateRisk(uuid: string) {
        const query = `
            DELETE FROM alertas_riesgo
            WHERE uuid_expediente = $1 AND tipo_alerta = 'CFDI sin materialidad';
        `;
        await this.databaseService.query(query, [uuid]);
    }
}