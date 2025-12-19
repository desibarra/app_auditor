# ✅ MÓDULO DE EXPEDIENTES - BACKEND COMPLETADO

**Fecha:** 2025-12-19 13:35  
**Estado:** ✅ **BACKEND FUNCIONAL CON VALIDACIONES FISCALES**

---

## 🎯 OBJETIVO COMPLETADO

Se ha implementado exitosamente el **backend completo del Módulo de Expedientes de Devolución de IVA** con todas las validaciones fiscales y reglas de negocio necesarias para asegurar expedientes legalmente sólidos.

---

## 📦 LO QUE SE HA IMPLEMENTADO

### **1. Esquema de Base de Datos** ✅

#### **Tabla: expedientes_devolucion_iva**
**Ubicación:** `apps/backend/src/database/schema/expedientes_devolucion.schema.ts`

**Campos Principales:**
- `id` - ID autoincremental
- `empresaId` - Relación con empresa
- `folio` - Folio único (DEV-202512-001)
- `nombre` - Nombre del expediente
- `montoTotalIva` - Total de IVA a recuperar
- `montoTotalFacturas` - Total de facturas
- `cantidadCfdis` - Número de CFDIs incluidos
- `estado` - borrador, enviado, en_revision, aprobado, rechazado, completado
- `fechaCreacion`, `fechaEnvio`, `fechaRespuesta`, `fechaCompletado`
- `observaciones`, `respuestaSat`, `archivoSolicitud`

#### **Tabla: expediente_cfdi** (Relación Muchos a Muchos)
**Campos:**
- `id` - ID autoincremental
- `expedienteId` - FK a expedientes_devolucion_iva
- `cfdiUuid` - UUID del CFDI
- `ivaAcreditable` - IVA de este CFDI específico
- `fechaAgregado`, `agregadoPor`

---

### **2. Servicio de Expedientes** ✅

#### **ExpedientesService**
**Ubicación:** `apps/backend/src/modules/expedientes/expedientes.service.ts`

**Métodos Implementados:**

##### **`crearExpediente(dto)`** ⭐ CRÍTICO
**Validaciones Implementadas:**
1. ✅ Valida que haya CFDIs seleccionados
2. ✅ **VALIDACIÓN FISCAL:** Verifica materialidad de CADA CFDI
3. ✅ Solo permite CFDIs con 🟢 (3+ evidencias)
4. ✅ Rechaza CFDIs con 🔴 (0 evidencias) o 🟡 (1-2 evidencias)
5. ✅ Calcula IVA total automáticamente
6. ✅ Genera folio único
7. ✅ Crea expediente y relaciones en transacción

**Flujo:**
```
1. Validar CFDIs seleccionados
2. Para cada CFDI:
   - Contar evidencias completadas
   - Si < 3 → Agregar a lista de inválidos
3. Si hay inválidos → Lanzar error con detalles
4. Obtener datos de CFDIs válidos
5. Calcular IVA total (trasladado - retenido)
6. Generar folio (DEV-YYYYMM-NNN)
7. Insertar expediente
8. Insertar relaciones CFDI-Expediente
9. Retornar expediente creado
```

**Ejemplo de Error:**
```
BadRequestException: No se puede crear el expediente. 
Los siguientes CFDIs no tienen materialidad completa (requieren 3+ evidencias): 
ABC123-XYZ (1 evidencias), DEF456-UVW (0 evidencias)
```

---

##### **`validarMaterialidadCfdis(cfdiUuids)` (privado)**
**Función:** Validación crítica de materialidad

**Lógica:**
```sql
Para cada UUID:
  SELECT COUNT(*) 
  FROM documentos_soporte
  WHERE cfdi_uuid = ? 
    AND estado = 'completado'
  
  Si count < 3:
    Agregar a lista de inválidos
```

**Retorna:**
```typescript
{
  todosValidos: boolean,
  cfdisInvalidos: [
    {
      uuid: string,
      numEvidencias: number,
      estatusMaterialidad: '🔴' | '🟡'
    }
  ]
}
```

---

##### **`obtenerDatosCfdis(cfdiUuids)` (privado)**
**Función:** Obtiene datos y calcula IVA acreditable

**Cálculo de IVA:**
```typescript
IVA Total = IVA Trasladado - IVA Retenido

Para cada impuesto:
  Si tipo === 'traslado' && impuesto === '002':
    totalIva += importe
  Si tipo === 'retencion' && impuesto === '002':
    totalIva -= importe
```

