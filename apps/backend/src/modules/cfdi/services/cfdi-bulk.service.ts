import { Injectable, Inject } from '@nestjs/common';
import { CfdiService } from '../cfdi.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { auditLogs, cfdiRecibidos } from '../../../database/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class CfdiBulkService {
    constructor(
        @Inject('DRIZZLE_CLIENT') private db: any,
        private cfdiService: CfdiService,
    ) { }

    /**
     * Procesa una carpeta recursivamente buscando archivos XML para importar
     * @param rootPath Ruta de la carpeta
     * @param empresaId ID de la empresa destino
     */
    async importarDesdeCarpeta(rootPath: string, empresaId: string) {
        console.log(`[BulkImport] Iniciando escaneo en: ${rootPath}`);
        const stats = {
            total: 0,
            procesados: 0,
            duplicados: 0,
            errores: 0
        };

        const files = this.getFilesRecursive(rootPath, '.xml');
        stats.total = files.length;

        for (const filePath of files) {
            try {
                const xmlContent = fs.readFileSync(filePath, 'utf-8');
                const fileHash = crypto.createHash('sha256').update(xmlContent).digest('hex');

                // 1. Validacion por Hash (Idempotencia de Archiov)
                const existsByHash = await this.db.select()
                    .from(cfdiRecibidos)
                    .where(and(
                        eq(cfdiRecibidos.xmlHash, fileHash),
                        eq(cfdiRecibidos.empresaId, empresaId)
                    ))
                    .limit(1);

                if (existsByHash.length > 0) {
                    stats.duplicados++;
                    continue; // Saltar silenciosamente
                }

                // 2. Importacion usando el servicio core (que ahora valida UUID + EmpresaId)
                // Simulamos un Multer File
                const mockFile: any = {
                    buffer: Buffer.from(xmlContent),
                    originalname: path.basename(filePath)
                };

                const result = await this.cfdiService.importarXml(mockFile, empresaId);

                if (result.duplicado) {
                    stats.duplicados++;
                } else {
                    // Actualizar hash para futuras validaciones
                    await this.db.update(cfdiRecibidos)
                        .set({ xmlHash: fileHash })
                        .where(eq(cfdiRecibidos.uuid, result.uuid));

                    stats.procesados++;
                }

            } catch (error) {
                console.error(`[BulkImport] Error en archivo ${filePath}:`, error.message);
                stats.errores++;
            }
        }

        // 3. Registrar en Audit Log
        await this.db.insert(auditLogs).values({
            empresaId,
            accion: 'IMPORTACION_MASIVA_CARPETA',
            entidad: 'cfdi_recibidos',
            detalles: JSON.stringify({
                path: rootPath,
                stats
            })
        });

        console.log(`[BulkImport] Finalizado: ${stats.procesados} cargados, ${stats.duplicados} duplicados, ${stats.errores} errores.`);
        return stats;
    }

    private getFilesRecursive(dir: string, ext: string): string[] {
        let results: string[] = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(this.getFilesRecursive(filePath, ext));
            } else if (file.toLowerCase().endsWith(ext)) {
                results.push(filePath);
            }
        });
        return results;
    }
}
