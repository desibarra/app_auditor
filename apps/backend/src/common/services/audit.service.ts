/**
 * SERVICIO DE AUDITORÍA SAT-GRADE
 * ================================
 * Centraliza TODA la auditoría del sistema
 * Garantiza trazabilidad inquebrantable para defensa fiscal
 */

import { Injectable, Inject } from '@nestjs/common';
import { auditLogs, securityEvents } from '../../database/schema/audit.schema';
import { v4 as uuidv4 } from 'uuid';

export interface AuditEvent {
    // Usuario
    usuarioId?: string;
    usuarioEmail?: string;
    usuarioNombre?: string;

    // Empresa
    empresaIdSolicitada?: string;
    empresaIdDetectada?: string;
    empresaIdFinal?: string;

    // RFC
    rfcDetectado?: string;
    rfcEsperado?: string;

    // Acción
    accion: 'ALLOW' | 'REJECT' | 'RELOCATE' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ACCESS';
    proceso: string;
    resultado: 'SUCCESS' | 'FAILED' | 'PARTIAL';

    // Detalles
    razon?: string;
    errorMensaje?: string;
    errorStack?: string;

    // Técnico
    ipAddress?: string;
    userAgent?: string;
    metodo?: string;
    ruta?: string;

    // Payload
    payloadResumen?: any;
    archivoNombre?: string;
    archivoTamano?: number;
    archivoTipo?: string;

    // Cambios
    entidadTipo?: string;
    entidadId?: string;
    valorAnterior?: any;
    valorNuevo?: any;

    // Severidad
    severidad?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    periodoFiscal?: string;
    requiereAtencion?: boolean;
}

export interface SecurityEventData {
    eventoTipo: 'CROSS_EMPRESA_ATTEMPT' | 'INVALID_RFC' | 'UNAUTHORIZED_ACCESS' | 'SUSPICIOUS_ACTIVITY';
    usuarioId?: string;
    ipAddress: string;
    descripcion: string;
    payload?: any;
    nivelAmenaza: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

@Injectable()
export class AuditService {
    constructor(
        @Inject('DRIZZLE_CLIENT') private db: any,
    ) { }

    /**
     * Registra un evento de auditoría
     */
    async log(event: AuditEvent): Promise<void> {
        try {
            const record = {
                id: uuidv4(),
                timestamp: Date.now(),
                usuarioId: event.usuarioId || null,
                usuarioEmail: event.usuarioEmail || null,
                usuarioNombre: event.usuarioNombre || null,
                empresaIdSolicitada: event.empresaIdSolicitada || null,
                empresaIdDetectada: event.empresaIdDetectada || null,
                empresaIdFinal: event.empresaIdFinal || null,
                rfcDetectado: event.rfcDetectado || null,
                rfcEsperado: event.rfcEsperado || null,
                accion: event.accion,
                proceso: event.proceso,
                resultado: event.resultado,
                razon: event.razon || null,
                errorMensaje: event.errorMensaje || null,
                errorStack: event.errorStack || null,
                ipAddress: event.ipAddress || null,
                userAgent: event.userAgent || null,
                metodo: event.metodo || null,
                ruta: event.ruta || null,
                payloadResumen: event.payloadResumen ? JSON.stringify(event.payloadResumen) : null,
                archivoNombre: event.archivoNombre || null,
                archivoTamano: event.archivoTamano || null,
                archivoTipo: event.archivoTipo || null,
                entidadTipo: event.entidadTipo || null,
                entidadId: event.entidadId || null,
                valorAnterior: event.valorAnterior ? JSON.stringify(event.valorAnterior) : null,
                valorNuevo: event.valorNuevo ? JSON.stringify(event.valorNuevo) : null,
                severidad: event.severidad || 'INFO',
                periodoFiscal: event.periodoFiscal || null,
                requiereAtencion: event.requiereAtencion || false,
                revisado: false,
                agente: event.usuarioId ? 'USER' : 'SYSTEM',
                version: process.env.APP_VERSION || '1.0.0',
            };

            await this.db.insert(auditLogs).values(record);

            // Log a consola para debugging en desarrollo
            if (process.env.NODE_ENV === 'development') {
                console.log('[AUDIT]', {
                    accion: record.accion,
                    proceso: record.proceso,
                    resultado: record.resultado,
                    severidad: record.severidad,
                });
            }
        } catch (error) {
            // CRÍTICO: Si falla la auditoría, no debe fallar la operación
            // pero SÍ debe loggearse el error
            console.error('[AUDIT SERVICE] ERROR AL GUARDAR AUDITORÍA:', error);

            // Intentar log de emergencia en archivo
            this.emergencyLog(event, error);
        }
    }

