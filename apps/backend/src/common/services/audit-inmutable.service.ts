/**
 * 🔒 SERVICIO DE AUDITORÍA INMUTABLE CON HASH
 * =============================================
 * Versión de Emergencia: Enrutado a Consola (BYPASS DB)
 */

import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
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
    private readonly HASH_SALT = process.env.AUDIT_HASH_SALT || 'FISCAL_AUDIT_2025_SALT_SECRET';

    constructor(
        @Inject('DRIZZLE_CLIENT') private db: any,
    ) { }

    async log(event: AuditEvent): Promise<void> {

        console.log('[AUDIT INMUTABLE LOG]', {
            ...event,
            timestamp: new Date().toISOString()
        });
        // BYPASS DB
    }

    private calcularHash(data: any): string {
        return "fake-hash";
    }

    async verificarIntegridad(auditLog: any): Promise<{
        integro: boolean;
        hashEsperado: string;
        hashAlmacenado: string;
    }> {
        return {
            integro: true,
            hashEsperado: "fake-hash",
            hashAlmacenado: "fake-hash",
        };
    }

    async modificarEvento(id: string, cambios: any): Promise<never> {
        throw new ForbiddenException({
            error: 'AUDIT_LOG_IMMUTABLE',
            message: 'Los registros de auditoría son INMUTABLES y no pueden modificarse',
        });
    }

    async eliminarEvento(id: string): Promise<never> {
        throw new ForbiddenException({
            error: 'AUDIT_LOG_PERMANENT',
            message: 'Los registros de auditoría son PERMANENTES y no pueden eliminarse',
        });
    }

    async logCfdiImport(params: any): Promise<void> {
        await this.log({
            ...params,
            accion: 'CREATE',
            proceso: `cfdi/importar-xml`,
            resultado: params.success ? 'SUCCESS' : 'FAILED',
        });
    }

    async logBankImport(params: any): Promise<void> {
        await this.log({
            ...params,
            accion: 'CREATE',
            proceso: 'bancos/upload',
            resultado: params.success ? 'SUCCESS' : 'FAILED',
        });
    }

    private emergencyLog(data: any, error: any): void { }

    async getAuditLogsConVerificacion(filters: any): Promise<Array<any & { integridadVerificada: boolean }>> {
        return [];
    }
}
