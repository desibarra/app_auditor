import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { documentosSoporte } from '../../database/schema/documentos_soporte';
import { cfdiRecibidos } from '../../database/schema/cfdi_recibidos.schema';
import {
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME, STORAGE_CONFIG } from '../../config/storage.config';
import { getCategoriasPorTipo } from './categorias.config';
import * as path from 'path';
import { Readable } from 'stream';

export interface EvidenciaDto {
    cfdiUuid: string;
    categoria: string;
    descripcion?: string;
}

@Injectable()
export class EvidenciasService {
    constructor(@Inject('DRIZZLE_CLIENT') private readonly db: any) { }

    /**
     * Sube una evidencia a S3 y registra en BD
     */
    async uploadEvidencia(
        dto: EvidenciaDto,
        file: Express.Multer.File,
    ): Promise<any> {
        // 1. Validar que el CFDI existe
        const cfdi = await this.db
            .select()
            .from(cfdiRecibidos)
            .where(eq(cfdiRecibidos.uuid, dto.cfdiUuid))
            .limit(1);

        if (!cfdi || cfdi.length === 0) {
            throw new NotFoundException(`CFDI ${dto.cfdiUuid} no encontrado`);
        }

        // 2. Validar tipo de archivo
        this.validateFile(file);

        // 3. Generar nombre único para el archivo
        const fileName = this.generateUniqueFilename(dto.cfdiUuid, file.originalname);
        const s3Key = `${cfdi[0].empresaId}/${dto.cfdiUuid}/${fileName}`;

        try {
            // 4. Subir a S3/MinIO
            await s3Client.send(
                new PutObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: s3Key,
                    Body: file.buffer,
                    ContentType: file.mimetype,
                    Metadata: {
                        cfdiUuid: dto.cfdiUuid,
                        categoria: dto.categoria,
                        originalName: file.originalname,
                    },
                }),
            );

            // 5. Registrar en BD
            const [evidencia] = await this.db
                .insert(documentosSoporte)
                .values({
                    cfdiUuid: dto.cfdiUuid,
                    tipoDocumento: dto.categoria,
                    categoriaEvidencia: dto.categoria,
                    descripcionEvidencia: dto.descripcion || file.originalname,
                    archivo: s3Key,
                    estado: 'completado',
                    fechaSubida: new Date(),
                    fechaActualizacion: new Date(),
                    intentosSubida: 1,
                    // expedienteId se deja null ya que es para evidencia de materialidad
                    expedienteId: null as any, // Temporal, necesitamos hacer el campo opcional
                })
                .returning();

