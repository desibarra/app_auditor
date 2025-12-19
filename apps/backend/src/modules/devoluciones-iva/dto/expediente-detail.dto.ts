import { ApiProperty } from '@nestjs/swagger';

class CedulaDto {
  @ApiProperty()
  tipoCedula: string;

  @ApiProperty()
  datos: any[]; // Replace with a more specific type if needed
}

class ResumenDto {
  @ApiProperty()
  totalBase: number;

  @ApiProperty()
  totalIVA: number;
}

export class ExpedienteDetailDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  rfcEmpresa: string;

  @ApiProperty()
  periodo: string;

  @ApiProperty()
  tipo: string;

  @ApiProperty()
  estado: string;

  @ApiProperty({ type: [CedulaDto] })
  cedulas: CedulaDto[];

  @ApiProperty({ type: ResumenDto })
  resumen: ResumenDto;
}