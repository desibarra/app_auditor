import { Injectable } from '@nestjs/common';
// Si usas Drizzle directamente, importa aquí

@Injectable()
export class DatabaseService {
  // Placeholder – el agente lo expandirá después
  async query(sql: string, params: any[] = []) {
    // Lógica real con Drizzle vendrá después
    console.log('SQL:', sql, 'Params:', params);
    return [];
  }
}