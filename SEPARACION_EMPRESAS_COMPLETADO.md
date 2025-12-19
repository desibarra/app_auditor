# ✅ SEPARACIÓN POR EMPRESA + DETECCIÓN AUTOMÁTICA

**Fecha:** 2025-12-18 21:45  
**Estado:** ✅ **IMPLEMENTADO - LISTO PARA PRUEBAS**

---

## 🎯 PROBLEMA RESUELTO

**Antes:** Los CFDIs de diferentes empresas (Koppara, Juan Manuel Palacios, etc.) se mezclaban en la misma vista.

**Ahora:** 
- ✅ Detección automática de empresa por RFC
- ✅ Selector de empresa en el header
- ✅ Filtrado automático por empresa seleccionada
- ✅ Separación completa de datos por empresa

---

## 🔧 CAMBIOS IMPLEMENTADOS

### **BACKEND**

#### **1. CfdiService - Detección Automática**
**Archivo:** `apps/backend/src/modules/cfdi/cfdi.service.ts`

**Nuevo Método:**
```typescript
private async detectarEmpresa(cfdiData: CfdiData): Promise<string | null>
```

**Lógica:**
1. Busca empresa por RFC del **receptor** (si es compra)
2. Si no encuentra, busca por RFC del **emisor** (si es venta)
3. Retorna `empresaId` o `null`

**Método Actualizado:**
```typescript
async importarXml(file, empresaIdManual?)
```
- `empresaIdManual` es **opcional**
- Si no se proporciona, detecta automáticamente
- Si no puede detectar, lanza error con mensaje claro

**Nuevo Método:**
```typescript
async getEmpresas()
```
- Retorna lista de empresas activas
- Para poblar el selector

---

#### **2. CfdiController - Endpoint de Empresas**
**Archivo:** `apps/backend/src/modules/cfdi/cfdi.controller.ts`

**Nuevo Endpoint:**
```
GET /api/cfdi/empresas
Response: [{ id, rfc, razonSocial, activa }]
```

**Endpoint Actualizado:**
```
POST /api/cfdi/importar-xml?empresaId={opcional}
```
- `empresaId` ahora es **opcional**
- Detección automática si no se proporciona

---

### **FRONTEND**

#### **3. SelectorEmpresa - Nuevo Componente**
**Archivo:** `apps/frontend/src/components/SelectorEmpresa.tsx`

**Características:**
- ✅ Dropdown con lista de empresas
- ✅ Muestra: Razón Social (RFC)
- ✅ Selección automática de primera empresa
- ✅ Callback `onSeleccionar` para notificar cambios
- ✅ Estados: Loading, Error, Empty, Data

**Props:**
```typescript
{
  empresaSeleccionada: string | null;
  onSeleccionar: (empresaId: string) => void;
}
```

---

#### **4. BotonCargarXml - Detección Automática**
**Archivo:** `apps/frontend/src/components/BotonCargarXml.tsx`

**Cambios:**
- ✅ `empresaId` ahora es **opcional**
- ✅ Si no se proporciona, backend detecta automáticamente
- ✅ Mensaje actualizado para indicar detección automática

---

#### **5. DashboardPage - Integración Completa**
**Archivo:** `apps/frontend/src/pages/DashboardPage.tsx`

**Cambios:**
- ✅ Nuevo estado: `empresaSeleccionada`
- ✅ Selector de empresa en el header (lado derecho)
- ✅ Cambio de empresa → Refresca tabla de CFDIs
- ✅ Botón de carga sin `empresaId` (detección automática)
- ✅ Tabla filtrada por empresa seleccionada
- ✅ Mensaje si no hay empresa seleccionada

---

## 📊 FLUJO COMPLETO

### **Flujo de Carga de XML:**

```
1. Usuario selecciona empresa en dropdown (opcional)
   ↓
2. Usuario hace click en "Cargar XML"
   ↓
3. Selecciona archivo XML
   ↓
4. POST /api/cfdi/importar-xml (sin empresaId)
   ↓
5. Backend parsea XML
   ↓
6. Backend extrae RFC receptor y emisor
   ↓
7. Backend busca empresa por RFC receptor
   ↓
8. Si no encuentra, busca por RFC emisor
   ↓
9. Si encuentra → Asigna empresaId
   Si NO encuentra → Error: "Registra la empresa primero"
   ↓
10. INSERT en cfdi_recibidos con empresaId detectado
    ↓
11. Respuesta: { success, uuid, empresaId, empresaDetectada: true }
    ↓
12. Frontend muestra mensaje de éxito
    ↓
13. Tabla se refresca automáticamente
    ↓
14. CFDI aparece SOLO en la empresa correcta
```

---

### **Flujo de Cambio de Empresa:**

```
1. Usuario selecciona empresa en dropdown
   ↓
2. setEmpresaSeleccionada(nuevaEmpresaId)
   ↓
3. setRefreshKey(prev => prev + 1)
   ↓
4. TablaCfdiRecientes re-renderiza (key cambió)
   ↓
5. GET /api/cfdi/recientes?empresaId={nuevaEmpresaId}
   ↓
6. Tabla muestra SOLO CFDIs de esa empresa
```

---

## 🔒 REGLAS DE NEGOCIO

### **Detección de Empresa:**

