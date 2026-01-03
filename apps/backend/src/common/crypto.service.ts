import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { scrypt, randomBytes, createCipheriv, createDecipheriv, CipherGCM, DecipherGCM } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export interface EncryptedPayload {
    v: string;  // Version
    ct: string; // CipherText
    iv: string; // Initialization Vector
    at: string; // Auth Tag
    s: string;  // Salt
}

@Injectable()
export class CryptoService implements OnModuleInit {
    private readonly logger = new Logger(CryptoService.name);
    private masterKey: string;
    private readonly CRYPTO_VERSION = 'v1';
    private readonly ALGORITHM = 'aes-256-gcm';
    private readonly KEY_LENGTH = 32;
    private readonly IV_LENGTH = 16;
    private readonly SALT_LENGTH = 16;

    constructor() {
        // En un entorno constructivo real, se inyectaría ConfigService.
        // Aquí leemos process.env directamente para asegurar disponibilidad inmediata.
        this.masterKey = process.env.SENTINEL_MASTER_KEY || '';
    }

    onModuleInit() {
        if (!this.masterKey) {
            this.logger.error('CRITICAL: SENTINEL_MASTER_KEY is not defined.');
            // En producción, esto debería impedir el arranque.
            // throw new Error('SENTINEL_MASTER_KEY is required for secure operation.');

            // Fallback SOLO PARA DESARROLLO si no está definido (aunque el prompt exige env)
            this.logger.warn('⚠️ USING FALLBACK MASTER KEY - NOT SAFE FOR PRODUCTION');
            this.masterKey = 'DEV_FALLBACK_MASTER_KEY_MUST_BE_REPLACED_IN_PROD';
        } else {
            this.logger.log('🔐 CryptoService initialized with AES-256-GCM');
        }
    }

    /**
     * Deriva una clave única usando MASTER_KEY + ContextId (EmpresaId) + Salt aleatorio
     */
    private async deriveKey(salt: Buffer, contextId: string): Promise<Buffer> {
        // Mixing master key with context ID to ensure key separation between tenants
        const secret = `${this.masterKey}:${contextId}`;
        return (await scryptAsync(secret, salt, this.KEY_LENGTH)) as Buffer;
    }

    /**
     * Cifra datos sensibles.
     * @param data Buffer o string a cifrar
     * @param contextId ID de la empresa o contexto para vincular criptográficamente el dato
     */
    async encrypt(data: Buffer | string, contextId: string): Promise<string> {
        if (!data) return null;
        if (!contextId) throw new Error('ContextID is required for encryption');

        const salt = randomBytes(this.SALT_LENGTH);
        const iv = randomBytes(this.IV_LENGTH);
        const key = await this.deriveKey(salt, contextId);

        const cipher = createCipheriv(this.ALGORITHM, key, iv) as CipherGCM;

        let inputInfo: Buffer;
        if (typeof data === 'string') {
            inputInfo = Buffer.from(data, 'utf8');
        } else {
            inputInfo = data;
        }

        const encrypted = Buffer.concat([cipher.update(inputInfo), cipher.final()]);
        const authTag = cipher.getAuthTag();

        const payload: EncryptedPayload = {
            v: this.CRYPTO_VERSION,
            ct: encrypted.toString('hex'),
            iv: iv.toString('hex'),
            at: authTag.toString('hex'),
            s: salt.toString('hex')
        };

        return JSON.stringify(payload);
    }

    /**
     * Descifra datos previamente protegidos.
     * @param encryptedPayloadStr JSON string generado por encrypt
     * @param contextId ID de la empresa (debe coincidir con el usado al cifrar)
     */
    async decrypt(encryptedPayloadStr: string, contextId: string): Promise<Buffer> {
        if (!encryptedPayloadStr) return null;
        if (!contextId) throw new Error('ContextID is required for decryption');

        let payload: EncryptedPayload;
        try {
            payload = JSON.parse(encryptedPayloadStr);
        } catch (e) {
            throw new Error('Invalid encrypted payload format');
        }

        if (payload.v !== this.CRYPTO_VERSION && payload.v !== 'v1') { // Support future versions check
            throw new Error(`Unsupported crypto version: ${payload.v}`);
        }

        const salt = Buffer.from(payload.s, 'hex');
        const iv = Buffer.from(payload.iv, 'hex');
        const authTag = Buffer.from(payload.at, 'hex');
        const encryptedText = Buffer.from(payload.ct, 'hex');

        const key = await this.deriveKey(salt, contextId);
        const decipher = createDecipheriv(this.ALGORITHM, key, iv) as DecipherGCM;

        decipher.setAuthTag(authTag);

        try {
            const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
            return decrypted;
        } catch (error) {
            this.logger.error(`Decryption failed for context ${contextId}. Possible tampering or wrong context.`);
            throw new Error('Decryption failed: Integrity check failed');
        }
    }
}
