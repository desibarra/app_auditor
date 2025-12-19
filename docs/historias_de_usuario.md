# Historias de Usuario del Módulo “Devoluciones de IVA” (MVP)

## DEV-001
- **Título**: Crear expediente de devolución de IVA.
- **Descripción**: Como PyME o despacho, quiero poder crear un expediente de devolución de IVA para un RFC y un periodo específico, con el objetivo de iniciar el proceso de solicitud de devolución.
- **Rol**: PyME / Despacho.
- **Criterios de aceptación**:
  1. El expediente debe incluir los campos: RFC, periodo (mes/año), tipo de devolución, estado inicial “Borrador”.
  2. El sistema debe relacionar automáticamente los CFDI, expedientes de materialidad y conciliaciones bancarias del periodo.
  3. El expediente debe guardarse correctamente en la base de datos.

## DEV-002
- **Título**: Listar expedientes de devolución de IVA.
- **Descripción**: Como PyME o despacho, quiero ver una lista de todos los expedientes de devolución de IVA creados para mi empresa, con detalles básicos como RFC, periodo, tipo y estado.
- **Rol**: PyME / Despacho.
- **Criterios de aceptación**:
  1. La lista debe mostrar columnas: RFC, periodo, tipo, estado, fecha de creación.
  2. Debe ser posible filtrar por RFC, periodo y estado.
  3. Cada expediente debe ser accesible para ver su detalle.

## DEV-003
- **Título**: Generar cédulas de IVA automáticamente.
- **Descripción**: Como contador, quiero que el sistema genere automáticamente las cédulas de IVA acreditable, trasladado y movimientos bancarios relevantes, basándose en los datos disponibles.
- **Rol**: Contador.
- **Criterios de aceptación**:
  1. Las cédulas deben incluir los campos definidos en el diseño funcional.
  2. El sistema debe permitir recalcular las cédulas en cualquier momento.
  3. Las cédulas deben almacenarse en la base de datos y ser accesibles desde el expediente.

## DEV-004
- **Título**: Subir y gestionar documentación soporte.
- **Descripción**: Como contador, quiero poder subir documentos soporte al expediente de devolución, para cumplir con los requisitos del SAT.
- **Rol**: Contador.
- **Criterios de aceptación**:
  1. El sistema debe permitir subir archivos y clasificarlos por tipo de documento.
  2. Los documentos deben estar vinculados al expediente correspondiente.
  3. Debe ser posible marcar documentos como completados o pendientes.

## DEV-005
- **Título**: Exportar expediente de devolución para FED.
- **Descripción**: Como PyME o despacho, quiero exportar un expediente completo con cédulas y documentación en un formato compatible con FED, para presentarlo ante el SAT.
- **Rol**: PyME / Despacho.
- **Criterios de aceptación**:
  1. El sistema debe generar un archivo ZIP con las cédulas en Excel/PDF y los documentos soporte.
  2. El archivo debe incluir un índice de documentos y un resumen ejecutivo.
  3. El archivo debe estar disponible para descarga.