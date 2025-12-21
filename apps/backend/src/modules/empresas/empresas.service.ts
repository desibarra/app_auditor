import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { empresas } from '../../database/schema';
import { eq } from 'drizzle-orm';

export interface CrearEmpresaDto {
    rfc: string;
    razonSocial: string;
    regimenFiscal?: string;
    sector?: string;
    configuracion?: any; // JSON Object
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

    /**
     * Obtiene todas las empresas activas
     */
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

    /**
     * Obtiene una empresa por ID
     */
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
            if (error instanceof NotFoundException) {
                throw error;
            }
            console.error('Error al obtener empresa:', error);
            throw new BadRequestException('Error al obtener empresa');
        }
    }

    /**
     * Crea una nueva empresa
     */
    async create(dto: CrearEmpresaDto) {
        try {
            // Validar RFC
            if (!dto.rfc || dto.rfc.length < 12 || dto.rfc.length > 13) {
                throw new BadRequestException('RFC inválido (debe tener 12 o 13 caracteres)');
            }

            // Validar que el RFC no exista
            const existente = await this.db
                .select()
                .from(empresas)
                .where(eq(empresas.rfc, dto.rfc.toUpperCase()))
                .limit(1);

            if (existente.length > 0) {
                throw new BadRequestException(`Ya existe una empresa con el RFC ${dto.rfc}`);
            }

            // Generar ID único basado en RFC
            const id = `empresa-${dto.rfc.toLowerCase()}`;

            // Insertar empresa
            await this.db.insert(empresas).values({
                id,
                rfc: dto.rfc.toUpperCase(),
                razonSocial: dto.razonSocial,
                regimenFiscal: dto.regimenFiscal,
                sector: dto.sector,
                activa: true,
                configuracion: dto.configuracion ? JSON.stringify(dto.configuracion) : null,
            });

            return {
                success: true,
                message: 'Empresa creada exitosamente',
                empresa: {
                    id,
                    rfc: dto.rfc.toUpperCase(),
                    razonSocial: dto.razonSocial,
                },
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error al crear empresa:', error);
            throw new BadRequestException('Error al crear empresa');
        }
    }

    /**
     * Actualiza una empresa
     */
    async update(id: string, dto: Partial<CrearEmpresaDto>) {
        try {
            // Verificar que existe
            await this.findOne(id);

            const updateData: any = {
                razonSocial: dto.razonSocial,
                regimenFiscal: dto.regimenFiscal,
                sector: dto.sector,
            };

            if (dto.configuracion !== undefined) {
                updateData.configuracion = JSON.stringify(dto.configuracion);
            }

            // Actualizar
            await this.db
                .update(empresas)
                .set(updateData)
                .where(eq(empresas.id, id));

            return {
                success: true,
                message: 'Empresa actualizada exitosamente',
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error al actualizar empresa:', error);
            throw new BadRequestException('Error al actualizar empresa');
        }
    }


    /**
     * Desactiva una empresa (soft delete)
     */
    async delete(id: string) {
        try {
            // Verificar que existe
            await this.findOne(id);

            // Desactivar
            await this.db
                .update(empresas)
                .set({ activa: false })
                .where(eq(empresas.id, id));

            return {
                success: true,
                message: 'Empresa desactivada exitosamente',
            };
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) {
                throw error;
            }
            console.error('Error al desactivar empresa:', error);
            throw new BadRequestException('Error al desactivar empresa');
        }
    }
}
