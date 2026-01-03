import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import Database from 'better-sqlite3';
import path from 'path';
import * as fs from 'fs';
import { CryptoService } from '../../common/crypto.service';

export interface CrearEmpresaDto {
    rfc: string;
    razonSocial: string;
    regimenFiscal?: string;
    sector?: string;
    configuracion?: any;
    satAuthMode?: 'NONE' | 'RFC_ONLY' | 'CIEC' | 'FIEL';
}

@Injectable()
export class EmpresasService {
    private readonly logger = new Logger(EmpresasService.name);
    private readonly db: Database.Database;

    constructor(
        private readonly cryptoService: CryptoService
    ) {
        // Conexión dinámica a SQLite (Fallback a dev_clean.db)
        const dbPath = process.env.DATABASE_PATH
            ? path.join(process.cwd(), process.env.DATABASE_PATH)
            : path.join(process.cwd(), 'data/dev_clean.db');

        console.log('[EmpresasService] CWD:', process.cwd());
        console.log('[EmpresasService] __dirname:', __dirname);
        console.log(`[EmpresasService] Intentando conectar a: ${dbPath}`);

        this.db = new Database(dbPath);
        this.logger.log(`✅ Conectado a DB: ${dbPath}`);
        this.logger.log('🔐 CryptoService inyectado correctamente');
    }

    private mapEmpresa(e: any) {
        if (!e) return null;

        // Mapeo manual de snake_case a camelCase para compatibilidad frontend
        const mapped = {
            id: e.id,
            rfc: e.rfc,
            razonSocial: e.razon_social,
            regimenFiscal: e.regimen_fiscal,
            sector: e.sector,
            satAuthMode: e.sat_auth_mode,
            satStatus: e.sat_status,
            lastSatSyncAt: e.last_sat_sync_at,
            activa: Boolean(e.activa),
            configuracion: e.configuracion
        };

        if (mapped.configuracion && typeof mapped.configuracion === 'string') {
            try {
                mapped.configuracion = JSON.parse(mapped.configuracion);
            } catch {
                mapped.configuracion = {};
            }
        }
        return mapped;
    }

    async findAll() {
        try {
            const stmt = this.db.prepare('SELECT * FROM empresas WHERE activa = 1');
            const empresas = stmt.all();
            return empresas.map((e: any) => this.mapEmpresa(e));
        } catch (error: any) {
            this.logger.error(`Error al obtener empresas: ${error.message}`);
            return [];
        }
    }

    async findOne(id: string) {
        try {
            const stmt = this.db.prepare('SELECT * FROM empresas WHERE id = ?');
            const empresa = stmt.get(id);
            return this.mapEmpresa(empresa);
        } catch (error) {
            this.logger.error(`Error al buscar empresa ${id}`, error);
            throw new BadRequestException('Error al buscar la empresa.');
        }
    }

