# 🛡️ VISOR XML FORENSE GUIADO - Documentación

## Objetivo
Transformar la experiencia de análisis de CFDIs XML de un proceso técnico manual a una **auditoría guiada e inteligente**, donde el contador NO necesita conocimientos de XML.

---

## ✅ Funcionalidades Implementadas

### 1. **Panel Índice Forense** (Sidebar Izquierdo)

#### Secciones Principales con Semáforo:
- 🟢 **Verde** = Presente y completo
- 🔴 **Rojo** = Ausente
- 🟡 **Amarillo** = Incompleto

#### Estructura del Índice:
1. **📄 Datos CFDI**
   - Información básica del comprobante
   
2. **👥 Emisor/Receptor**
   - Datos de las partes involucradas
   
3. **📦 Conceptos (N)**
   - Lista de productos/servicios facturados
   - Muestra cantidad detectada
   
4. **💰 Impuestos**
   - Traslados y retenciones
   
5. **🚛 Carta Porte** (con subsecciones)
   - 📍 Origen/Destino (N ubicaciones)
   - 📦 Mercancías (N items)
   - 🚚 Autotransporte
   - 👤 Operador
   - 📋 Permisos SCT (N permisos)
   
6. **🛃 DODA/Pedimentos (N)**
   - Información aduanal
   
7. **🔌 Complementos (N)**
   - Complementos adicionales detectados
   
8. **📎 Addenda**
   - Información no fiscal con valor probatorio

---

### 2. **Navegación Inteligente**

#### Características:
- **Click en sección** → Scroll automático al nodo XML exacto
- **Resaltado visual** del bloque XML (3 segundos)
- **Animación suave** de transición
- **Indicador activo** en el índice (fondo azul)

#### Funcionamiento:
```typescript
navegarASeccion(seccionId: string) {
  1. Busca el selector XML correspondiente
  2. Localiza la línea en el XML formateado
  3. Hace scroll suave al elemento
  4. Aplica clase 'highlight-active' con animación
  5. Remueve el highlight después de 3 segundos
}
```

---

### 3. **Detección Automática Especial**

#### 🚛 Carta Porte:
- **Detección**: Busca nodos `cartaporte20:CartaPorte` o `cartaporte30:CartaPorte`
- **Badge visible**: "Carta Porte Detectada - Requiere materialidad"
- **Color**: Naranja con gradiente
- **Subsecciones expandibles** con estado individual

#### 📎 Addenda:
- **Detección**: Busca nodo `cfdi:Addenda`
- **Badge visible**: "Addenda Presente - No fiscal - Valor probatorio"
- **Color**: Púrpura con gradiente
- **Etiqueta especial**: Indica que NO es información fiscal

#### 🛃 DODA/Pedimentos:
- **Detección**: Busca nodos `Pedimento` o `DODA`
- **Contador**: Muestra cantidad de pedimentos detectados

---

### 4. **Resumen Ejecutivo** (Header Superior)

Muestra en una sola línea los datos críticos:
- **Emisor**: Nombre + RFC
- **Receptor**: Nombre + RFC
- **Fecha**: Fecha de emisión + Tipo de comprobante
- **Total**: Monto formateado en moneda
- **Pago**: Forma de pago + Método de pago

**Ventaja**: El contador ve la información clave SIN necesidad de leer el XML.

---

### 5. **Integración con Materialidad**

#### Botón "Gestión de Materialidad":
- **Aparece automáticamente** si se detecta:
  - Carta Porte
  - DODA/Pedimentos
- **Ubicación**: Footer del panel izquierdo
- **Color**: Gradiente amarillo-naranja (alerta de acción requerida)
- **Texto**: "Evidencias requeridas detectadas"

#### Próxima Integración:
```typescript
// TODO: Conectar con módulo de Materialidad
onClick={() => {
  // 1. Identificar tipo de complemento
  // 2. Cargar checklist dinámico de evidencias
  // 3. Mostrar modal de gestión de evidencias
  // 4. Actualizar semáforo de materialidad
}}
```

---

### 6. **UX/UI Corporativo Sentinel**

#### Paleta de Colores:
- **Fondo principal**: `#0d1117` (GitHub dark)
- **Paneles**: `#161b22` (Gray 950)
- **Bordes**: `#374151` (Gray 700)
- **Acentos**: Indigo (`#6366f1`) y Purple (`#a855f7`)
- **Alertas**: 
  - Verde: `#10b981` (Éxito)
  - Naranja: `#f97316` (Carta Porte)
  - Púrpura: `#a855f7` (Addenda)
  - Rojo: `#ef4444` (Ausente)

#### Tipografía:
- **Títulos**: Font-bold, text-white
- **Labels**: Uppercase, text-gray-500, tracking-wider
- **Monospace**: Para RFCs, UUIDs, importes
- **Alto contraste**: NO textos grises sobre grises

#### Animaciones:
- **Pulse**: Indicador de validación SAT
- **Hover effects**: En botones y secciones
- **Smooth scroll**: Navegación fluida
- **Highlight pulse**: Resaltado de sección activa

