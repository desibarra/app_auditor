import { Injectable } from '@nestjs/common';
// Importa aquí lo que necesites: Drizzle, etc.

@Injectable()
export class CfdiService {
  // Otros métodos que ya tuviera el servicio...

  async normalizeCfdi(xmlData: any, idEmpresa: string) {
    // Todo el código del normalizeCfdi que te dio el agente va aquí
    const comprobante = xmlData['cfdi:Comprobante'];
    const emisor = comprobante['cfdi:Emisor'];
    const receptor = comprobante['cfdi:Receptor'];
    // ... resto del código

    return {
      uuid: comprobante['cfdi:Complemento']?.['tfd:TimbreFiscalDigital']?.$.UUID,
      tipo: receptor.$.Rfc === idEmpresa ? 'I' : 'E', // Usamos el parámetro correcto
      // ... todos los campos
      id_empresa: idEmpresa,
    };
  }

  // Otros métodos...
}