import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { empresas } from '../../database/schema';
import { eq } from 'drizzle-orm';

export interface CrearEmpresaDto {
    rfc: string;
    razonSocial: string;
    regimenFiscal?: string;
    sector?: string;
    configuracion?: any; // JSON Object
    satAuthMode?: 'NONE' | 'RFC_ONLY' | 'CIEC' | 'FIEL'; // Updated types
}

@Injectable()
export class EmpresasService {
    constructor(@Inject('DRIZZLE_CLIENT') private db: any) { }

    private parseConfig(empresa: any) {
        if (!empresa) return empresa;
        try {
            if (empresa.configuracion && typeof empresa.configuracion === 'string') {
                empresa.configuracion = JSON.parse(empresa.configuracion);
            }
        } catch (e) {
            empresa.configuracion = {};
        }
        return empresa;
    }

    async findAll() {
        try {
            const empresasList = await this.db
                .select()
                .from(empresas)
                .where(eq(empresas.activa, true));
            return empresasList.map(this.parseConfig);
        } catch (error) {
            console.error('Error al obtener empresas:', error);
            throw new BadRequestException('Error al obtener empresas');
        }
    }

    async findOne(id: string) {
        try {
            const empresa = await this.db
                .select()
                .from(empresas)
                .where(eq(empresas.id, id))
                .limit(1);

            if (empresa.length === 0) {
                throw new NotFoundException(`Empresa con ID ${id} no encontrada`);
            }
            return this.parseConfig(empresa[0]);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            console.error('Error al obtener empresa:', error);
            throw new BadRequestException('Error al obtener empresa');
        }
    }

    async create(dto: CrearEmpresaDto) {
        try {
            if (!dto.rfc || dto.rfc.length < 12 || dto.rfc.length > 13) {
                throw new BadRequestException('RFC inválido (12-13 caracteres)');
            }

            const existente = await this.db
                .select()
                .from(empresas)
                .where(eq(empresas.rfc, dto.rfc.toUpperCase()))
                .limit(1);

            if (existente.length > 0) {
                throw new BadRequestException(`Ya existe una empresa con el RFC ${dto.rfc}`);
            }

            const id = `empresa-${dto.rfc.toLowerCase()}`;

            // CREATE: Reglas de inicialización estrictas
            await this.db.insert(empresas).values({
                id,
                rfc: dto.rfc.toUpperCase(),
                razonSocial: dto.razonSocial,
                regimenFiscal: dto.regimenFiscal,
                sector: dto.sector,
                activa: true,
                configuracion: dto.configuracion ? JSON.stringify(dto.configuracion) : null,

                // SAT DEFAULTS (No confiar en entrada para status inicial)
                satAuthMode: dto.satAuthMode || 'NONE',
                satStatus: 'DISCONNECTED',
            });

            return {
                success: true,
                message: 'Empresa creada exitosamente',
                empresa: { id, rfc: dto.rfc.toUpperCase(), razonSocial: dto.razonSocial, satAuthMode: dto.satAuthMode || 'NONE' },
            };
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            console.error('Error al crear empresa:', error);
            throw new BadRequestException('Error al crear empresa');
        }
    }

    async update(id: string, dto: Partial<CrearEmpresaDto>) {
        try {
            const currentEmpresa = await this.findOne(id); // Necesario para comparar estado

            const updateData: any = {
                razonSocial: dto.razonSocial,
                regimenFiscal: dto.regimenFiscal,
                sector: dto.sector,
            };

            if (dto.configuracion !== undefined) {
                updateData.configuracion = JSON.stringify(dto.configuracion);
            }

            // REGLA DE DEFENSA: Reset de seguridad al cambiar modo
            // Si el usuario cambia el modo de autenticación, cualquier validación previa queda inválida.
            if (dto.satAuthMode && dto.satAuthMode !== currentEmpresa.satAuthMode) {
                updateData.satAuthMode = dto.satAuthMode;
                updateData.satStatus = 'DISCONNECTED'; // Force reset
                console.log(`[Seguridad] Modo SAT cambiado para ${id}. Status reseteado a DISCONNECTED.`);
            }

            await this.db
                .update(empresas)
                .set(updateData)
                .where(eq(empresas.id, id));

            return {
                success: true,
                message: 'Empresa actualizada exitosamente',
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
            console.error('Error al actualizar empresa:', error);
            throw new BadRequestException('Error al actualizar empresa');
        }
    }

    async delete(id: string) {
        try {
            await this.findOne(id);
            await this.db.update(empresas).set({ activa: false }).where(eq(empresas.id, id));
            return { success: true, message: 'Empresa desactivada exitosamente' };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
            throw new BadRequestException('Error al desactivar empresa');
        }
    }
}
