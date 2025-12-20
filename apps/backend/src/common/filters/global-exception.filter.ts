/**
 * SISTEMA GLOBAL DE MANEJO DE ERRORES SAT-GRADE
 * ==============================================
 * Elimina errores 500 genéricos
 * Usuario NUNCA ve errores técnicos
 * TODO tiene try/catch
 * TODO se audita
 */

import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';

export interface UserFriendlyError {
    error: string;
    userMessage: string;
    whatFailed: string;
    why: string;
    whatToDo: string;
    technicalDetails?: any; // Solo en desarrollo
    timestamp: string;
    requestId: string;
}

/**
 * FILTRO GLOBAL DE EXCEPCIONES
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(private auditService: AuditService) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const requestId = this.generateRequestId();

        // Construir respuesta amigable
        const errorResponse = this.buildUserFriendlyError(exception, request, requestId);

        // Auditar el error
        this.auditError(exception, request, requestId);

        // Log técnico (solo para developers)
        this.logTechnicalError(exception, request, requestId);

        // Responder al usuario
        response
            .status(errorResponse.status || HttpStatus.INTERNAL_SERVER_ERROR)
            .json(errorResponse.body);
    }

    /**
     * Construye un error comprensible para el usuario
     */
    private buildUserFriendlyError(
        exception: unknown,
        request: Request,
        requestId: string
    ): { status: number; body: UserFriendlyError } {
        // Si es HttpException de NestJS, ya tiene estructura
        if (exception instanceof HttpException) {
            const response = exception.getResponse() as any;
            const status = exception.getStatus();

            // Si ya tiene formato user-friendly, usarlo
            if (response.error && response.userGuidance) {
                return {
                    status,
                    body: {
                        error: response.error,
                        userMessage: response.message || response.userGuidance,
                        whatFailed: this.translateProcess(request.path),
                        why: response.message,
                        whatToDo: response.userGuidance,
                        technicalDetails: process.env.NODE_ENV === 'development' ? response : undefined,
                        timestamp: new Date().toISOString(),
                        requestId,
                    },
                };
            }

            // Traducir errores comunes
            return this.translateCommonError(status, response.message, request, requestId);
        }

        // Error desconocido - traducir a lenguaje humano
        return this.handleUnknownError(exception, request, requestId);
    }

    /**
     * Traduce errores comunes HTTP a mensajes útiles
     */
    private translateCommonError(
        status: number,
        message: string,
        request: Request,
        requestId: string
    ): { status: number; body: UserFriendlyError } {
        const errorMap: Record<number, {
            whatFailed: string;
            why: string;
            whatToDo: string;
        }> = {
            400: {
                whatFailed: 'La solicitud no pudo procesarse',
                why: message || 'Los datos enviados no son válidos',
                whatToDo: 'Verifica que toda la información esté completa y en el formato correcto.',
            },
            401: {
                whatFailed: 'Acceso no autorizado',
                why: 'No has iniciado sesión o tu sesión expiró',
                whatToDo: 'Por favor, inicia sesión nuevamente.',
            },
            403: {
                whatFailed: 'Acceso prohibido',
                why: 'No tienes permiso para realizar esta acción',
                whatToDo: 'Contacta al administrador si necesitas este acceso.',
            },
            404: {
                whatFailed: 'Recurso no encontrado',
                why: 'El elemento solicitado no existe',
                whatToDo: 'Verifica que el elemento no haya sido eliminado o intenta refrescar la página.',
            },
            409: {
                whatFailed: 'Conflicto de datos',
                why: message || 'Ya existe un registro con esos datos',
                whatToDo: 'Verifica que no estés duplicando información o intenta con datos diferentes.',
            },
            413: {
                whatFailed: 'Archivo demasiado grande',
                why: 'El archivo excede el tamaño máximo permitido',
                whatToDo: 'Intenta con un archivo más pequeño (máximo 100MB).',
            },
            422: {
                whatFailed: 'Los datos no pudieron procesarse',
                why: message || 'Los datos tienen un formato incorrecto',
                whatToDo: 'Revisa que el archivo sea válido y esté completo.',
            },
            500: {
                whatFailed: 'Error interno del sistema',
                why: 'Ocurrió un problema inesperado en el servidor',
                whatToDo: `No te preocupes, nuestro equipo fue notificado. Intenta nuevamente en unos momentos. (ID: ${requestId})`,
            },
        };

        const template = errorMap[status] || errorMap[500];

        return {
            status,
            body: {
                error: `HTTP_${status}`,
                userMessage: template.why,
                whatFailed: template.whatFailed,
                why: template.why,
                whatToDo: template.whatToDo,
                timestamp: new Date().toISOString(),
                requestId,
            },
        };
    }

    /**
     * Maneja errores completamente desconocidos
     */
    private handleUnknownError(
        exception: unknown,
        request: Request,
        requestId: string
    ): { status: number; body: UserFriendlyError } {
        const error = exception as Error;

        return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            body: {
                error: 'UNKNOWN_ERROR',
                userMessage: 'Ocurrió un error inesperado',
                whatFailed: this.translateProcess(request.path),
                why: 'El sistema encontró un problema que no esperaba',
                whatToDo: `Intenta nuevamente. Si el problema persiste, contacta a soporte con este ID: ${requestId}`,
                technicalDetails: process.env.NODE_ENV === 'development'
                    ? { message: error.message, stack: error.stack }
                    : undefined,
                timestamp: new Date().toISOString(),
                requestId,
            },
        };
    }

    /**
     * Traduce rutas técnicas a procesos comprensibles
     */
    private translateProcess(path: string): string {
        const processMap: Record<string, string> = {
            '/api/cfdi/importar-xml': 'Importación de CFDI (XML)',
            '/api/bancos/upload': 'Importación de estado de cuenta bancario',
            '/api/evidencias/upload': 'Carga de evidencia',
            '/api/empresas': 'Gestión de empresas',
            '/api/auth/login': 'Inicio de sesión',
            '/api/dashboard': 'Carga del dashboard',
        };

        for (const [route, name] of Object.entries(processMap)) {
            if (path.includes(route)) {
                return name;
            }
        }

        return 'La operación solicitada';
    }

    /**
     * Audita el error
     */
    private async auditError(exception: unknown, request: Request, requestId: string) {
        const error = exception as Error;

        try {
            await this.auditService.log({
                accion: 'ACCESS',
                proceso: request.path,
                resultado: 'FAILED',
                errorMensaje: error.message,
                errorStack: error.stack,
                ipAddress: request.ip || request.socket.remoteAddress,
                userAgent: request.get('user-agent'),
                metodo: request.method,
                ruta: request.path,
                severidad: 'ERROR',
                payloadResumen: {
                    requestId,
                    query: request.query,
                    body: this.sanitizeBody(request.body),
                },
            });
        } catch (auditError) {
            // Si falla la auditoría, solo loggear
            console.error('[EXCEPTION FILTER] Failed to audit error:', auditError);
        }
    }

    /**
     * Log técnico para developers
     */
    private logTechnicalError(exception: unknown, request: Request, requestId: string) {
        const error = exception as Error;

        console.error({
            type: 'UNHANDLED_EXCEPTION',
            requestId,
            timestamp: new Date().toISOString(),
            path: request.path,
            method: request.method,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
            },
            request: {
                query: request.query,
                body: this.sanitizeBody(request.body),
                headers: this.sanitizeHeaders(request.headers),
            },
        });
    }

    /**
     * Genera ID único para cada request
     */
    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Sanitiza el body removiendo datos sensibles
     */
    private sanitizeBody(body: any): any {
        if (!body) return {};

        const sanitized = { ...body };

        // Remover campos sensibles
        const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
        for (const field of sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '***REDACTED***';
            }
        }

        return sanitized;
    }

    /**
     * Sanitiza headers removiendo tokens
     */
    private sanitizeHeaders(headers: any): any {
        const sanitized = { ...headers };

        if (sanitized.authorization) {
            sanitized.authorization = '***REDACTED***';
        }

        return sanitized;
    }
}


/**
 * DECORATOR PARA MANEJO AUTOMÁTICO DE ERRORES
 * Usar en servicios críticos
 */
export function HandleErrors(processName: string) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            try {
                return await originalMethod.apply(this, args);
            } catch (error) {
                console.error(`[${processName}] Error en ${propertyKey}:`, error);

                // Re-throw con contexto
                throw new HttpException(
                    {
                        error: 'PROCESS_FAILED',
                        message: error.message,
                        userGuidance: `Error en ${processName}. Por favor, intenta nuevamente.`,
                        process: processName,
                        method: propertyKey,
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
        };

        return descriptor;
    };
}
