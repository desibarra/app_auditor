import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';

export class CreateExpedienteDto {
  @IsNotEmpty()
  @IsString()
  @Length(12, 13, { message: 'RFC must be 12 or 13 characters long' })
  readonly rfcEmpresa: string;

  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Periodo must be in YYYY-MM format' })
  readonly periodo: string; // Format: YYYY-MM

  @IsNotEmpty()
  @IsString()
  @Length(1, 50, { message: 'Tipo must be between 1 and 50 characters' })
  readonly tipo: string;
}