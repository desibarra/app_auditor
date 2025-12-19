# 🎯 CENTRO DE GESTIÓN DE MATERIALIDAD - PLAN DE IMPLEMENTACIÓN

**Fecha:** 2025-12-18 22:24  
**Estado:** 📋 **PLANIFICADO - INICIANDO IMPLEMENTACIÓN**

---

## 🎯 OBJETIVO PRINCIPAL

Transformar "CFDIs Recientes" en un **Centro de Gestión de Materialidad** completo que permita:
- Ver historial completo con paginación
- Gestionar evidencias por CFDI
- Visualizar detalle fiscal
- Eliminar registros erróneos
- Filtrar y buscar CFDIs
- Indicador visual de materialidad

---

## 📋 FUNCIONALIDADES A IMPLEMENTAR

### **1. Paginación e Historial Completo**
- ✅ Backend ya tiene `getAllCfdis()` con paginación
- ⏳ Agregar botón "Cargar más" o paginación
- ⏳ Mostrar todos los registros, no solo 10

### **2. Panel de Materialidad (Drawer)**
Al click en fila, abrir drawer con:
- Detalle fiscal (impuestos IVA/ISR)
- Gestión de evidencias (upload/view)
- Botón eliminar CFDI
- Indicador de completitud

### **3. Indicador de Avance**
Nueva columna en tabla:
- 🟢 Verde: Materialidad completa (tiene evidencias)
- 🟡 Amarillo: Materialidad parcial
- 🔴 Rojo: Sin evidencias

### **4. Filtro de Búsqueda**
Buscador arriba de la tabla:
- Por RFC emisor
- Por UUID/Folio
- Búsqueda en tiempo real

---

## 🏗️ ARQUITECTURA

```
TablaCfdiRecientes.tsx (ACTUALIZADO)
├── Header
│   ├── Título
│   ├── Buscador (RFC/UUID)
│   └── Botones (Actualizar, Filtros)
│
├── Tabla Principal
│   ├── Columnas:
│   │   ├── Materialidad (🟢🟡🔴)
│   │   ├── Fecha
│   │   ├── Emisor
│   │   ├── RFC
│   │   ├── Tipo
│   │   ├── Total
│   │   └── Estado SAT
│   │
│   ├── Click en fila → Abre Drawer
│   └── Hover → Resaltar
│
├── Paginación
│   ├── Botón "Cargar más"
│   └── Indicador: "Mostrando X de Y"
│
└── Drawer de Materialidad
    ├── Header
    │   ├── UUID
    │   ├── Botón cerrar
    │   └── Botón eliminar 🗑️
    │
    ├── Sección 1: Información General
    │   ├── Emisor (RFC + Nombre)
    │   ├── Receptor (RFC + Nombre)
    │   ├── Fecha, Tipo, Moneda
    │   └── Total
    │
    ├── Sección 2: Detalle Fiscal
    │   ├── Tabla de Impuestos
    │   ├── IVA Trasladado
    │   ├── ISR Retenido
    │   └── Otros impuestos
    │
    ├── Sección 3: Evidencias
    │   ├── Lista de documentos adjuntos
    │   ├── Botón "Subir Evidencia"
    │   ├── Preview de archivos
    │   └── Botón eliminar por evidencia
    │
    └── Footer
        ├── Indicador de completitud
        └── Botón "Cerrar"
```

---

## 🔧 COMPONENTES A CREAR/MODIFICAR

### **Backend (Ya existe):**
- ✅ `getAllCfdis()` - Paginación
- ✅ `getCfdiDetalle()` - Detalle + impuestos
- ✅ `deleteCfdi()` - Eliminar
- ⏳ Endpoint para contar evidencias por CFDI

### **Frontend:**

#### **Modificar:**
- `TablaCfdiRecientes.tsx`
  - Cambiar a paginación completa
  - Agregar columna de materialidad
  - Agregar buscador
  - Click en fila abre drawer

#### **Crear:**
- `DrawerMaterialidad.tsx`
  - Panel lateral deslizable
  - Detalle fiscal
  - Gestión de evidencias
  - Botón eliminar

- `IndicadorMaterialidad.tsx`
  - Componente visual (🟢🟡🔴)
  - Tooltip con info

---

## 📊 FLUJO DE USUARIO

