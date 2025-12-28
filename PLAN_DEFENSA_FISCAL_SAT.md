# 🛡️ PLAN DE TRANSFORMACIÓN: DEFENSA FISCAL SAT

**Fecha**: 21 de Diciembre de 2025  
**Objetivo**: Convertir Kontify en herramienta profesional de defensa fiscal

---

## 🎯 OBJETIVO PRINCIPAL

Transformar la plataforma en un sistema profesional que:

1. ✅ Evite confusión o pánico del usuario
2. ✅ Distinga claramente INGRESOS, EGRESOS, NÓMINA, CARTA PORTE, COMPLEMENTOS
3. ✅ Arme expedientes de materialidad listos para devolución de IVA
4. ✅ Permita auditoría 1x1 real con visor XML guiado
5. ✅ Mantenga consistencia visual y funcional en TODAS las páginas

---

## 📋 BLOQUES DE IMPLEMENTACIÓN

### ✅ BLOQUE 1 – VISOR XML FORENSE (COMPLETADO)

**Status**: ✅ IMPLEMENTADO

**Componentes Creados**:
- `XmlVisorForense.tsx` - Visor principal con índice guiado
- `CartaPorteResumen.tsx` - Resumen ejecutivo de Carta Porte
- `XmlVisorModal.tsx` - Wrapper de compatibilidad

**Funcionalidades**:
- ✅ Índice guiado por secciones (panel izquierdo)
- ✅ Navegación inteligente (click → scroll + highlight)
- ✅ Badge fiscal superior (INGRESO, EGRESO, NÓMINA, PAGO, CARTA PORTE)
- ✅ Detección automática de complementos
- ✅ Resumen ejecutivo de Carta Porte

**Pendiente**:
- 🔄 Integrar badge fiscal en modal de auditoría 1x1
- 🔄 Agregar detección de Nómina y Comercio Exterior

---

### 🚧 BLOQUE 2 – CARTA PORTE / DODA / AUTOTRANSPORTE

**Status**: 🔄 EN PROGRESO

**Objetivos**:
1. Panel de requerimientos SAT cuando se detecte Carta Porte
2. Checklist de evidencias:
   - Contrato de arrendamiento
   - Fotos de unidad
   - Licencia operador
   - GPS / bitácora
   - DODA / Pedimento (si aplica)
3. Explicación clara de DODA/Entry

**Componentes a Crear**:
- `CartaPorteRequisitos.tsx` - Panel de requerimientos SAT
- `DODAExplicacion.tsx` - Componente educativo
- Integración con módulo de evidencias

---

### 🚧 BLOQUE 3 – EXPEDIENTE DE MATERIALIDAD (IVA)

**Status**: ⏳ PENDIENTE

**Objetivos**:
1. Modo especial "Expediente SAT – Devolución de IVA"
2. Checklist automático por CFDI:
   - XML ✔
   - Pago ✔
   - Contrato ✔
   - Evidencias ✔
3. Semáforo final:
   - 🟢 DEFENDIBLE
   - 🟡 RIESGO
   - 🔴 RECHAZO SEGURO

**Componentes a Crear**:
- `ExpedienteMaterialidad.tsx` - Vista principal
- `ChecklistCFDI.tsx` - Checklist por factura
- `SemaforoDefendibilidad.tsx` - Indicador de riesgo

---

### 🚧 BLOQUE 4 – AUDITORÍA 1x1 (TABLA DETALLE)

**Status**: 🔄 EN PROGRESO

**Objetivos**:
1. Modal de auditoría 1x1 mejorado
2. Columnas EXACTAS:
   - Fecha (sin hora)
   - RFC Emisor
   - RFC Receptor
   - UUID
   - Tipo CFDI
   - Moneda
   - Importe MXN
   - Importe USD (si aplica)
   - Status
   - Acciones (👁 XML | 📂 Evidencias)

**Funcionalidades**:
- Ordenar por monto
- Paginación (10/25/50/100)
- Filtros avanzados
- Exportación REAL a Excel (.xlsx)

**Componentes a Crear/Modificar**:
- `ModalAuditoria1x1.tsx` - Modal completo
- `TablaDetalleAuditoria.tsx` - Tabla con todas las columnas
- Servicio de exportación Excel

---

### 🚧 BLOQUE 5 – UX/UI CORPORATIVO (GLOBAL)

**Status**: 🔄 EN PROGRESO

**Objetivos**:
1. Menú lateral izquierdo fijo (estilo OneFacture o mejor)
   - Fondo oscuro (negro + verde)
   - Alto contraste
   - Tipografía legible
2. Consistencia en TODAS las páginas:
   - Mismo diseño
   - Misma navegación
   - KPIs siempre visibles
3. KPIs dinámicos:
   - Cambiar según periodo seleccionado
   - Mostrar totales claros
   - Nunca quedar en blanco sin explicación

**Componentes a Crear/Modificar**:
- `SidebarNavigation.tsx` - Menú lateral fijo
- `GlobalLayout.tsx` - Layout consistente
- Actualizar todas las páginas para usar el nuevo layout

---

### 🚧 BLOQUE 6 – METADATOS SAT

