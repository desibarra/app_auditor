# Módulo Devoluciones de IVA

## ¿Qué hace el módulo?
El módulo "Devoluciones de IVA" está diseñado para ayudar a las PyMEs y despachos contables a preparar solicitudes de devolución de saldos a favor de IVA. Proporciona herramientas para:

- Crear expedientes de devolución asociados a una empresa y un periodo.
- Generar cédulas de trabajo automáticas, como la cédula de IVA acreditable.
- Gestionar documentación soporte y exportar expedientes en formatos compatibles con el SAT.

## Flujos principales

### 1. Creación de un expediente
- **Endpoint**: `POST /devoluciones-iva`
- **Pantalla**: Lista de Devoluciones de IVA.
- **Descripción**: Permite crear un nuevo expediente ingresando el RFC de la empresa, el periodo (YYYY-MM) y el tipo de devolución.

### 2. Listado de expedientes
- **Endpoint**: `GET /devoluciones-iva?empresaId=...`
- **Pantalla**: Lista de Devoluciones de IVA.
- **Descripción**: Muestra todos los expedientes creados para una empresa, con detalles como RFC, periodo, tipo y estado.

### 3. Detalle de un expediente
- **Endpoint**: `GET /devoluciones-iva/:id`
- **Pantalla**: Detalle de Expediente de Devolución.
- **Descripción**: Muestra los datos generales del expediente, las cédulas generadas y un resumen de montos.

### 4. Recalcular cédulas
- **Endpoint**: `POST /devoluciones-iva/:id/cedulas/recalcular`
- **Pantalla**: Detalle de Expediente de Devolución.
- **Descripción**: Permite recalcular las cédulas de un expediente, actualizando los datos según la información más reciente.

## Cómo probarlo en entorno local

### Backend
1. Asegúrate de que el backend esté corriendo en `http://localhost:3000`.
2. Endpoints clave:
   - `POST /devoluciones-iva`: Crear un expediente.
   - `GET /devoluciones-iva`: Listar expedientes.
   - `GET /devoluciones-iva/:id`: Obtener detalle de un expediente.
   - `POST /devoluciones-iva/:id/cedulas/recalcular`: Recalcular cédulas.

### Frontend
1. Inicia el frontend con `npm start` o `pnpm start`.
2. Navega a la página de "Devoluciones de IVA".
3. Flujos clave:
   - Crear un nuevo expediente desde la lista.
   - Ver el detalle de un expediente y recalcular cédulas.

## Notas adicionales
- **Datos dummy**: Actualmente, las cédulas de IVA acreditable utilizan datos de prueba. Esto debe reemplazarse con datos reales en producción.
- **Logs**: El backend registra acciones clave como la creación de expedientes, el recálculo de cédulas y la exportación de expedientes.
- **Validaciones**: Los formularios en el frontend incluyen validaciones amigables para garantizar que los datos ingresados sean correctos.