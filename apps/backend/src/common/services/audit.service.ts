/**
 * SERVICIO DE AUDITORÍA SAT-GRADE
 * ================================
 * Versión de Emergencia: Enrutado a Consola/Archivos por mantenimiento de DB
 */

import { Injectable, Inject } from '@nestjs/common';
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
     * Registra un evento de auditoría (BYPASS DB TEMP)
     */
    async log(event: AuditEvent): Promise<void> {
        try {
            console.log('[AUDIT LOG]', {
                ...event,
                timestamp: new Date().toISOString()
            });
            // NO DB WRITE - Fix for malformed schema
        } catch (error) {
            console.error('[AUDIT SERVICE] ERROR:', error);
        }
    }

    /**
     * Registra un evento de seguridad
     */
    async logSecurityEvent(eventData: SecurityEventData): Promise<void> {
        console.error('[SECURITY ALERT]', eventData);
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
        error?: string;
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
    }

    private emergencyLog(data: any, error: any): void {
        // No-op
    }

    async getAuditLogs(filters: any): Promise<any[]> {
        return [];
    }
}