    /**
     * Registra un evento de seguridad
     */
    async logSecurityEvent(eventData: SecurityEventData): Promise<void> {
        try {
            const record = {
                id: uuidv4(),
                timestamp: Date.now(),
                eventoTipo: eventData.eventoTipo,
                usuarioId: eventData.usuarioId || null,
                ipAddress: eventData.ipAddress,
                descripcion: eventData.descripcion,
                payload: eventData.payload ? JSON.stringify(eventData.payload) : null,
                nivelAmenaza: eventData.nivelAmenaza,
                bloqueado: false,
                investigado: false,
            };

            await this.db.insert(securityEvents).values(record);

            // Alertar en consola si es amenaza alta o crítica
            if (eventData.nivelAmenaza === 'HIGH' || eventData.nivelAmenaza === 'CRITICAL') {
                console.error('[SECURITY ALERT]', {
                    tipo: eventData.eventoTipo,
                    amenaza: eventData.nivelAmenaza,
                    descripcion: eventData.descripcion,
                    ip: eventData.ipAddress,
                });
            }
        } catch (error) {
            console.error('[AUDIT SERVICE] ERROR AL GUARDAR EVENTO DE SEGURIDAD:', error);
            this.emergencyLog(eventData, error);
        }
    }

    /**
     * Helpers de auditoría específicos
     */

    async logCfdiImport(params: {
        usuarioId?: string;
        empresaDetectada: string;
        rfcDetectado: string;
        uuid: string;
        archivo: string;
        success: boolean;
        error?: string;
    }): Promise<void> {
        await this.log({
            usuarioId: params.usuarioId,
            empresaIdFinal: params.empresaDetectada,
            rfcDetectado: params.rfcDetectado,
            accion: 'CREATE',
            proceso: 'cfdi/importar-xml',
            resultado: params.success ? 'SUCCESS' : 'FAILED',
            razon: params.success ? 'CFDI importado exitosamente' : params.error,
            archivoNombre: params.archivo,
            entidadTipo: 'cfdi',
            entidadId: params.uuid,
            severidad: params.success ? 'INFO' : 'ERROR',
        });
    }

    async logBankImport(params: {
        usuarioId?: string;
        empresaId: string;
        banco: string;
        periodo: string;
        movimientos: number;
        archivo: string;
        success: boolean;
    }): Promise<void> {
        await this.log({
            usuarioId: params.usuarioId,
            empresaIdFinal: params.empresaId,
            accion: 'CREATE',
            proceso: 'bancos/upload',
            resultado: params.success ? 'SUCCESS' : 'FAILED',
            razon: `${params.movimientos} movimientos procesados`,
            archivoNombre: params.archivo,
            periodoFiscal: params.periodo,
            payloadResumen: {
                banco: params.banco,
                movimientos: params.movimientos,
            },
            severidad: 'INFO',
        });
    }

    async logCrossEmpresaAttempt(params: {
        usuarioId?: string;
        empresaSolicitada: string;
        empresaDetectada: string;
        rfcDetectado: string;
        archivo: string;
        ipAddress: string;
    }): Promise<void> {
        // Auditoría normal
        await this.log({
            usuarioId: params.usuarioId,
            empresaIdSolicitada: params.empresaSolicitada,
            empresaIdDetectada: params.empresaDetectada,
            rfcDetectado: params.rfcDetectado,
            accion: 'RELOCATE',
            proceso: 'rfc-validation',
            resultado: 'SUCCESS',
            razon: 'Auto-corrección aplicada',
            archivoNombre: params.archivo,
            severidad: 'WARNING',
            requiereAtencion: true,
        });

        // Evento de seguridad
        await this.logSecurityEvent({
            eventoTipo: 'CROSS_EMPRESA_ATTEMPT',
            usuarioId: params.usuarioId,
            ipAddress: params.ipAddress,
            descripcion: `Intento de cargar ${params.archivo} de empresa ${params.empresaDetectada} estando en ${params.empresaSolicitada}`,
            payload: {
                empresaSolicitada: params.empresaSolicitada,
                empresaDetectada: params.empresaDetectada,
                rfcDetectado: params.rfcDetectado,
            },
            nivelAmenaza: 'MEDIUM',
        });
    }

    /**
     * Log de emergencia en archivo (fallback si DB falla)
     */
    private emergencyLog(data: any, error: any): void {
        const fs = require('fs');
        const path = require('path');
        const logDir = path.join(process.cwd(), 'logs', 'audit-emergency');
        const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}.log`);

        try {
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            const logEntry = {
                timestamp: new Date().toISOString(),
                type: 'EMERGENCY_LOG',
                originalData: data,
                error: {
                    message: error.message,
                    stack: error.stack,
                },
            };

            fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
        } catch (emergencyError) {
            // Si hasta el log de emergencia falla, solo queda consola
            console.error('[CRITICAL] Emergency log failed:', emergencyError);
        }
    }

    /**
     * Obtiene logs de auditoría con filtros
     */
    async getAuditLogs(filters: {
        empresaId?: string;
        usuarioId?: string;
        accion?: string;
        fechaInicio?: Date;
        fechaFin?: Date;
        severidad?: string;
        limit?: number;
    }): Promise<any[]> {
        try {
            const { desc } = await import('drizzle-orm');

            let query = this.db
                .select()
                .from(auditLogs)
                .orderBy(desc(auditLogs.timestamp))
                .limit(filters.limit || 100);

            // TODO: Aplicar filtros cuando Drizzle los soporte mejor
            const results = await query;
            return results;
        } catch (error) {
            console.error('[AUDIT SERVICE] Error obteniendo logs:', error);
            return [];
        }
    }
}
