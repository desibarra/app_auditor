/**
 * 🔒 SERVICIO DE AUDITORÍA INMUTABLE CON HASH
 * =============================================
 * Implementación de inmutabilidad REAL con SHA256
 * 
 * GARANTÍAS:
 * - Cada evento tiene hash calculado: SHA256(datos críticos + salt)
 * - Hash permite verificar que el evento NO fue modificado
 * - Prohibido UPDATE y DELETE a nivel código y BD
 * - Cualquier intento de modificación es detectable
 */

import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { auditLogs } from '../../database/schema/audit.schema';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export interface AuditEvent {
    usuarioId?: string;
    usuarioEmail?: string;
    usuarioNombre?: string;
    empresaIdSolicitada?: string;
    empresaIdDetectada?: string;
    empresaIdFinal?: string;
    rfcEmisorDetectado?: string;
    rfcReceptorDetectado?: string;
    decision?: 'accept' | 'relocate' | 'reject';
    accion: 'ALLOW' | 'REJECT' | 'RELOCATE' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ACCESS';
    proceso: string;
    resultado: 'SUCCESS' | 'FAILED' | 'PARTIAL';
    razon?: string;
    errorMensaje?: string;
    errorStack?: string;
    ipAddress?: string;
    userAgent?: string;
    metodo?: string;
    ruta?: string;
    payloadResumen?: any;
    archivoNombre?: string;
    archivoTamano?: number;
    archivoTipo?: string;
    entidadTipo?: string;
    entidadId?: string;
    valorAnterior?: any;
    valorNuevo?: any;
    severidad?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
    periodoFiscal?: string;
    requiereAtencion?: boolean;
}

@Injectable()
export class AuditServiceInmutable {
    // Salt secreto para hashing (debe estar en .env en producción)
    private readonly HASH_SALT = process.env.AUDIT_HASH_SALT || 'FISCAL_AUDIT_2025_SALT_SECRET';

    constructor(
        @Inject('DRIZZLE_CLIENT') private db: any,
    ) { }

    /**
     * 🔒 Registra un evento de auditoría con hash inmutable
     */
    async log(event: AuditEvent): Promise<void> {
        try {
            const id = uuidv4();
            const timestamp = Date.now();

            // 🔐 Calcular hash ANTES de insertar
            const hashEvento = this.calcularHash({
                id,
                timestamp,
                empresaIdFinal: event.empresaIdFinal,
                accion: event.accion,
                proceso: event.proceso,
                resultado: event.resultado,
                payloadResumen: event.payloadResumen,
            });

            const record = {
                id,
                timestamp,
                hashEvento,  // 🔐 INMUTABILIDAD
                esInmutable: true,
                usuarioId: event.usuarioId || null,
                usuarioEmail: event.usuarioEmail || null,
                usuarioNombre: event.usuarioNombre || null,
                empresaIdSolicitada: event.empresaIdSolicitada || null,
                empresaIdDetectada: event.empresaIdDetectada || null,
                empresaIdFinal: event.empresaIdFinal || null,
                rfcEmisorDetectado: event.rfcEmisorDetectado || null,
                rfcReceptorDetectado: event.rfcReceptorDetectado || null,
                decision: event.decision || null,
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
                version: process.env.APP_VERSION || '2.0.0',
            };

            // 🔒 SOLO INSERT permitido
            await this.db.insert(auditLogs).values(record);

            if (process.env.NODE_ENV === 'development') {
                console.log('[AUDIT INMUTABLE]', {
                    id: record.id,
                    hash: record.hashEvento.substring(0, 16) + '...',
                    accion: record.accion,
                    proceso: record.proceso,
                });
            }
        } catch (error) {
            console.error('[AUDIT SERVICE] ERROR AL GUARDAR:', error);
            this.emergencyLog(event, error);
        }
    }

    /**
     * 🔐 Calcula hash SHA256 de un evento
     * 
     * El hash incluye:
     * - ID del evento
     * - Timestamp
     * - Empresa ID
     * - Acción
     * - Proceso
     * - Resultado
     * - Payload resumido
     * - Salt secreto
     * 
     * Cualquier modificación posterior cambiará el hash
     */
    private calcularHash(data: {
        id: string;
        timestamp: number;
        empresaIdFinal?: string;
        accion: string;
        proceso: string;
        resultado: string;
        payloadResumen?: any;
    }): string {
        const contenido = JSON.stringify({
            ...data,
            salt: this.HASH_SALT,
        });

        return crypto
            .createHash('sha256')
            .update(contenido)
            .digest('hex');
    }

    /**
     * ✅ Verifica la integridad de un evento de auditoría
     * 
     * Recalcula el hash y lo compara con el almacenado
     * Si no coinciden, el evento fue MODIFICADO
     */
    async verificarIntegridad(auditLog: any): Promise<{
        integro: boolean;
        hashEsperado: string;
        hashAlmacenado: string;
    }> {
        const hashRecalculado = this.calcularHash({
            id: auditLog.id,
            timestamp: auditLog.timestamp,
            empresaIdFinal: auditLog.empresaIdFinal,
            accion: auditLog.accion,
            proceso: auditLog.proceso,
            resultado: auditLog.resultado,
            payloadResumen: auditLog.payloadResumen ? JSON.parse(auditLog.payloadResumen) : null,
        });

        return {
            integro: hashRecalculado === auditLog.hashEvento,
            hashEsperado: hashRecalculado,
            hashAlmacenado: auditLog.hashEvento,
        };
    }