**Retorna:**
```typescript
[
  {
    uuid: string,
    folio: string,
    fecha: string,
    emisorRfc: string,
    emisorNombre: string,
    total: number,
    totalIva: number  // ← Calculado
  }
]
```

---

##### **`generarFolio(empresaId)` (privado)**
**Función:** Genera folio único secuencial

**Formato:** `DEV-YYYYMM-NNN`

**Ejemplo:**
```
DEV-202512-001
DEV-202512-002
DEV-202601-001  // Nuevo mes
```

---

##### **`getDetalleExpediente(expedienteId)`**
**Función:** Obtiene expediente completo con CFDIs y evidencias

**Retorna:**
```typescript
{
  expediente: {
    id, folio, nombre, descripcion,
    montoTotalIva, montoTotalFacturas,
    cantidadCfdis, estado,
    fechaCreacion, fechaEnvio, observaciones
  },
  cfdis: [
    {
      uuid, folio, fecha, emisorRfc, emisorNombre,
      total, ivaAcreditable,
      evidencias: [
        { id, categoria, descripcion, archivo, fechaSubida }
      ],
      numEvidencias,
      estatusMaterialidad: '🟢' | '🟡' | '🔴'
    }
  ],
  resumen: {
    totalCfdis,
    totalIvaRecuperable,
    totalFacturas,
    totalEvidencias
  }
}
```

---

##### **`listarExpedientes(empresaId)`**
**Función:** Lista todos los expedientes de una empresa

**Retorna:**
```typescript
[
  {
    id, folio, nombre,
    montoTotalIva, cantidadCfdis,
    estado, fechaCreacion
  }
]
```

---

##### **`actualizarEstado(expedienteId, nuevoEstado, observaciones?)`**
**Función:** Actualiza el estado del expediente

**Estados Permitidos:**
- `borrador` - Recién creado
- `enviado` - Enviado al SAT
- `en_revision` - En revisión por el SAT
- `aprobado` - Aprobado por el SAT
- `rechazado` - Rechazado por el SAT
- `completado` - Devolución completada

**Actualiza Fechas:**
- `enviado` → `fechaEnvio`
- `completado` → `fechaCompletado`

---

### **3. Controlador de Expedientes** ✅

#### **ExpedientesController**
**Ubicación:** `apps/backend/src/modules/expedientes/expedientes.controller.ts`

**Endpoints Implementados:**

##### **POST /api/expedientes**
**Función:** Crea un nuevo expediente

**Request Body:**
```json
{
  "empresaId": "empresa-123",
  "nombre": "Devolución IVA - Noviembre 2025",
  "descripcion": "Expediente de devolución del mes de noviembre",
  "cfdiUuids": [
    "ABC123-XYZ-456",
    "DEF789-UVW-012"
  ],
  "creadoPor": "usuario@empresa.com"
}
```

**Response:**
```json
{
  "success": true,
  "expediente": {
    "id": 1,
    "folio": "DEV-202512-001",
    "nombre": "Devolución IVA - Noviembre 2025",
    "montoTotalIva": 125000.50,
    "montoTotalFacturas": 850000.00,
    "cantidadCfdis": 15,
    "estado": "borrador",
    "fechaCreacion": "2025-12-19T13:30:00.000Z"
  },
  "cfdisIncluidos": 15
}
```

**Validaciones:**
- ✅ `empresaId` requerido
- ✅ `nombre` requerido
- ✅ `cfdiUuids` debe ser array no vacío
- ✅ Cada CFDI debe tener 3+ evidencias (validado en servicio)

---

##### **GET /api/expedientes?empresaId=xxx**
**Función:** Lista expedientes de una empresa

**Response:**
```json
[
  {
    "id": 1,
    "folio": "DEV-202512-001",
    "nombre": "Devolución IVA - Noviembre 2025",
    "montoTotalIva": 125000.50,
    "cantidadCfdis": 15,
    "estado": "borrador",
    "fechaCreacion": "2025-12-19T13:30:00.000Z"
  }
]
```

---

##### **GET /api/expedientes/:id**
**Función:** Obtiene detalle completo del expediente

**Response:** (Ver estructura en `getDetalleExpediente`)

---

##### **PUT /api/expedientes/:id/estado**
**Función:** Actualiza el estado del expediente