**Status**: ⏳ PENDIENTE

**Objetivos**:
1. Mostrar siempre:
   - Régimen fiscal empresa
   - Uso CFDI
   - Giro (ej. Autotransporte)
   - Claves SAT proveedor / cliente
2. Alertar si no coinciden

**Componentes a Crear**:
- `MetadatosSAT.tsx` - Panel de metadatos
- `AlertaInconsistencia.tsx` - Alertas de discrepancias

---

## 🧩 REGLAS OBLIGATORIAS (NO NEGOCIABLES)

### 1. Nunca ocultes tablas aunque no haya resultados

```tsx
// ❌ MAL
{data.length > 0 && <Table data={data} />}

// ✅ BIEN
<Table data={data} />
{data.length === 0 && <EmptyState message="No hay datos para el periodo seleccionado" />}
```

### 2. Distingue SIEMPRE entre estados

```tsx
// Estados distintos:
- ❌ Filtro sin resultados → "No se encontraron CFDIs para este periodo"
- ❌ Error de conexión → "Error al cargar datos. Verifique su conexión"
- ❌ Base de datos vacía → "No hay CFDIs registrados. Importe archivos XML"
```

### 3. Un dominio = una verdad

```tsx
// No mezclar datos de diferentes dominios
// Cada endpoint debe tener su propia fuente de verdad
const emitidosIngresos = useQuery('/api/cfdi/emitidos/ingresos');
const recibidosGastos = useQuery('/api/cfdi/recibidos/gastos');
```

### 4. Nada se borra de XML existentes

- Los XMLs originales son inmutables
- Cualquier modificación debe ser en metadatos
- Mantener trazabilidad completa

### 5. Todo cambio debe poder demostrarse en la UI

- No solo decir "ya está"
- Captura de pantalla o video
- Prueba con datos reales

---

## 📊 ARQUITECTURA DE BADGES FISCALES

### Tipos de CFDI y sus Badges

```tsx
const BADGES_FISCALES = {
  // INGRESOS
  'I': {
    label: 'INGRESO GRAVADO',
    color: 'green',
    icon: '🟢',
    descripcion: 'Factura de venta o servicio prestado'
  },
  
  // EGRESOS
  'E': {
    label: 'EGRESO DEDUCIBLE',
    color: 'blue',
    icon: '🔵',
    descripcion: 'Nota de crédito o devolución'
  },
  
  // NÓMINA
  'N': {
    label: 'NÓMINA',
    color: 'purple',
    icon: '🟣',
    descripcion: 'Recibo de nómina de empleado'
  },
  
  // PAGO
  'P': {
    label: 'COMPLEMENTO DE PAGO',
    color: 'gray',
    icon: '⚪',
    descripcion: 'Comprobante de pago relacionado'
  },
  
  // TRASLADO
  'T': {
    label: 'TRASLADO',
    color: 'yellow',
    icon: '🟡',
    descripcion: 'Traslado de mercancías sin venta'
  }
};

// COMPLEMENTOS ESPECIALES
const COMPLEMENTOS_ESPECIALES = {
  'CARTA_PORTE': {
    label: 'CARTA PORTE',
    color: 'orange',
    icon: '🚚',
    descripcion: 'Transporte de mercancías - Requiere evidencias'
  },
  
  'COMERCIO_EXTERIOR': {
    label: 'COMERCIO EXTERIOR',
    color: 'red',
    icon: '🌎',
    descripcion: 'Operación de importación/exportación'
  },
  
  'NOMINA': {
    label: 'NÓMINA 1.2',
    color: 'indigo',
    icon: '💼',
    descripcion: 'Complemento de nómina'
  }
};
```

---

## 🔧 COMPONENTES CLAVE A CREAR

### 1. BadgeFiscal.tsx

```tsx
interface BadgeFiscalProps {
  tipo: 'I' | 'E' | 'N' | 'P' | 'T';
  complementos?: string[];
  size?: 'sm' | 'md' | 'lg';
}

// Muestra el badge principal + badges de complementos
```

### 2. ModalAuditoria1x1.tsx

```tsx
interface ModalAuditoria1x1Props {
  mes: string;
  empresaId: string;
  dominio: 'emitidos' | 'recibidos';
  tipo: 'ingresos' | 'egresos' | 'nomina' | 'pagos';
}

// Modal completo con tabla detallada
// Columnas: Fecha, RFC Emisor, RFC Receptor, UUID, Tipo, Moneda, Importe MXN, Importe USD, Status, Acciones
```

### 3. ExpedienteMaterialidad.tsx

```tsx
interface ExpedienteMaterialidadProps {
  cfdiUuid: string;
  tipoDevolucion: 'IVA' | 'ISR';
}

// Checklist de evidencias
// Semáforo de defendibilidad
// Panel de requerimientos SAT
```

### 4. SidebarNavigation.tsx