1. **Si RFC receptor coincide con empresa registrada:**
   - Es un CFDI de **compra/gasto**
   - Asignar a esa empresa

2. **Si RFC emisor coincide con empresa registrada:**
   - Es un CFDI de **venta/ingreso**
   - Asignar a esa empresa

3. **Si ninguno coincide:**
   - Error: "No se pudo detectar la empresa"
   - Mensaje: "RFC Receptor: XXX, RFC Emisor: YYY"
   - Acción: "Por favor, registra la empresa primero"

---

## 🧪 CÓMO PROBAR

### **Paso 1: Verificar Empresas Registradas**
```
GET http://localhost:4000/api/cfdi/empresas
```

**Respuesta Esperada:**
```json
[
  {
    "id": "empresa-1",
    "rfc": "XAXX010101000",
    "razonSocial": "Empresa Demo 1",
    "activa": true
  },
  {
    "id": "empresa-2",
    "rfc": "YAYY020202000",
    "razonSocial": "Empresa Demo 2",
    "activa": true
  }
]
```

---

### **Paso 2: Abrir Dashboard**
```
http://localhost:3000
```

**Verificar:**
- ✅ Selector de empresa visible en header (lado derecho)
- ✅ Primera empresa seleccionada automáticamente
- ✅ Sección de CFDIs visible

---

### **Paso 3: Cargar XML de Empresa 1**
1. Asegurarse que Empresa 1 está seleccionada
2. Cargar XML donde **RFC receptor = RFC de Empresa 1**
3. Verificar mensaje: "✓ CFDI importado: ..."
4. Verificar que aparece en la tabla

---

### **Paso 4: Cambiar a Empresa 2**
1. Seleccionar Empresa 2 en dropdown
2. Tabla debe refrescarse automáticamente
3. CFDI de Empresa 1 **NO debe aparecer**
4. Tabla debe estar vacía (o mostrar solo CFDIs de Empresa 2)

---

### **Paso 5: Cargar XML de Empresa 2**
1. Cargar XML donde **RFC receptor = RFC de Empresa 2**
2. Verificar que aparece en la tabla
3. Cambiar a Empresa 1
4. Verificar que este nuevo CFDI **NO aparece** en Empresa 1

---

### **Paso 6: Probar Detección Automática**
1. Cargar XML sin seleccionar empresa específica
2. Backend debe detectar automáticamente
3. Mensaje debe indicar: "empresaDetectada: true"
4. CFDI debe aparecer en la empresa correcta

---

### **Paso 7: Probar Error de Empresa No Registrada**
1. Cargar XML con RFC que no existe en empresas
2. Debe mostrar error:
   ```
   No se pudo detectar la empresa. 
   RFC Receptor: XXX, RFC Emisor: YYY. 
   Por favor, registra la empresa primero.
   ```

---

## 📁 ARCHIVOS CREADOS/MODIFICADOS

### **Backend (2 archivos)**
- ✅ `cfdi.service.ts` (MODIFICADO)
  - Método `detectarEmpresa()` agregado
  - Método `importarXml()` actualizado
  - Método `getEmpresas()` agregado
  
- ✅ `cfdi.controller.ts` (MODIFICADO)
  - Endpoint `GET /empresas` agregado
  - `empresaId` opcional en `POST /importar-xml`

### **Frontend (3 archivos)**
- ✅ `SelectorEmpresa.tsx` (NUEVO)
- ✅ `BotonCargarXml.tsx` (MODIFICADO)
  - `empresaId` opcional
- ✅ `DashboardPage.tsx` (MODIFICADO)
  - Selector de empresa en header
  - Filtrado por empresa

---

## 🎯 PRÓXIMO PASO: EVIDENCIAS DINÁMICAS

Ahora que tenemos separación por empresa, podemos implementar el **Paso 3: Módulo de Evidencias** con:

1. ✅ Categorías dinámicas según tipo de CFDI:
   - **Ingreso:** Acuse de Recibo, Guía de Envío, Contrato de Venta
   - **Egreso:** Orden de Compra, Entregable de Servicio, Foto de Mercancía

2. ✅ Upload de evidencias vinculadas a `cfdi_uuid`

3. ✅ Transacciones S3 + BD para evitar archivos huérfanos

4. ✅ Vista de evidencias por CFDI

---

## ⚠️ NOTAS IMPORTANTES

### **Reiniciar Backend**
Los cambios en el servicio requieren reiniciar el backend:
```bash
# Detener backend (Ctrl+C)
# Reiniciar
cd apps/backend
npm run start:dev
```

### **Empresas de Prueba**
Si no hay empresas registradas, el selector estará vacío. Necesitas:
1. Tener al menos una empresa en la tabla `empresas`
2. El RFC de la empresa debe coincidir con el RFC del XML

### **Seed de Empresas**
Si necesitas empresas de prueba, puedes crear un seed:
```sql
INSERT INTO empresas (id, rfc, razon_social, activa)
VALUES 
  ('empresa-koppara', 'KOP123456789', 'Koppara SA de CV', 1),
  ('empresa-jmp', 'PAL987654321', 'Juan Manuel Palacios', 1);
```

---

**Estado:** ✅ **IMPLEMENTADO**  
**Siguiente:** PASO 3 - Módulo de Evidencias Dinámicas  
**Última Actualización:** 2025-12-18 21:45