            return {
                success: true,
                evidencia: {
                    id: evidencia.id,
                    cfdiUuid: evidencia.cfdiUuid,
                    categoria: evidencia.categoriaEvidencia,
                    descripcion: evidencia.descripcionEvidencia,
                    archivo: evidencia.archivo,
                    tipoArchivo: file.mimetype,
                    tamanoBytes: file.size,
                    fechaSubida: evidencia.fechaSubida,
                },
            };
        } catch (error) {
            // Si falla el upload a S3, registrar el error
            await this.db.insert(documentosSoporte).values({
                cfdiUuid: dto.cfdiUuid,
                tipoDocumento: dto.categoria,
                categoriaEvidencia: dto.categoria,
                descripcionEvidencia: dto.descripcion || file.originalname,
                estado: 'error',
                intentosSubida: 1,
                ultimoError: error.message,
                expedienteId: null as any,
            });

            throw new BadRequestException(
                `Error al subir archivo: ${error.message}`,
            );
        }
    }

    /**
     * Obtiene todas las evidencias de un CFDI
     */
    async getEvidenciasByCfdi(cfdiUuid: string): Promise<any[]> {
        const evidencias = await this.db
            .select()
            .from(documentosSoporte)
            .where(eq(documentosSoporte.cfdiUuid, cfdiUuid));

        return evidencias.map((ev) => ({
            id: ev.id,
            cfdiUuid: ev.cfdiUuid,
            categoria: ev.categoriaEvidencia,
            descripcion: ev.descripcionEvidencia,
            archivo: ev.archivo,
            estado: ev.estado,
            fechaSubida: ev.fechaSubida,
            tipoArchivo: this.getFileExtension(ev.archivo || ''),
        }));
    }

    /**
     * Cuenta las evidencias de un CFDI
     */
    async contarEvidencias(cfdiUuid: string): Promise<number> {
        const evidencias = await this.db
            .select()
            .from(documentosSoporte)
            .where(
                and(
                    eq(documentosSoporte.cfdiUuid, cfdiUuid),
                    eq(documentosSoporte.estado, 'completado'),
                ),
            );

        return evidencias.length;
    }

    /**
     * Elimina una evidencia (BD + S3)
     */
    async deleteEvidencia(id: number): Promise<void> {
        // 1. Buscar evidencia
        const [evidencia] = await this.db
            .select()
            .from(documentosSoporte)
            .where(eq(documentosSoporte.id, id))
            .limit(1);

        if (!evidencia) {
            throw new NotFoundException(`Evidencia ${id} no encontrada`);
        }

        // 2. Eliminar de S3 si existe
        if (evidencia.archivo) {
            try {
                await s3Client.send(
                    new DeleteObjectCommand({
                        Bucket: BUCKET_NAME,
                        Key: evidencia.archivo,
                    }),
                );
            } catch (error) {
                console.error('Error al eliminar de S3:', error);
                // Continuar con la eliminación de BD aunque falle S3
            }
        }

        // 3. Eliminar de BD
        await this.db
            .delete(documentosSoporte)
            .where(eq(documentosSoporte.id, id));
    }

    /**
     * Descarga un archivo de S3
     */
    async downloadEvidencia(id: number): Promise<{ stream: Readable; metadata: any }> {
        // 1. Buscar evidencia
        const [evidencia] = await this.db
            .select()
            .from(documentosSoporte)
            .where(eq(documentosSoporte.id, id))
            .limit(1);

        if (!evidencia || !evidencia.archivo) {
            throw new NotFoundException(`Evidencia ${id} no encontrada`);
        }

        // 2. Descargar de S3
        try {
            const response = await s3Client.send(
                new GetObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: evidencia.archivo,
                }),
            );

            return {
                stream: response.Body as Readable,
                metadata: {
                    contentType: response.ContentType,
                    contentLength: response.ContentLength,
                    fileName: path.basename(evidencia.archivo),
                },
            };
        } catch (error) {
            throw new NotFoundException(`Archivo no encontrado en S3: ${error.message}`);
        }
    }

    /**
     * Obtiene las categorías disponibles para un tipo de CFDI
     */
    getCategoriasPorTipo(tipoComprobante: string) {
        return getCategoriasPorTipo(tipoComprobante);
    }

    /**
     * Valida que el archivo cumpla con los requisitos
     */
    private validateFile(file: Express.Multer.File): void {
        // Validar tamaño
        if (file.size > STORAGE_CONFIG.maxFileSize) {
            throw new BadRequestException(
                `El archivo excede el tamaño máximo de ${STORAGE_CONFIG.maxFileSize / 1024 / 1024}MB`,
            );
        }

        // Validar tipo MIME
        if (!STORAGE_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Tipo de archivo no permitido. Solo se aceptan: ${STORAGE_CONFIG.allowedMimeTypes.join(', ')}`,
            );
        }

        // Validar extensión
        const ext = path.extname(file.originalname).toLowerCase();
        if (!STORAGE_CONFIG.allowedExtensions.includes(ext)) {
            throw new BadRequestException(
                `Extensión de archivo no permitida. Solo se aceptan: ${STORAGE_CONFIG.allowedExtensions.join(', ')}`,
            );
        }
    }

    /**
     * Genera un nombre único para el archivo
     */
    private generateUniqueFilename(cfdiUuid: string, originalName: string): string {
        const timestamp = Date.now();
        const ext = path.extname(originalName);
        const sanitizedName = this.sanitizeFilename(
            path.basename(originalName, ext),
        );
        return `${sanitizedName}_${timestamp}${ext}`;
    }

    /**
     * Sanitiza el nombre del archivo
     */
    private sanitizeFilename(filename: string): string {
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .toLowerCase()
            .substring(0, 50); // Limitar longitud
    }

    /**
     * Obtiene la extensión del archivo
     */
    private getFileExtension(filepath: string): string {
        return path.extname(filepath).substring(1).toLowerCase();
    }
}
