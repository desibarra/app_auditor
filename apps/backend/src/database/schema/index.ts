// Tablas originales
export * from './usuarios.schema';
export * from './empresas.schema';
export * from './empresa_usuario_rol.schema'; // Updated to use underscores
export { expedientesDevolucionIva } from './expedientes_devolucion_iva';
export { cedulasIva } from './cedulas_iva';

// ✨ NUEVAS TABLAS - PASO 1: Módulo de Materialidad y Devoluciones IVA
export { cfdiRecibidos } from './cfdi_recibidos.schema';
export { cfdiImpuestos } from './cfdi_impuestos.schema';
export { pagosEfectivo } from './pagos_efectivo.schema';
export { documentosSoporte } from './documentos_soporte'; // Actualizado con nuevos campos

// ✨ NUEVAS TABLAS - PASO 4: Expedientes de Devolución de IVA
export { expedientesDevolucionIva as expedientesDevolucion, expedienteCfdi } from './expedientes_devolucion.schema';
