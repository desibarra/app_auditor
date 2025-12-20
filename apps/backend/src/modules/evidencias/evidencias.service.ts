import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { documentosSoporte } from '../../database/schema/documentos_soporte';
import { cfdiRecibidos } from '../../database/schema/cfdi_recibidos.schema';
import { expedientesDevolucionIva } from '../../database/schema/expedientes_devolucion_iva';
import * as path from 'path';
import * as fs from 'fs';
import { STORAGE_CONFIG } from '../../config/storage.config';
import { getCategoriasPorTipo } from './categorias.config';

export interface EvidenciaDto {
    cfdiUuid: string;
    categoria: string;
    descripcion?: string;
}

@Injectable()
export class EvidenciasService {
    constructor(@Inject('DRIZZLE_CLIENT') private readonly db: any) { }

    async uploadEvidencia(
        dto: EvidenciaDto,
        file: Express.Multer.File,
    ): Promise<any> {
        console.log('🔄 [Service] Iniciando uploadEvidencia (MODO LOCAL)...');

        // 1. Validar que el CFDI existe
        const cfdi = await this.db
            .select()
            .from(cfdiRecibidos)
            .where(eq(cfdiRecibidos.uuid, dto.cfdiUuid))
            .limit(1);

        if (!cfdi || cfdi.length === 0) {
            throw new NotFoundException(`CFDI ${dto.cfdiUuid} no encontrado`);
        }

        // 2. Validar archivo
        this.validateFile(file);

        // 3. Preparar ruta local
        const fileName = this.generateUniqueFilename(dto.cfdiUuid, file.originalname);
        // uploads/evidencias/EMPRESA_ID/UUID
        const relativeDir = path.join('uploads', 'evidencias', cfdi[0].empresaId, dto.cfdiUuid);
        const absoluteDir = path.join(process.cwd(), relativeDir);
        const filePath = path.join(absoluteDir, fileName);

        // Normalizar path para BD (usar forward slashes siempre)
        const relativePathBD = relativeDir.replace(/\\/g, '/') + '/' + fileName;

        try {
            // Asegurar directorio
            await fs.promises.mkdir(absoluteDir, { recursive: true });

            // 4. Guardar archivo localmente
            console.log('🚀 [Service] Guardando en Disco Local:', filePath);
            await fs.promises.writeFile(filePath, file.buffer);
            console.log('✅ [Service] Archivo guardado localmente');

            // 4.5 Obtener o Crear Expediente Dummy (Parche para restricción NOT NULL de BD antigua)
            console.log('🔄 [Service] Buscando/Creando expediente contenedor...');
            let expedienteIdToUse: number;

            const expedientes = await this.db
                .select()
                .from(expedientesDevolucionIva)
                .where(eq(expedientesDevolucionIva.empresaId, cfdi[0].empresaId))
                .limit(1);

            if (expedientes.length > 0) {
                expedienteIdToUse = expedientes[0].id;
                console.log('✅ [Service] Usando expediente existente ID:', expedienteIdToUse);
            } else {
                console.log('⚠️ [Service] No hay expedientes. Creando uno dummy para materialidad...');
                const [nuevoExpediente] = await this.db.insert(expedientesDevolucionIva).values({
                    empresaId: cfdi[0].empresaId,
                    rfcEmpresa: cfdi[0].receptorRfc || 'GENERICO',
                    periodo: '2025-01',
                    tipo: 'Materialidad Automática',
                    estado: 'Generado',
                    fechaCreacion: new Date(),
                    fechaActualizacion: new Date()
                }).returning();
                expedienteIdToUse = nuevoExpediente.id;
                console.log('✅ [Service] Expediente dummy creado ID:', expedienteIdToUse);
            }

            // 5. Registrar en BD
            console.log('🔄 [Service] Guardando en BD...');
            const [evidencia] = await this.db
                .insert(documentosSoporte)
                .values({
                    cfdiUuid: dto.cfdiUuid,
                    tipoDocumento: dto.categoria,
                    categoriaEvidencia: dto.categoria,
                    descripcionEvidencia: dto.descripcion || file.originalname,
                    archivo: relativePathBD,
                    estado: 'completado',
                    fechaSubida: new Date(),
                    fechaActualizacion: new Date(),
                    intentosSubida: 1,
                    expedienteId: expedienteIdToUse, // ¡VALOR REAL NO NULL!
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
            console.error('💥 [Service] Error:', error);
            try {
                await this.db.insert(documentosSoporte).values({
                    cfdiUuid: dto.cfdiUuid,
                    tipoDocumento: dto.categoria,
                    categoriaEvidencia: dto.categoria,
                    descripcionEvidencia: dto.descripcion || file.originalname,
                    estado: 'error',
                    intentosSubida: 1,
                    ultimoError: error.message?.substring(0, 255) || 'Error desconocido',
                    expedienteId: null as any,
                });
            } catch (e) { }

            throw new BadRequestException(`Error al subir archivo: ${error.message}`);
        }
    }

    async downloadEvidencia(id: number): Promise<{ stream: fs.ReadStream; metadata: any }> {
        const [evidencia] = await this.db
            .select()
            .from(documentosSoporte)
            .where(eq(documentosSoporte.id, id))
            .limit(1);

        if (!evidencia || !evidencia.archivo) {
            throw new NotFoundException(`Evidencia ${id} no encontrada`);
        }

        // Asumimos local storage por defecto si no hay prefijo http/s3
        const absolutePath = path.join(process.cwd(), evidencia.archivo);

        if (!fs.existsSync(absolutePath)) {
            throw new NotFoundException(`Archivo físico no encontrado: ${evidencia.archivo}`);
        }

        const stats = fs.statSync(absolutePath);
        const stream = fs.createReadStream(absolutePath);

        return {
            stream,
            metadata: {
                contentType: 'application/octet-stream', // Podríamos guardarlo en BD
                contentLength: stats.size,
                fileName: path.basename(evidencia.archivo),
            },
        };
    }

    /**
     * Obtiene las evidencias de un CFDI
     */
    async getEvidenciasByCfdi(cfdiUuid: string) {
        return await this.db
            .select()
            .from(documentosSoporte)
            .where(eq(documentosSoporte.cfdiUuid, cfdiUuid));
    }

    /**
     * Elimina una evidencia
     */
    async deleteEvidencia(id: number): Promise<void> {
        // 1. Verificar existencia
        const [evidencia] = await this.db
            .select()
            .from(documentosSoporte)
            .where(eq(documentosSoporte.id, id))
            .limit(1);

        if (!evidencia) {
            throw new NotFoundException(`Evidencia ${id} no encontrada`);
        }

        // 2. Eliminar archivo físico (Local)
        if (evidencia.archivo) {
            try {
                const absolutePath = path.join(process.cwd(), evidencia.archivo);
                if (fs.existsSync(absolutePath)) {
                    await fs.promises.unlink(absolutePath);
                }
            } catch (error) {
                console.error('Error al eliminar archivo local:', error);
                // Continuar borrando de BD
            }
        }

        // 3. Eliminar de BD
        await this.db
            .delete(documentosSoporte)
            .where(eq(documentosSoporte.id, id));
    }

    async contarEvidencias(cfdiUuid: string): Promise<number> {
        const result = await this.db
            .select()
            .from(documentosSoporte)
            .where(eq(documentosSoporte.cfdiUuid, cfdiUuid));
        return result.length;
    }

    getCategoriasPorTipo(tipoComprobante: string) {
        return getCategoriasPorTipo(tipoComprobante);
    }

    private validateFile(file: Express.Multer.File): void {
        if (file.size > STORAGE_CONFIG.maxFileSize) {
            throw new BadRequestException(
                `El archivo excede el tamaño máximo de ${STORAGE_CONFIG.maxFileSize / 1024 / 1024}MB`,
            );
        }
        if (!STORAGE_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException(
                `Tipo de archivo no permitido. Solo se aceptan: ${STORAGE_CONFIG.allowedMimeTypes.join(', ')}`,
            );
        }
    }

    private generateUniqueFilename(cfdiUuid: string, originalName: string): string {
        const timestamp = Date.now();
        const ext = path.extname(originalName);
        const sanitizedName = this.sanitizeFilename(
            path.basename(originalName, ext),
        );
        return `${sanitizedName}_${timestamp}${ext}`;
    }

    private sanitizeFilename(filename: string): string {
        return filename
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .toLowerCase()
            .substring(0, 50);
    }
}
