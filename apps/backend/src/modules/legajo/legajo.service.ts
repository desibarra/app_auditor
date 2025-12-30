import { Injectable, Inject, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { cfdiRecibidos } from '../../database/schema/cfdi_recibidos.schema';
import { documentosSoporte } from '../../database/schema/documentos_soporte';
import { empresas } from '../../database/schema/empresas.schema';
import { analysisSnapshots } from '../../database/schemas/analysis_snapshots.schema';
import * as fs from 'fs';
import * as path from 'path';
import { setTimeout } from 'timers/promises';
import { ExecutionGuard } from '../../utils/execution-guard.util';
import { executeWithGuard } from '../../../common/execution-guard';

// Fix imports para librerías CommonJS
import archiver = require('archiver');
import PDFDocument = require('pdfkit');

interface ReporteFinanciero {
    uuid: string;
    fecha: string;
    rol: 'INGRESOS' | 'GASTOS';
    rfcoNombre: string;
    subtotal: number;
    total: number;
    impuesto: number;
    evidenciasCount: number;
    tiposEvidencia: string[];
    cumplimiento: 'OK' | 'PARCIAL' | 'FALTANTE';
}

@Injectable()
export class LegajoService {
    private readonly logger = new Logger(LegajoService.name);

    constructor(@Inject('DRIZZLE_CLIENT') private readonly db: any) { }

    async generarCierreMensual(empresaId: string, anio: number, mes: number, res: Response) {
        return executeWithGuard({
            operation: 'generarCierreMensual',
            empresaId,
            periodo: `${anio}-${mes.toString().padStart(2, '0')}`,
            timeoutMs: 60000,
            action: async () => {
                try {
                    const snapshot = await this.db
                        .select()
                        .from(analysisSnapshots)
                        .where(
                            and(
                                eq(analysisSnapshots.empresaId, empresaId),
                                eq(analysisSnapshots.periodo, `${anio}-${mes.toString().padStart(2, '0')}`)
                            )
                        );

                    if (!snapshot || snapshot.length === 0) {
                        throw new NotFoundException('No valid snapshot found for the specified period.');
                    }

                    this.logger.log(`Using snapshot for ${empresaId} - ${anio}/${mes}`);

                    // Proceed with existing logic using snapshot data
                    const snapshotData = snapshot[0]; // Assuming one snapshot per period

                    // Replace todosCfdis with snapshotData.cfdis
                    const cfdisDelMes = snapshotData.cfdis;

                    // 3. Initialize ZIP
                    const archive = archiver('zip', { zlib: { level: 5 } });
                    res.attachment(`Legajo_Fiscal_${snapshotData.rfc}_${anio}_${mes.toString().padStart(2, '0')}.zip`);
                    archive.pipe(res);

                    // 4. Process Data
                    const reporteItems: ReporteFinanciero[] = [];

                    for (const cfdi of cfdisDelMes) {
                        const esIngreso = cfdi.tipoComprobante === 'I' && cfdi.emisorRfc === snapshotData.rfc;
                        const rol = esIngreso ? 'INGRESOS' : 'GASTOS';

                        const contraparteRaw = esIngreso ? (cfdi.receptorNombre || cfdi.receptorRfc) : (cfdi.emisorNombre || cfdi.emisorRfc);
                        const contraparte = (contraparteRaw || 'DESCONOCIDO').substring(0, 30).replace(/[^a-zA-Z0-9 ñÑ&]/g, '');

                        const evidencias = cfdi.evidencias || [];
                        const tipos = evidencias.map(e => e.categoriaEvidencia || 'Genérico');

                        const tieneContrato = tipos.some(t => t.toLowerCase().includes('contrato'));
                        const esCompleto = evidencias.length >= 3 || tieneContrato;

                        const impuestoCalc = Math.max(0, (cfdi.total || 0) - (cfdi.subtotal || 0));

                        reporteItems.push({
                            uuid: cfdi.uuid,
                            fecha: cfdi.fechaTimbrado || cfdi.fecha,
                            rol,
                            rfcoNombre: contraparte,
                            subtotal: cfdi.subtotal || 0,
                            total: cfdi.total || 0,
                            impuesto: impuestoCalc,
                            evidenciasCount: evidencias.length,
                            tiposEvidencia: tipos,
                            cumplimiento: esCompleto ? 'OK' : (evidencias.length > 0 ? 'PARCIAL' : 'FALTANTE')
                        });

                        const rutaZip = `${snapshotData.rfc}/${anio}/${mes.toString().padStart(2, '0')}/${rol}/${cfdi.uuid.substring(0, 8)}`;
                        for (const evi of evidencias) {
                            if (evi.archivo) {
                                const absPath = path.isAbsolute(evi.archivo) ? evi.archivo : path.join(process.cwd(), evi.archivo);
                                if (fs.existsSync(absPath)) {
                                    const name = `${evi.categoriaEvidencia || 'Doc'}_${path.basename(evi.archivo)}`;
                                    archive.file(absPath, { name: `${rutaZip}/${name}` });
                                }
                            }
                        }
                    }

                    reporteItems.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

                    try {
                        const pdfBuffer = await this.generarReportePDF(snapshotData.nombreEmpresa, snapshotData.rfc, anio, mes, reporteItems);
                        archive.append(pdfBuffer, { name: `${snapshotData.rfc}/${anio}/${mes.toString().padStart(2, '0')}/Dictamen_Materialidad.pdf` });
                    } catch (error) {
                        this.logger.error('Error generating PDF', error.stack);
                        throw new InternalServerErrorException('Failed to generate PDF', error.message);
                    }

                    await archive.finalize();
                } catch (error) {
                    this.logger.error(`Error in generarCierreMensual: ${error.message}`, error.stack);
                    throw error;
                }
            },
        });
    }

    private async generarReportePDF(nombreEmpresa: string, rfc: string, anio: number, mes: number, data: ReporteFinanciero[]): Promise<Buffer> {
        return executeWithGuard({
            operation: 'generarReportePDF',
            empresaId: rfc,
            periodo: `${anio}-${mes.toString().padStart(2, '0')}`,
            timeoutMs: 30000,
            action: async () => {
                try {
                    const timeoutMs = 30000; // 30 seconds timeout
                    return await Promise.race([
                        new Promise<Buffer>((resolve, reject) => {
                            // Diseño profesional: Letter, márgenes limpios
                            const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
                            const buffers: Buffer[] = [];

                            doc.on('data', buffers.push.bind(buffers));
                            doc.on('end', () => resolve(Buffer.concat(buffers)));
                            doc.on('error', reject);

                            // --- HEADER ---
                            doc.fontSize(14).font('Helvetica-Bold').text('DICTAMEN DE MATERIALIDAD Y CUMPLIMIENTO FISCAL', { align: 'center' });
                            doc.moveDown(0.5);
                            doc.fontSize(9).font('Helvetica').fillColor('#666666').text('REPORTE AUDITORÍA INTERNA v2.1', { align: 'center' });
                            doc.fillColor('black');
                            doc.moveDown(1.5);

                            // Bloque Info Cliente
                            doc.fontSize(10).font('Helvetica-Bold').text(`CONTRIBUYENTE: ${nombreEmpresa.toUpperCase()} (${rfc})`);
                            doc.text(`PERIODO AUDITADO: NOVIEMBRE ${anio}`); // Ajustar mes dinámico
                            doc.moveDown();

                            // --- RESUMEN FINANCIERO (Caja Gris) ---
                            const startY = doc.y;
                            const boxHeight = 75;
                            doc.rect(40, startY, 532, boxHeight).fill('#F3F4F6'); // Fondo gris suave
                            doc.fillColor('black');

                            // Título Caja
                            doc.fontSize(11).font('Helvetica-Bold').text('RESUMEN FINANCIERO DEL PERIODO', 55, startY + 10);

                            // Fila de Totales
                            const ingresos = data.filter(d => d.rol === 'INGRESOS');
                            const gastos = data.filter(d => d.rol === 'GASTOS');

                            const sumIngresos = ingresos.reduce((s, i) => s + i.total, 0);
                            const sumEgresos = gastos.reduce((s, i) => s + i.total, 0);
                            const sumIvaAcred = gastos.reduce((s, i) => s + i.impuesto, 0);

                            const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

                            doc.fontSize(9).font('Helvetica');
                            // Columna Izq
                            doc.text('Total Ingresos Facturados:', 55, startY + 35);
                            doc.font('Helvetica-Bold').text(fmt(sumIngresos), 200, startY + 35);

                            // Columna Der
                            doc.font('Helvetica').text('Total Egresos Deducibles:', 320, startY + 35);
                            doc.font('Helvetica-Bold').text(fmt(sumEgresos), 460, startY + 35);

                            doc.font('Helvetica').text('IVA Acreditable Est.:', 320, startY + 50);
                            doc.font('Helvetica-Bold').text(fmt(sumIvaAcred), 460, startY + 50);

                            // Resetear posición (salir de la caja)
                            doc.y = startY + boxHeight + 20;

                            // --- TABLA DETALLADA ---
                            // Definición de columnas (Grid System)
                            // X: [#=40, Tipo=65, Fecha=95, ContraP=155, UUID=260, Imp=380, Evid=450, Est=520]
                            const col = { num: 40, tipo: 65, fecha: 95, contra: 155, uuid: 260, imp: 380, evid: 450, est: 520 };

                            // Header Tabla
                            const hY = doc.y;
                            doc.rect(40, hY, 532, 20).fill('#2C3E50');
                            doc.fillColor('white').fontSize(7).font('Helvetica-Bold');

                            doc.text('#', col.num + 2, hY + 6);
                            doc.text('TIPO', col.tipo, hY + 6);
                            doc.text('FECHA', col.fecha, hY + 6);
                            doc.text('CONTRAPARTE', col.contra, hY + 6);
                            doc.text('UUID / FISCAL ID', col.uuid, hY + 6);
                            doc.text('IMPORTE', col.imp, hY + 6);
                            doc.text('EVIDENCIA', col.evid, hY + 6);
                            doc.text('ESTATUS', col.est, hY + 6);

                            let rowY = hY + 25;
                            doc.fillColor('black');

                            data.forEach((item, i) => {
                                // Nueva página si se acaba el espacio
                                if (rowY > 720) {
                                    doc.addPage();
                                    rowY = 50;
                                }

                                // Zebra Striping
                                if (i % 2 !== 0) {
                                    doc.rect(40, rowY - 4, 532, 14).fill('#F9FAFB');
                                    doc.fillColor('black');
                                }

                                // Datos
                                doc.fontSize(7).font('Helvetica');
                                doc.text((i + 1).toString(), col.num + 2, rowY);
                                doc.text(item.rol === 'INGRESOS' ? 'ING' : 'EGR', col.tipo, rowY);

                                // Fecha legible
                                const d = new Date(item.fecha);
                                const fechaStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
                                doc.text(fechaStr, col.fecha, rowY);

                                // Nombre Cortado
                                doc.text(item.rfcoNombre.substring(0, 18), col.contra, rowY, { width: 95, height: 10, lineBreak: false, ellipsis: true });

                                // UUID MONOSPACE PEQUEÑO Y COMPLETO
                                doc.font('Courier').fontSize(6); // Menor fuente
                                doc.text(item.uuid.substring(0, 36), col.uuid, rowY, { width: 110 }); // Intentar mostrarlo todo o casi todo (sin puntos suspensivos forzados manuales)

                                // Importe
                                doc.font('Helvetica-Bold').fontSize(7);
                                doc.text(fmt(item.total), col.imp, rowY);

                                // Evidencia (Check especial para el Contrato)
                                doc.font('Helvetica').fontSize(6);
                                let evText = `${item.evidenciasCount} Docs`;
                                const tieneContrato = item.tiposEvidencia.some(t => t.toLowerCase().includes('contrato'));

                                if (tieneContrato) {
                                    doc.fillColor('#16803d').font('Helvetica-Bold'); // Verde fuerte
                                    evText += ' + CONTRATO';
                                }
                                doc.text(evText, col.evid, rowY);
                                doc.fillColor('black').font('Helvetica');

                                // Estado
                                const colorEst = item.cumplimiento === 'OK' ? '#16803d' : '#DC2626';
                                doc.fillColor(colorEst).font('Helvetica-Bold').fontSize(7);
                                // Evitar wrap forzado
                                doc.text(item.cumplimiento, col.est, rowY);

                                doc.fillColor('black');
                                rowY += 16;
                            });

                            // Footer Tabla: Totales
                            const totalLineY = rowY + 5;
                            doc.moveTo(40, totalLineY).lineTo(572, totalLineY).stroke();
                            doc.fontSize(8).font('Helvetica-Bold').text('TOTAL MOVIMIENTOS AUDITADOS:', 40, totalLineY + 10);
                            doc.text(data.length.toString(), 180, totalLineY + 10);

                            // Generado por
                            doc.fontSize(7).font('Helvetica').fillColor('grey');
                            doc.text('Este documento es una representación impresa de un dictamen digital generado por SaaS Fiscal.', 40, 750, { align: 'center', width: 530 });

                            doc.end();
                        }),
                        setTimeout(timeoutMs).then(() => {
                            throw new Error('PDF generation timed out');
                        }),
                    ]);
                } catch (error) {
                    this.logger.error('Error in generarReportePDF', error.stack);
                    throw new InternalServerErrorException('Failed to generate PDF', error.message);
                }
            },
        });
    }
}
