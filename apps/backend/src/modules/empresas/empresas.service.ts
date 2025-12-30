import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import Database from 'better-sqlite3';
import path from 'path';

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

    constructor() {
        // Conexión directa a SQLite sin Drizzle (Legacy compatible)
        const dbPath = path.join(process.cwd(), 'data/dev_clean.db');

        console.log('[EmpresasService] CWD:', process.cwd());
        console.log('[EmpresasService] __dirname:', __dirname);
        console.log(`[EmpresasService] Intentando conectar a: ${dbPath}`);

        this.db = new Database(dbPath);
        this.logger.log(`✅ Conectado a DB: ${dbPath}`);
    }

    async findAll() {
        try {
            const stmt = this.db.prepare('SELECT * FROM empresas WHERE activa = 1');
            const empresas = stmt.all();
            return empresas.map((e: any) => {
                if (e.configuracion && typeof e.configuracion === 'string') {
                    try {
                        e.configuracion = JSON.parse(e.configuracion);
                    } catch {
                        e.configuracion = {};
                    }
                }
                return e;
            });
        } catch (error: any) {
            this.logger.error(`Error al obtener empresas: ${error.message}`);
            return [];
        }
    }

    async findOne(id: string) {
        try {
            const stmt = this.db.prepare('SELECT * FROM empresas WHERE id = ?');
            const empresa = stmt.get(id);
            if (!empresa) return null;

            if ((empresa as any).configuracion && typeof (empresa as any).configuracion === 'string') {
                try {
                    (empresa as any).configuracion = JSON.parse((empresa as any).configuracion);
                } catch {
                    (empresa as any).configuracion = {};
                }
            }
            return empresa;
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
                SET razon_social = COALESCE(?, razon_social)
                WHERE id = ?
            `);

            stmt.run(dto.razonSocial?.trim(), id);
            return { success: true, message: 'Actualizado correctamente' };
        } catch (error) {
            this.logger.error(`Error actualizando ${id}`, error);
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
}