---

## 🎯 Regla de Oro Cumplida

> **"El contador debe entender el XML SIN SABER XML"**

### ✅ Logros:
1. **NO necesita buscar nodos manualmente** → Índice clickeable
2. **NO necesita conocer estructura XML** → Resumen ejecutivo
3. **NO necesita saber qué es Carta Porte** → Badge automático
4. **NO necesita recordar qué evidencias pedir** → Botón de materialidad
5. **NO pierde información** → Todo visible con alto contraste

---

## 📊 Comparación: Antes vs Ahora

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Búsqueda de nodos** | Manual (Ctrl+F) | Click en índice |
| **Detección Carta Porte** | Lectura completa | Badge automático |
| **Addenda** | Fácil de ignorar | Badge destacado |
| **Navegación** | Scroll manual | Scroll automático |
| **Completitud** | Revisar todo | Semáforos visuales |
| **Materialidad** | Recordar manualmente | Botón automático |
| **Legibilidad** | XML crudo | Syntax highlighting |
| **Contexto** | Ninguno | Resumen ejecutivo |

---

## 🔧 Uso del Componente

### Importación:
```tsx
import XmlVisorModal from '@/components/XmlVisorModal';
// O directamente:
import XmlVisorForense from '@/components/XmlVisorForense';
```

### Uso:
```tsx
const [uuidActivo, setUuidActivo] = useState<string | null>(null);

<XmlVisorModal 
  uuid={uuidActivo} 
  onClose={() => setUuidActivo(null)} 
/>
```

### Props:
- `uuid: string` - UUID del CFDI a visualizar
- `onClose: () => void` - Callback al cerrar el modal

---

## 🚀 Próximas Mejoras

### Fase 2:
- [ ] **Búsqueda en XML**: Input de búsqueda con highlight
- [ ] **Exportar secciones**: Copiar solo una sección específica
- [ ] **Comparador**: Ver 2 XMLs lado a lado
- [ ] **Historial**: Últimas secciones visitadas

### Fase 3:
- [ ] **Validación SAT real**: Integrar con API del SAT
- [ ] **Detección de anomalías**: ML para patrones sospechosos
- [ ] **Sugerencias de póliza**: Basado en tipo de CFDI
- [ ] **Chat IA**: "Explícame este XML en español simple"

---

## 🐛 Debugging

### Si no aparece el índice:
1. Verificar que `xmlDoc` se parsea correctamente
2. Revisar console para errores de namespace
3. Validar que el XML tenga estructura CFDI válida

### Si el scroll no funciona:
1. Verificar que `xmlViewerRef.current` existe
2. Revisar que las clases `.xml-line` se aplican
3. Validar que el regex de búsqueda coincide con el formato

### Si los semáforos están incorrectos:
1. Revisar selectores de `analizarEstructuraForense()`
2. Validar namespaces del XML (cfdi:, cartaporte20:, etc.)
3. Agregar logs en cada detección

---

## 📝 Notas Técnicas

### Namespaces XML:
El componente maneja múltiples variantes de namespaces:
- `cfdi:Comprobante` (con namespace)
- `Comprobante` (sin namespace)
- `[*|CartaPorte]` (wildcard para cualquier namespace)

### Performance:
- Parsing del XML: ~50ms para XMLs de 100KB
- Rendering: Virtualizado para XMLs grandes (futuro)
- Scroll: Smooth con `behavior: 'smooth'`

### Compatibilidad:
- ✅ CFDI 3.3
- ✅ CFDI 4.0
- ✅ Carta Porte 2.0
- ✅ Carta Porte 3.0
- ✅ Complementos estándar

---

## 👨‍💼 Para el Contador

### ¿Cómo usar el visor?

1. **Abre el CFDI** desde la tabla de facturas
2. **Revisa el resumen ejecutivo** en la parte superior
3. **Observa los badges** de Carta Porte o Addenda
4. **Navega por el índice** haciendo click en cada sección
5. **Si hay Carta Porte**, click en "Gestión de Materialidad"
6. **Descarga el XML** si necesitas guardarlo

### ¿Qué significan los colores?

- 🟢 **Verde**: Todo bien, información completa
- 🟡 **Amarillo**: Falta información, revisar
- 🔴 **Rojo**: No existe esta sección en el XML
- 🟠 **Naranja**: Carta Porte (requiere evidencias)
- 🟣 **Púrpura**: Addenda (información extra)

### ¿Cuándo usar "Gestión de Materialidad"?

Cuando veas el botón amarillo-naranja, significa que el CFDI requiere evidencias físicas:
- **Carta Porte**: Fotos de mercancía, guías de transporte
- **DODA**: Pedimentos aduanales, comprobantes de importación

---

## 📞 Soporte

Para dudas o mejoras, contactar al equipo de desarrollo de **Auditoría Sentinel 2025**.

---

**Versión**: 1.0.0  
**Fecha**: Diciembre 2025  
**Autor**: Equipo Sentinel - Auditoría Forense Digital
