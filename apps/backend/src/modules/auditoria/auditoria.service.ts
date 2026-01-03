import { Injectable, Query } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AuditoriaService {
  constructor(private readonly db: DatabaseService) {}

  async getPeriodosDisponibles(@Query('empresaId') empresaId?: string) {
    try {
      // Query para obtener MIN y MAX año desde CFDI reales
      let query = `
        SELECT
          MIN(strftime('%Y', fecha)) AS minYear,
          MAX(strftime('%Y', fecha)) AS maxYear,
          COUNT(*) AS totalCfdis
        FROM cfdi_recibidos
        WHERE fecha IS NOT NULL AND fecha != ''
      `;
      
      const params = [];
      
      // Si se especifica empresaId, filtrar por empresa
      if (empresaId) {
        query += ` AND empresa_id = ?`;
        params.push(empresaId);
      }
      
      const result = await this.db.query(query, params);
      
      // Si no hay CFDI, devolver array vacío
      if (!result[0] || !result[0].minYear || result[0].totalCfdis === 0) {
        return {
          minYear: null,
          maxYear: null,
          years: [],
          totalCfdis: 0,
          status: 'NO_DATA'
        };
      }
      
      const minYear = parseInt(result[0].minYear);
      const maxYear = parseInt(result[0].maxYear);
      const totalCfdis = parseInt(result[0].totalCfdis);
      
      // Generar array de años disponibles
      const years = [];
      for (let year = minYear; year <= maxYear; year++) {
        years.push(year);
      }
      
      return {
        minYear,
        maxYear,
        years,
        totalCfdis,
        status: 'SUCCESS'
      };
    } catch (error) {
      console.error('Error getting available periods:', error);
      return {
        minYear: null,
        maxYear: null,
        years: [],
        totalCfdis: 0,
        status: 'ERROR',
        message: 'Error al obtener periodos disponibles'
      };
    }
  }
}