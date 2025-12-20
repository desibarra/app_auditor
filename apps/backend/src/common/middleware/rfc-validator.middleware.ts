/**
 * RFC-FIRST ZERO-TRUST MIDDLEWARE
 * ================================
 * Arquitectura: Validación obligatoria de identidad antes de persistencia
 * Nivel: SAT-Grade Security
 * 
 * REGLAS INQUEBRANTABLES:
 * 1. Todo archivo (XML, PDF, Excel, ZIP) DEBE validarse antes de guardar
 * 2. El RFC del documento determina la empresa, NO el usuario
 * 3. Si RFC no existe → RECHAZAR
 * 4. Si RFC pertenece a otra empresa → REUBICAR + AUDITAR
 * 5. CERO tolerancia a mezcla de datos entre empresas
 */

import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Inject } from '@nestjs/common';

export interface RfcValidationResult {
    isValid: boolean;
    detectedRfc: string;
    detectedEmpresaId: string | null;
    requestedEmpresaId: string | null;
    action: 'ALLOW' | 'REJECT' | 'RELOCATE';
    reason: string;
    timestamp: Date;
}

export interface AuditLog {
    timestamp: Date;
    userId: string | null;
    empresaIdRequested: string | null;
    empresaIdDetected: string | null;
    rfcDetected: string;
    action: 'ALLOW' | 'REJECT' | 'RELOCATE';
    process: string;
    ipAddress: string;
    userAgent: string;
    payload: any;
}

@Injectable()
export class RfcValidatorMiddleware implements NestMiddleware {
    constructor(
        @Inject('DRIZZLE_CLIENT') private db: any,
    ) { }

    /**
     * Valida que el RFC del documento coincida con una empresa registrada
     * y que no haya conflicto con la empresa solicitada
     */
    async use(req: Request, res: Response, next: NextFunction) {
        // Solo aplicar a rutas de importación/carga
        if (!this.shouldValidate(req.path)) {
            return next();
        }

        try {
            const validation = await this.validateRfcIntegrity(req);

            // Auditar SIEMPRE
            await this.auditAccess(req, validation);

            // Aplicar política Zero-Trust
            switch (validation.action) {
                case 'ALLOW':
                    // Inyectar empresaId validado en request
                    (req as any).validatedEmpresaId = validation.detectedEmpresaId;
                    next();
                    break;

                case 'RELOCATE':
                    // Auto-corrección: reubicar a empresa correcta
                    (req as any).validatedEmpresaId = validation.detectedEmpresaId;
                    console.warn(`[RFC-VALIDATOR] Auto-relocación: ${validation.reason}`);
                    next();
                    break;

                case 'REJECT':
                    throw new BadRequestException({
                        error: 'RFC_VALIDATION_FAILED',
                        message: validation.reason,
                        detectedRfc: validation.detectedRfc,
                        action: 'REGISTRO_EMPRESA_REQUERIDO',
                        userGuidance: `El RFC ${validation.detectedRfc} no está registrado. Por favor, registra la empresa primero en Configuración > Empresas.`,
                    });
            }
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            // Error inesperado - rechazar por seguridad
            await this.auditError(req, error);
            throw new BadRequestException({
                error: 'RFC_VALIDATION_ERROR',
                message: 'Error al validar la integridad de datos',
                userGuidance: 'No se pudo procesar el archivo. Contacta al administrador.',
            });
        }
    }

    /**
     * Determina si la ruta requiere validación RFC
     */
    private shouldValidate(path: string): boolean {
        const validationPaths = [
            '/api/cfdi/importar-xml',
            '/api/bancos/upload',
            '/api/evidencias/upload',
            '/api/cfdi/importar-zip',
        ];

        return validationPaths.some(vp => path.includes(vp));
    }

    /**
     * CORE: Validación de integridad RFC
     */
    private async validateRfcIntegrity(req: Request): Promise<RfcValidationResult> {
        const file = (req as any).file;
        const empresaIdRequested = req.query.empresaId as string || req.body?.empresaId;

        if (!file) {
            return {
                isValid: false,
                detectedRfc: 'UNKNOWN',
                detectedEmpresaId: null,
                requestedEmpresaId: empresaIdRequested,
                action: 'REJECT',
                reason: 'No se proporcionó archivo',
                timestamp: new Date(),
            };
        }

        // Extraer RFC del contenido del archivo
        const rfcDetected = await this.extractRfcFromFile(file);

        if (!rfcDetected) {
            return {
                isValid: false,
                detectedRfc: 'NOT_FOUND',
                detectedEmpresaId: null,
                requestedEmpresaId: empresaIdRequested,
                action: 'REJECT',
                reason: 'No se pudo detectar RFC en el archivo',
                timestamp: new Date(),
            };
        }

        // Buscar empresa por RFC
        const empresaDetected = await this.findEmpresaByRfc(rfcDetected);

        if (!empresaDetected) {
            return {
                isValid: false,
                detectedRfc: rfcDetected,
                detectedEmpresaId: null,
                requestedEmpresaId: empresaIdRequested,
                action: 'REJECT',
                reason: `RFC ${rfcDetected} no está registrado en el sistema`,
                timestamp: new Date(),
            };
        }

        // Verificar consistencia
        if (empresaIdRequested && empresaIdRequested !== empresaDetected.id) {
            // CONFLICTO: Usuario en empresa A, archivo de empresa B
            return {
                isValid: true, // Técnicamente válido
                detectedRfc: rfcDetected,
                detectedEmpresaId: empresaDetected.id,
                requestedEmpresaId: empresaIdRequested,
                action: 'RELOCATE',
                reason: `Auto-corrección: RFC ${rfcDetected} pertenece a ${empresaDetected.razonSocial}, no a la empresa solicitada`,
                timestamp: new Date(),
            };
        }

        // Todo correcto
        return {
            isValid: true,
            detectedRfc: rfcDetected,
            detectedEmpresaId: empresaDetected.id,
            requestedEmpresaId: empresaIdRequested,
            action: 'ALLOW',
            reason: 'Validación exitosa',
            timestamp: new Date(),
        };
    }

