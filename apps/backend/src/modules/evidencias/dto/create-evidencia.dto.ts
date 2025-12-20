import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateEvidenciaDto {
    @IsNotEmpty()
    @IsUUID()
    cfdiUuid: string;

    @IsNotEmpty()
    @IsString()
    categoria: string;

    @IsOptional()
    @IsString()
    descripcion?: string;
}
