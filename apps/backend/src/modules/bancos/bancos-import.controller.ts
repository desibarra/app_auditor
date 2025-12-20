import { Controller, Post, UseInterceptors, UploadedFile, Body, Inject, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { estadosCuenta, movimientosBancarios } from '../../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as Excel from 'exceljs';

@Controller('bancos')
export class BancosImportController {
    constructor(@Inject('DRIZZLE_CLIENT') private readonly db: any) { }

    @Post('import-excel')
    @UseInterceptors(FileInterceptor('file'))
    async importExcel(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { empresaId: string; banco: string; cuenta: string; anio: number; mes: number }
    ) {
        const { empresaId, banco, cuenta, anio, mes } = body;

        if (!file) {
            throw new BadRequestException('No se proporcionó archivo');
        }

        try {
            const workbook = new Excel.Workbook();
            await workbook.xlsx.load(new Uint8Array(file.buffer) as any);
            const worksheet = workbook.worksheets[0];

            const movimientos = [];
            let totalDepositos = 0;
            let totalRetiros = 0;

            // Buscar fila de encabezados (buscar palabras clave)
            let headerRow = 0;
            for (let i = 1; i <= Math.min(10, worksheet.rowCount); i++) {
                const row = worksheet.getRow(i);
                const text = row.values.toString().toUpperCase();
                if (text.includes('FECHA') || text.includes('DESCRIPCION') || text.includes('RETIRO') || text.includes('DEPOSITO')) {
                    headerRow = i;
                    break;
                }
            }

            if (headerRow === 0) {
                throw new BadRequestException('No se encontraron encabezados. Asegúrate que el Excel tenga columnas: Fecha, Descripción, Retiros, Depósitos');
            }

            // Identificar columnas
            const headers = worksheet.getRow(headerRow);
            let colFecha = -1, colDesc = -1, colRetiros = -1, colDepositos = -1;

            headers.eachCell((cell, colNumber) => {
                const val = cell.value?.toString().toUpperCase() || '';
                if (val.includes('FECHA')) colFecha = colNumber;
                if (val.includes('DESCRIPCION') || val.includes('CONCEPTO') || val.includes('OPERACION')) colDesc = colNumber;
                if (val.includes('RETIRO') || val.includes('CARGO')) colRetiros = colNumber;
                if (val.includes('DEPOSITO') || val.includes('ABONO')) colDepositos = colNumber;
            });

            if (colFecha === -1 || colDesc === -1) {
                throw new BadRequestException(`No se pudieron identificar columnas clave. 
                    Fecha: ${colFecha}, Descripción: ${colDesc}, Retiros: ${colRetiros}, Depósitos: ${colDepositos}`);
            }

            // Leer movimientos
            for (let i = headerRow + 1; i <= worksheet.rowCount; i++) {
                const row = worksheet.getRow(i);

                const fechaCell = row.getCell(colFecha).value;
                const descCell = row.getCell(colDesc).value;

                if (!fechaCell) continue; // Fila vacía o sin fecha

                // Parsear fecha
                let fecha: string;
                if (fechaCell instanceof Date) {
                    const d = fechaCell;
                    fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                } else {
                    // Intentar parsear string de fecha
                    const dateStr = fechaCell.toString();
                    const parsed = new Date(dateStr);
                    if (!isNaN(parsed.getTime())) {
                        fecha = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
                    } else {
                        // Formato DD/MM/YYYY o similar
                        const parts = dateStr.split(/[\/\-]/);
                        if (parts.length === 3) {
                            const day = parts[0].padStart(2, '0');
                            const month = parts[1].padStart(2, '0');
                            const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
                            fecha = `${year}-${month}-${day}`;
                        } else {
                            continue; // Fecha inválida
                        }
                    }
                }

                const descripcion = descCell?.toString() || 'MOVIMIENTO BANCARIO';

                // Leer montos
                const retiro = colRetiros !== -1 ? parseFloat(row.getCell(colRetiros).value?.toString().replace(/[$,\s]/g, '') || '0') : 0;
                const deposito = colDepositos !== -1 ? parseFloat(row.getCell(colDepositos).value?.toString().replace(/[$,\s]/g, '') || '0') : 0;

                if (retiro > 0 || deposito > 0) {
                    movimientos.push({
                        fecha,
                        descripcion,
                        retiro,
                        deposito
                    });

                    totalRetiros += retiro;
                    totalDepositos += deposito;
                }
            }

            if (movimientos.length === 0) {
                throw new BadRequestException('No se encontraron movimientos válidos en el archivo');
            }

            // Eliminar periodo existente
            await this.db.delete(movimientosBancarios)
                .where(sql`estado_cuenta_id IN (SELECT id FROM ${estadosCuenta} WHERE empresa_id = ${empresaId} AND anio = ${anio} AND mes = ${mes})`);
            await this.db.delete(estadosCuenta)
                .where(and(
                    eq(estadosCuenta.empresaId, empresaId),
                    eq(estadosCuenta.anio, anio),
                    eq(estadosCuenta.mes, mes)
                ));

            // Guardar estado de cuenta
            const estadoId = randomUUID();
            await this.db.insert(estadosCuenta).values({
                id: estadoId,
                empresaId,
                banco: banco || 'IMPORTADO',
                cuenta: cuenta || '****',
                anio: parseInt(anio.toString()),
                mes: parseInt(mes.toString()),
                archivoPath: `/uploads/bancos/${empresaId}/${file.originalname}`,
                saldoInicial: 0,
                saldoFinal: totalDepositos - totalRetiros,
                moneda: 'MXN'
            });

            // Guardar movimientos
            const movsDB = [];
            movimientos.forEach(mov => {
                if (mov.deposito > 0) {
                    movsDB.push({
                        id: randomUUID(),
                        estadoCuentaId: estadoId,
                        fecha: mov.fecha,
                        descripcion: mov.descripcion,
                        referencia: 'IMPORTADO',
                        monto: mov.deposito,
                        tipo: 'ABONO',
                        conciliado: false
                    });
                }
                if (mov.retiro > 0) {
                    movsDB.push({
                        id: randomUUID(),
                        estadoCuentaId: estadoId,
                        fecha: mov.fecha,
                        descripcion: mov.descripcion,
                        referencia: 'IMPORTADO',
                        monto: -mov.retiro,
                        tipo: 'CARGO',
                        conciliado: false
                    });
                }
            });

            await this.db.insert(movimientosBancarios).values(movsDB);

            return {
                success: true,
                message: `✅ Importación completada`,
                resumen: {
                    movimientos: movsDB.length,
                    totalDepositos: totalDepositos.toFixed(2),
                    totalRetiros: totalRetiros.toFixed(2),
                    saldoFinal: (totalDepositos - totalRetiros).toFixed(2),
                    periodo: `${mes}/${anio}`
                }
            };

        } catch (error) {
            throw new BadRequestException(`Error procesando Excel: ${error.message}`);
        }
    }
}
