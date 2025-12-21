import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { expedientesDevolucionIva } from './expedientes_devolucion.schema';

/**
 * Tabla de Cédulas de IVA (Anexo A-29 / DIOT-like)
 * Desglose por proveedor para la solicitud de devolución
 */
export const cedulasIva = sqliteTable('cedulas_iva', {
    id: integer('id').primaryKey({ autoIncrement: true }),

    // Relación con expediente
    expedienteId: integer('expediente_id')
        .notNull()
        .references(() => expedientesDevolucionIva.id, { onDelete: 'cascade' }),

    // Datos del Proveedor
    rfcProveedor: text('rfc_proveedor').notNull(),
    nombreProveedor: text('nombre_proveedor').notNull(),
    tipoTercero: text('tipo_tercero').default('04'), // 04=Proveedor Nacional, 05=Extranjero
    tipoOperacion: text('tipo_operacion').default('85'), // 85=Prestación de Servicios, etc.

    // Desglose de Importes (Moneda Nacional)
    valorActosTasa16: real('valor_actos_tasa_16').default(0),
    valorActosTasa0: real('valor_actos_tasa_0').default(0),
    valorActosExentos: real('valor_actos_exentos').default(0),

    ivaTrasladado: real('iva_trasladado').default(0), // IVA que nos cobraron
    ivaAcreditable: real('iva_acreditable').default(0), // IVA efectivamente pagado y acreditable

    ivaRetenido: real('iva_retenido').default(0),

    // Totales
    totalOperacion: real('total_operacion').notNull(),

    // Metadatos
    fechaGeneracion: integer('fecha_generacion', { mode: 'timestamp_ms' }).defaultNow(),
    numeroFacturas: integer('numero_facturas').default(0) // Cuantas facturas de este proveedor en el periodo
});