```tsx
// Menú lateral fijo con:
// - Logo
// - Selector de empresa
// - Navegación principal
// - Estado SAT
// - Alertas fiscales
```

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
apps/frontend/src/
├── components/
│   ├── fiscal/
│   │   ├── BadgeFiscal.tsx ⭐ NUEVO
│   │   ├── MetadatosSAT.tsx ⭐ NUEVO
│   │   ├── AlertaInconsistencia.tsx ⭐ NUEVO
│   │   └── SemaforoDefendibilidad.tsx ⭐ NUEVO
│   │
│   ├── auditoria/
│   │   ├── ModalAuditoria1x1.tsx ⭐ NUEVO
│   │   ├── TablaDetalleAuditoria.tsx ⭐ NUEVO
│   │   └── FiltrosAvanzados.tsx ⭐ NUEVO
│   │
│   ├── materialidad/
│   │   ├── ExpedienteMaterialidad.tsx ⭐ NUEVO
│   │   ├── ChecklistCFDI.tsx ⭐ NUEVO
│   │   ├── CartaPorteRequisitos.tsx ⭐ NUEVO
│   │   └── DODAExplicacion.tsx ⭐ NUEVO
│   │
│   ├── layout/
│   │   ├── SidebarNavigation.tsx ⭐ NUEVO
│   │   ├── GlobalLayout.tsx ⭐ NUEVO
│   │   └── TopBar.tsx ⭐ NUEVO
│   │
│   ├── xml/
│   │   ├── XmlVisorForense.tsx ✅ EXISTENTE
│   │   ├── CartaPorteResumen.tsx ✅ EXISTENTE
│   │   └── XmlVisorModal.tsx ✅ EXISTENTE
│   │
│   └── ... (componentes existentes)
│
├── pages/
│   ├── DashboardPage.tsx (actualizar layout)
│   ├── ExpedientesPage.tsx (actualizar layout)
│   ├── BancosPage.tsx (actualizar layout)
│   └── ... (actualizar todas las páginas)
│
└── utils/
    ├── badgesFiscales.ts ⭐ NUEVO
    ├── exportExcel.ts ⭐ NUEVO
    └── validacionesSAT.ts ⭐ NUEVO
```

---

## 🧪 VALIDACIÓN FINAL OBLIGATORIA

Antes de decir "listo", DEBES:

1. ✅ Ejecutar la plataforma
2. ✅ Subir XML reales (noviembre incluido)
3. ✅ Demostrar:
   - Que los XML existen
   - Que los meses aparecen
   - Que "Auditar 1x1" lista los CFDI
   - Que los badges fiscales se muestran correctamente
   - Que el visor XML funciona
   - Que la exportación a Excel funciona

Si algo falla → detente y repórtalo.

---

## 🚫 PROHIBIDO

1. ❌ Decir "ya está" sin prueba visual
2. ❌ Ocultar errores como "sin datos"
3. ❌ Cambiar diseño sin criterio contable
4. ❌ Optimizar estética sacrificando claridad
5. ❌ Mezclar datos de diferentes dominios
6. ❌ Borrar o modificar XMLs originales

---

## 📈 PRIORIDADES DE IMPLEMENTACIÓN

### Fase 1 (INMEDIATA) - Fundamentos
1. ✅ Visor XML Forense (COMPLETADO)
2. 🔄 Badge Fiscal en todos los componentes
3. 🔄 Modal Auditoría 1x1 completo
4. 🔄 Sidebar Navigation global

### Fase 2 (CORTO PLAZO) - Materialidad
1. ⏳ Expediente de Materialidad
2. ⏳ Carta Porte Requisitos
3. ⏳ DODA Explicación
4. ⏳ Metadatos SAT

### Fase 3 (MEDIANO PLAZO) - Refinamiento
1. ⏳ Exportación Excel avanzada
2. ⏳ Filtros avanzados
3. ⏳ Alertas de inconsistencias
4. ⏳ Semáforo de defendibilidad

---

## 📝 NOTAS TÉCNICAS

### Endpoints Backend Necesarios

```typescript
// CFDI Detalle para Auditoría 1x1
GET /api/cfdi/detalle-mes/:empresaId/:mes/:dominio/:tipo
Response: {
  cfdis: [
    {
      fecha: string,
      rfcEmisor: string,
      rfcReceptor: string,
      uuid: string,
      tipoCfdi: string,
      moneda: string,
      importeMxn: number,
      importeUsd: number,
      status: string,
      complementos: string[]
    }
  ],
  total: number,
  totalMxn: number,
  totalUsd: number
}

// Metadatos SAT
GET /api/cfdi/metadatos/:uuid
Response: {
  regimenFiscal: string,
  usoCfdi: string,
  giro: string,
  clavesSat: {
    emisor: string,
    receptor: string
  },
  inconsistencias: string[]
}

// Expediente Materialidad
GET /api/materialidad/expediente/:uuid
Response: {
  checklist: {
    xml: boolean,
    pago: boolean,
    contrato: boolean,
    evidencias: boolean
  },
  semaforo: 'DEFENDIBLE' | 'RIESGO' | 'RECHAZO',
  requisitos: string[],
  evidenciasFaltantes: string[]
}
```

---

**Status Global**: 🔄 EN PROGRESO  
**Completado**: 20%  
**Próximo Paso**: Implementar Badge Fiscal y Modal Auditoría 1x1