    async create(dto: CrearEmpresaDto) {
        this.logger.log(`Iniciando alta de empresa: ${dto.rfc || 'SIN RFC'}`);

        // Validaciones
        if (!dto.rfc) {
            throw new BadRequestException('El campo RFC es obligatorio.');
        }

        if (!dto.razonSocial) {
            throw new BadRequestException('El campo Razón Social es obligatorio.');
        }

        // Normalización
        const rfcNormalizado = dto.rfc.trim().toUpperCase();

        // Validación Regex RFC
        const rfcRegexOficial = /^([A-ZÑ&]{3,4})([0-9]{6})([A-Z0-9]{3})$/;

        if (!rfcRegexOficial.test(rfcNormalizado)) {
            this.logger.warn(`Validación fallida: RFC inválido (${rfcNormalizado})`);
            throw new BadRequestException({
                error: 'RFC_INVALIDO',
                message: 'El RFC no cumple con el formato oficial del SAT.'
            });
        }

        try {
            // Verificación de Duplicados con SQL puro
            const checkStmt = this.db.prepare('SELECT id FROM empresas WHERE rfc = ?');
            const existente = checkStmt.get(rfcNormalizado);

            if (existente) {
                this.logger.warn(`Intento de duplicado: ${rfcNormalizado}`);
                throw new ConflictException({
                    error: 'RFC_DUPLICADO',
                    message: 'La empresa ya se encuentra registrada con este RFC.'
                });
            }

            // ID
            const nuevoId = `empresa-${rfcNormalizado.toLowerCase()}`;

            // INSERT con SQL puro
            const insertStmt = this.db.prepare(`
                INSERT INTO empresas (id, rfc, razon_social, activa, sat_auth_mode, sat_status)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            insertStmt.run(
                nuevoId,
                rfcNormalizado,
                dto.razonSocial.trim(),
                1,
                'NONE',
                'DISCONNECTED'
            );

            this.logger.log(`✅ Empresa insertada: ${nuevoId}`);

            // SELECT para obtener el registro completo
            const selectStmt = this.db.prepare('SELECT * FROM empresas WHERE id = ?');
            const empresaCreada = selectStmt.get(nuevoId);

            if (!empresaCreada) {
                throw new Error('Empresa insertada pero no encontrada en SELECT');
            }

            return {
                success: true,
                message: 'Empresa creada exitosamente.',
                empresa: empresaCreada
            };

        } catch (error: any) {
            console.error('========== INSERT EMPRESA ERROR ==========');
            console.error('Mensaje:', error.message);
            console.error('==========================================');

            if (error instanceof BadRequestException || error instanceof ConflictException) {
                throw error;
            }

            this.logger.error(`Error crítico creando empresa: ${error.message}`);

            if (error.code === 'SQLITE_CONSTRAINT' || error.message?.includes('UNIQUE')) {
                throw new ConflictException({
                    error: 'RFC_DUPLICADO',
                    message: 'La empresa ya existe (validación de base de datos).'
                });
            }

            throw new BadRequestException({
                error: 'INTERNAL_ERROR',
                message: 'No se pudo crear la empresa. Intente nuevamente.'
            });
        }
    }

    async update(id: string, dto: Partial<CrearEmpresaDto>) {
        try {
            const current = await this.findOne(id);
            if (!current) throw new BadRequestException('Empresa no encontrada');

            const stmt = this.db.prepare(`
                UPDATE empresas 
                SET 
                    razon_social = COALESCE(?, razon_social),
                    sat_auth_mode = COALESCE(?, sat_auth_mode),
                    sat_status = COALESCE(?, sat_status),
                    configuracion = COALESCE(?, configuracion)
                WHERE id = ?
            `);

            const configJson = dto.configuracion ? JSON.stringify(dto.configuracion) : null;

            stmt.run(
                dto.razonSocial?.trim() || null,
                (dto as any).satAuthMode || null,
                (dto as any).satStatus || null,
                configJson,
                id
            );

            return { success: true, message: 'Actualizado correctamente' };
        } catch (error: any) {
            this.logger.error(`Error actualizando ${id}: ${error.message}`);
            throw new BadRequestException('No se pudo actualizar la empresa');
        }
    }

    async delete(id: string) {
        try {
            const stmt = this.db.prepare('UPDATE empresas SET activa = 0 WHERE id = ?');
            stmt.run(id);
            return { success: true, message: 'Empresa desactivada' };
        } catch (error) {
            this.logger.error(`Error eliminando ${id}`, error);
            throw new BadRequestException('No se pudo eliminar la empresa');
        }
    }

    async actualizarFiel(id: string, data: { cer?: any, key?: any, passwordFiel: string, passwordCiec?: string }) {
        try {
            const empresa = await this.findOne(id);
            if (!empresa) throw new BadRequestException('Empresa no encontrada');

            // 1. Simular persistencia de archivos (Backup local)
            const uploadDir = path.join(process.cwd(), 'uploads', 'fiel', id);
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            if (data.cer) {
                fs.writeFileSync(path.join(uploadDir, 'fiel.cer'), data.cer.buffer);
            }
            if (data.key) {
                fs.writeFileSync(path.join(uploadDir, 'fiel.key'), data.key.buffer);
            }

            // 2. Encriptar credenciales con AES-256 (CryptoService)
            const encryptedCer = data.cer
                ? await this.cryptoService.encrypt(data.cer.buffer.toString('base64'), id)
                : null;

            const encryptedKey = data.key
                ? await this.cryptoService.encrypt(data.key.buffer.toString('base64'), id)
                : null;

            const encryptedPass = await this.cryptoService.encrypt(data.passwordFiel, id);

            const encryptedCiec = data.passwordCiec
                ? await this.cryptoService.encrypt(data.passwordCiec, id)
                : null;

            // 3. Actualizar base de datos con status ACTIVE y credenciales reales encriptadas
            // Nota: Usamos COALESCE (o lógica JS) para no borrar datos si envío parcial (aunque este endpoint suele ser full)
            // Aquí asumimos que si no se envían archivos, podrían ser nulos, pero el update anterior 'fiel_cer_encrypted = ?' los borraría.
            // Para ser seguros, recuperamos lo anterior si es nulo.

            const currentCreds = this.db.prepare('SELECT fiel_cer_encrypted, fiel_key_encrypted FROM empresas WHERE id = ?').get(id) as any;

            const finalCer = encryptedCer || currentCreds?.fiel_cer_encrypted;
            const finalKey = encryptedKey || currentCreds?.fiel_key_encrypted;

            const stmt = this.db.prepare(`
                UPDATE empresas 
                SET 
                    sat_auth_mode = 'FIEL',
                    sat_status = 'ACTIVE',
                    fiel_cer_encrypted = ?,
                    fiel_key_encrypted = ?,
                    fiel_pass_encrypted = ?,
                    ciec_encrypted = ?
                WHERE id = ?
            `);

            stmt.run(
                finalCer,
                finalKey,
                encryptedPass,
                encryptedCiec,
                id
            );

            this.logger.log(`✅ Empresa ${id} vinculada exitosamente con FIEL (AES-256 Encrypted)`);

            return {
                success: true,
                message: 'Certificados vinculados y encriptados correctamente.',
                status: 'ACTIVE'
            };

        } catch (error: any) {
            this.logger.error(`Error al actualizar FIEL: ${error.message}`);
            throw new BadRequestException('Error al procesar certificados: ' + error.message);
        }
    }
}