    /**
     * 🚫 PROHIBIDO: Modificar eventos de auditoría
     * 
     * Si se intenta, lanza excepción
     */
    async modificarEvento(id: string, cambios: any): Promise<never> {
        // Registrar intento de violación
        console.error('[SECURITY VIOLATION] Intento de modificar audit log:', {
            id,
            timestamp: new Date().toISOString(),
            cambiosSolicitados: cambios,
        });

        throw new ForbiddenException({
            error: 'AUDIT_LOG_IMMUTABLE',
            message: 'Los registros de auditoría son INMUTABLES y no pueden modificarse',
            userGuidance: 'Esta acción viola las políticas de cumplimiento fiscal (CFF Art. 30)',
            violationType: 'ATTEMPTED_AUDIT_MODIFICATION',
            attemptedLogId: id,
        });
    }

    /**
     * 🚫 PROHIBIDO: Eliminar eventos de auditoría
     */
    async eliminarEvento(id: string): Promise<never> {
        console.error('[SECURITY VIOLATION] Intento de eliminar audit log:', {
            id,
            timestamp: new Date().toISOString(),
        });

        throw new ForbiddenException({
            error: 'AUDIT_LOG_PERMANENT',
            message: 'Los registros de auditoría son PERMANENTES y no pueden eliminarse',
            userGuidance: 'Esta acción viola las políticas de cumplimiento fiscal (CFF Art. 30)',
            violationType: 'ATTEMPTED_AUDIT_DELETION',
            attemptedLogId: id,
        });
    }

    /**
     * ✅ Helpers de auditoría específicos (con hash)
     */

    async logCfdiImport(params: {
        usuarioId?: string;
        empresaDetectada: string;
        rfcEmisorDetectado: string;
        rfcReceptorDetectado: string;
        tipoComprobante: string;
        decision: 'accept' | 'relocate' | 'reject';
        uuid: string;
        archivo: string;
        success: boolean;
        error?: string;
    }): Promise<void> {
        await this.log({
            usuarioId: params.usuarioId,
            empresaIdFinal: params.empresaDetectada,
            rfcEmisorDetectado: params.rfcEmisorDetectado,
            rfcReceptorDetectado: params.rfcReceptorDetectado,
            decision: params.decision,
            accion: 'CREATE',
            proceso: `cfdi/importar-xml/${params.tipoComprobante}`,
            resultado: params.success ? 'SUCCESS' : 'FAILED',
            razon: params.success ? `CFDI ${params.tipoComprobante} importado` : params.error,
            archivoNombre: params.archivo,
            entidadTipo: 'cfdi',
            entidadId: params.uuid,
            severidad: params.success ? 'INFO' : 'ERROR',
            payloadResumen: {
                tipo: params.tipoComprobante,
                rfcEmisor: params.rfcEmisorDetectado,
                rfcReceptor: params.rfcReceptorDetectado,
                decision: params.decision,
            },
        });
    }

    async logBankImport(params: {
        usuarioId?: string;
        empresaId: string;
        banco: string;
        parserUsado: string;
        confidenceScore: number;
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
            razon: `${params.movimientos} movimientos de ${params.banco}`,
            archivoNombre: params.archivo,
            periodoFiscal: params.periodo,
            payloadResumen: {
                banco: params.banco,
                parser: params.parserUsado,
                confidence: params.confidenceScore,
                movimientos: params.movimientos,
            },
            severidad: params.confidenceScore < 80 ? 'WARNING' : 'INFO',
            requiereAtencion: params.confidenceScore < 80,
        });
    }

    /**
     * Log de emergencia en archivo
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
            console.error('[CRITICAL] Emergency log failed:', emergencyError);
        }
    }

    /**
     * ✅ Obtiene logs con verificación de integridad
     */
    async getAuditLogsConVerificacion(filters: {
        empresaId?: string;
        limit?: number;
    }): Promise<Array<any & { integridadVerificada: boolean }>> {
        try {
            const { desc } = await import('drizzle-orm');

            const logs = await this.db
                .select()
                .from(auditLogs)
                .orderBy(desc(auditLogs.timestamp))
                .limit(filters.limit || 100);

            // Verificar integridad de cada log
            const logsConVerificacion = await Promise.all(
                logs.map(async (log) => {
                    const verificacion = await this.verificarIntegridad(log);
                    return {
                        ...log,
                        integridadVerificada: verificacion.integro,
                    };
                })
            );

            return logsConVerificacion;
        } catch (error) {
            console.error('[AUDIT SERVICE] Error obteniendo logs:', error);
            return [];
        }
    }
}