```
1. Usuario ve tabla con todos los CFDIs
   ↓
2. Columna "Materialidad" muestra:
   - 🔴 Sin evidencias (mayoría)
   - 🟡 Evidencias parciales
   - 🟢 Completo
   ↓
3. Usuario busca RFC específico
   ↓
4. Tabla se filtra en tiempo real
   ↓
5. Usuario click en fila con 🔴
   ↓
6. Drawer se abre desde la derecha
   ↓
7. Muestra:
   - Info del CFDI
   - Impuestos desglosados
   - Sección "Evidencias: 0 documentos"
   ↓
8. Usuario click en "Subir Evidencia"
   ↓
9. Modal de upload se abre
   ↓
10. Usuario selecciona:
    - Tipo: "Contrato de Compra"
    - Archivo: contrato.pdf
    ↓
11. Upload exitoso
    ↓
12. Drawer se actualiza:
    - "Evidencias: 1 documento"
    - Preview de contrato.pdf
    ↓
13. Indicador cambia a 🟡
    ↓
14. Usuario sube más evidencias
    ↓
15. Indicador cambia a 🟢
    ↓
16. Usuario cierra drawer
    ↓
17. Tabla muestra 🟢 en esa fila
```

---

## 🎨 DISEÑO UI/UX

### **Indicadores de Materialidad:**
```
🔴 Sin evidencias
   Tooltip: "0 documentos - Requiere materialización"

🟡 Parcial (1-2 docs)
   Tooltip: "2 documentos - Materialización incompleta"

🟢 Completo (3+ docs)
   Tooltip: "5 documentos - Materialización completa"
```

### **Drawer:**
- Ancho: 600px
- Animación: Slide desde derecha
- Overlay: Semi-transparente
- Scroll: Interno si contenido largo

### **Buscador:**
- Placeholder: "Buscar por RFC o UUID..."
- Búsqueda: Tiempo real (debounce 300ms)
- Icono: 🔍

---

## 🔒 LÓGICA DE MATERIALIDAD

### **Criterios de Completitud:**

```typescript
function calcularMaterialidad(numEvidencias: number): 'completo' | 'parcial' | 'vacio' {
  if (numEvidencias >= 3) return 'completo';  // 🟢
  if (numEvidencias > 0) return 'parcial';    // 🟡
  return 'vacio';                              // 🔴
}
```

### **Tipos de Evidencia Requeridos:**
- Contrato o Pedido
- Comprobante de Pago
- Entregable o Foto de Mercancía

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
apps/frontend/src/
├── components/
│   ├── TablaCfdiRecientes.tsx (MODIFICAR)
│   ├── DrawerMaterialidad.tsx (CREAR)
│   ├── IndicadorMaterialidad.tsx (CREAR)
│   └── BuscadorCfdi.tsx (CREAR - opcional)
│
└── pages/
    └── DashboardPage.tsx (sin cambios)
```

---

## 🚀 ORDEN DE IMPLEMENTACIÓN

### **Fase 1: Backend (5 min)**
1. ✅ Endpoints ya existen
2. ⏳ Agregar endpoint para contar evidencias

### **Fase 2: Componentes Base (15 min)**
1. Crear `IndicadorMaterialidad.tsx`
2. Crear `DrawerMaterialidad.tsx` (estructura)
3. Modificar `TablaCfdiRecientes.tsx` (paginación)

### **Fase 3: Integración (15 min)**
1. Agregar columna de materialidad
2. Agregar buscador
3. Conectar drawer con click

### **Fase 4: Detalle Fiscal (10 min)**
1. Fetch de detalle al abrir drawer
2. Mostrar impuestos
3. Formatear datos

### **Fase 5: Evidencias (Paso 3)**
1. Upload de evidencias
2. Lista de evidencias
3. Preview de archivos

---

## ⏱️ TIEMPO ESTIMADO

- **Fase 1-4:** 45 minutos
- **Fase 5:** Paso 3 completo (siguiente)

---

## 📝 NOTAS

### **Prioridades:**
1. ✅ Paginación e historial completo
2. ✅ Drawer con detalle fiscal
3. ✅ Indicador de materialidad
4. ✅ Buscador
5. ⏳ Evidencias (Paso 3)

### **Decisión:**
Implementar Fases 1-4 ahora (estructura completa)
Dejar Fase 5 (evidencias) para Paso 3

---

**Estado:** 📋 **PLANIFICADO**  
**Siguiente:** Implementar Fases 1-4  
**Última Actualización:** 2025-12-18 22:24