**Request Body:**
```json
{
  "estado": "enviado",
  "observaciones": "Expediente enviado al SAT el 19/12/2025"
}
```

**Response:**
```json
{
  "success": true,
  "nuevoEstado": "enviado"
}
```

---

### **4. Módulo Actualizado** ✅

#### **ExpedientesModule**
**Ubicación:** `apps/backend/src/modules/expedientes/expedientes.module.ts`

**Configuración:**
- ✅ Importa `DatabaseModule`
- ✅ Registra `ExpedientesController`
- ✅ Registra `ExpedientesService`
- ✅ Exporta `ExpedientesService`

---

## 🔒 VALIDACIONES FISCALES IMPLEMENTADAS

### **1. Materialidad Completa (CRÍTICO)**
```
✅ Solo CFDIs con 🟢 (3+ evidencias)
❌ Rechaza CFDIs con 🔴 (0 evidencias)
❌ Rechaza CFDIs con 🟡 (1-2 evidencias)
```

### **2. Cálculo Preciso de IVA**
```
✅ IVA Trasladado (código 002)
✅ IVA Retenido (código 002)
✅ Cálculo: Trasladado - Retenido
```

### **3. Trazabilidad Completa**
```
✅ Folio único por expediente
✅ Registro de quién creó
✅ Registro de quién agregó cada CFDI
✅ Fechas de cada cambio de estado
```

### **4. Integridad de Datos**
```
✅ Relaciones con CASCADE
✅ Validación de estados permitidos
✅ Transacciones para crear expediente
```

---

## 📊 FLUJO COMPLETO DE NEGOCIO

```
Usuario selecciona CFDIs en frontend
  ↓
POST /api/expedientes
  ↓
Backend valida materialidad de CADA CFDI
  ↓
Si alguno tiene < 3 evidencias:
  → Error con lista de CFDIs inválidos
  → Usuario debe agregar evidencias
  ↓
Si todos tienen 3+ evidencias:
  → Obtener datos de CFDIs
  → Calcular IVA total
  → Generar folio único
  → Crear expediente
  → Crear relaciones CFDI-Expediente
  → Retornar expediente creado
  ↓
Usuario puede:
  - Ver detalle del expediente
  - Revisar CFDIs incluidos
  - Ver evidencias de cada CFDI
  - Cambiar estado a "enviado"
  - Agregar observaciones
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### **Backend**
- [x] Crear esquema `expedientes_devolucion.schema.ts`
- [x] Crear tabla `expedientes_devolucion_iva`
- [x] Crear tabla `expediente_cfdi`
- [x] Exportar en schema/index.ts
- [x] Crear `ExpedientesService`
- [x] Implementar `crearExpediente()`
- [x] Implementar validación de materialidad
- [x] Implementar cálculo de IVA
- [x] Implementar `getDetalleExpediente()`
- [x] Implementar `listarExpedientes()`
- [x] Implementar `actualizarEstado()`
- [x] Crear `ExpedientesController`
- [x] Endpoint POST /api/expedientes
- [x] Endpoint GET /api/expedientes
- [x] Endpoint GET /api/expedientes/:id
- [x] Endpoint PUT /api/expedientes/:id/estado
- [x] Actualizar `ExpedientesModule`

---

## 🎯 PRÓXIMOS PASOS

### **Frontend - Selección Múltiple** (45 min)
1. Agregar checkboxes en `TablaCfdiRecientes`
2. Estado para CFDIs seleccionados
3. Botón "Generar Expediente"
4. Validación visual (solo 🟢)
5. Modal de confirmación con monto total
6. Integración con POST /api/expedientes

---

## 🎊 RESULTADO FINAL

### **Backend Completado**
✅ **Validación fiscal** automática de materialidad  
✅ **Cálculo preciso** de IVA acreditable  
✅ **Trazabilidad completa** de expedientes  
✅ **API REST** completa y documentada  
✅ **Reglas de negocio** implementadas  

### **Beneficios**
✅ **Seguridad jurídica** - Solo expedientes con evidencias completas  
✅ **Automatización** - Cálculo automático de montos  
✅ **Auditoría** - Registro completo de cambios  
✅ **Escalabilidad** - Preparado para múltiples empresas  

---

**Estado:** ✅ BACKEND COMPLETADO  
**Siguiente:** Frontend de Selección Múltiple  
**Última Actualización:** 2025-12-19 13:35