    /**
     * Extrae RFC del archivo según tipo
     */
    private async extractRfcFromFile(file: Express.Multer.File): Promise<string | null> {
        const extension = file.originalname.toLowerCase().split('.').pop();

        try {
            switch (extension) {
                case 'xml':
                    return this.extractRfcFromXml(file.buffer);

                case 'pdf':
                    return this.extractRfcFromPdf(file.buffer);

                case 'xlsx':
                case 'xls':
                    return this.extractRfcFromExcel(file.buffer);

                default:
                    return null;
            }
        } catch (error) {
            console.error('[RFC-VALIDATOR] Error extrayendo RFC:', error);
            return null;
        }
    }

    /**
     * Extrae RFC receptor de XML (CFDI)
     */
    private extractRfcFromXml(buffer: Buffer): string | null {
        try {
            const xmlContent = buffer.toString('utf-8');

            // Buscar RFC receptor (prioridad)
            const receptorMatch = xmlContent.match(/Rfc="([A-ZÑ&]{12,13})"/i);
            if (receptorMatch && receptorMatch[1]) {
                // Verificar que sea receptor, no emisor
                const receptorSection = xmlContent.indexOf('cfdi:Receptor');
                const matchPosition = xmlContent.indexOf(receptorMatch[0]);

                if (matchPosition > receptorSection && receptorSection !== -1) {
                    return receptorMatch[1].toUpperCase();
                }
            }

            // Fallback: cualquier RFC de 12-13 caracteres
            const anyRfcMatch = xmlContent.match(/Rfc="([A-ZÑ&]{12,13})"/i);
            return anyRfcMatch ? anyRfcMatch[1].toUpperCase() : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Extrae RFC de PDF (estado de cuenta bancario)
     */
    private extractRfcFromPdf(buffer: Buffer): string | null {
        // TODO: Implementar extracción de RFC de PDF
        // Por ahora retornar null para que use fallback
        return null;
    }

    /**
     * Extrae RFC de Excel
     */
    private extractRfcFromExcel(buffer: Buffer): string | null {
        // TODO: Implementar extracción de RFC de Excel
        return null;
    }

    /**
     * Busca empresa por RFC en la base de datos
     */
    private async findEmpresaByRfc(rfc: string): Promise<any | null> {
        try {
            const { empresas } = await import('../../database/schema');
            const { eq } = await import('drizzle-orm');

            const result = await this.db
                .select()
                .from(empresas)
                .where(eq(empresas.rfc, rfc.toUpperCase()))
                .limit(1);

            return result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error('[RFC-VALIDATOR] Error buscando empresa:', error);
            return null;
        }
    }

    /**
     * AUDITORÍA: Registra todos los accesos para trazabilidad SAT
     */
    private async auditAccess(req: Request, validation: RfcValidationResult): Promise<void> {
        const auditLog: AuditLog = {
            timestamp: new Date(),
            userId: (req as any).user?.id || null,
            empresaIdRequested: validation.requestedEmpresaId,
            empresaIdDetected: validation.detectedEmpresaId,
            rfcDetected: validation.detectedRfc,
            action: validation.action,
            process: req.path,
            ipAddress: req.ip || req.socket.remoteAddress || 'UNKNOWN',
            userAgent: req.get('user-agent') || 'UNKNOWN',
            payload: {
                fileName: (req as any).file?.originalname,
                fileSize: (req as any).file?.size,
                reason: validation.reason,
            },
        };

        // TODO: Guardar en tabla audit_logs cuando esté creada
        console.log('[AUDIT]', JSON.stringify(auditLog));
    }

    /**
     * Audita errores de validación
     */
    private async auditError(req: Request, error: any): Promise<void> {
        console.error('[RFC-VALIDATOR] ERROR:', {
            timestamp: new Date(),
            path: req.path,
            error: error.message,
            stack: error.stack,
        });
    }
}
