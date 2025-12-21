// Tablas originales
export * from './usuarios.schema';
export * from './empresas.schema';
export * from './empresa_usuario_rol.schema';

// ✨ NUEVAS TABLAS - PASO 1: Módulo de Materialidad y Devoluciones IVA
export * from './cfdi_recibidos.schema';
export * from './cfdi_impuestos.schema';
export * from './pagos_efectivo.schema';
// export * from './documentos_soporte'; // Comentado si no existe, o verificar nombre

// ✨ NUEVAS TABLAS - PASO 4: Expedientes de Devolución de IVA
export * from './expedientes_devolucion.schema';
export * from './cedulas_iva.schema';

// ✨ NUEVAS TABLAS - ETAPA 2: Motor de Riesgo (Sentinel)
export * from './cfdi_riesgos.schema';

// ✨ NUEVAS TABLAS - ETAPA 1: Flujo de Efectivo
export * from './bancos.schema';
