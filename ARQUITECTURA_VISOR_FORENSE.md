# 🏗️ ARQUITECTURA DEL VISOR XML FORENSE

## Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         XmlVisorModal.tsx                                │
│                      (Wrapper de Compatibilidad)                         │
│                                                                           │
│  Props: { uuid: string, onClose: () => void }                           │
│  Función: Redirige a XmlVisorForense                                    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       XmlVisorForense.tsx                                │
│                    (Componente Principal)                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────┐          ┌─────────────────────────────────┐  │
│  │  PANEL IZQUIERDO    │          │     PANEL DERECHO               │  │
│  │  (Índice Forense)   │          │     (Visor XML)                 │  │
│  ├─────────────────────┤          ├─────────────────────────────────┤  │
│  │                     │          │                                 │  │
│  │ 🔍 Header           │          │ 🛡️ Header                       │  │
│  │ - Título            │          │ - UUID                          │  │
│  │ - Subtítulo         │          │ - Botones (Descargar, Cerrar)  │  │
│  │                     │          │                                 │  │
│  ├─────────────────────┤          ├─────────────────────────────────┤  │
│  │                     │          │                                 │  │
│  │ 📋 Resúmenes        │          │ 📊 Resumen Ejecutivo            │  │
│  │ ┌─────────────────┐ │          │ - Emisor | Receptor | Fecha    │  │
│  │ │ CartaPorte      │ │          │ - Total | Pago                  │  │
│  │ │ Resumen         │ │          │                                 │  │
│  │ │ (si detectado)  │ │          ├─────────────────────────────────┤  │
│  │ └─────────────────┘ │          │                                 │  │
│  │ ┌─────────────────┐ │          │ 📝 Editor Toolbar               │  │
│  │ │ Addenda Badge   │ │          │ - Nombre archivo                │  │
│  │ │ (si detectado)  │ │          │ - Encoding                      │  │
│  │ └─────────────────┘ │          │ - Líneas                        │  │
│  │                     │          │                                 │  │
│  ├─────────────────────┤          ├─────────────────────────────────┤  │
│  │                     │          │                                 │  │
│  │ 📑 Índice           │          │ 💻 Contenido XML                │  │
│  │ ┌─────────────────┐ │          │                                 │  │
│  │ │ 🟢 Datos CFDI   │ │◄─────────┤ - Syntax Highlighting           │  │
│  │ │ 🟢 Emisor/Recep │ │  Click   │ - Scroll Automático             │  │
│  │ │ 🟢 Conceptos(N) │ │  Navega  │ - Resaltado Temporal            │  │
│  │ │ 🟢 Impuestos    │ │          │ - Hover Effects                 │  │
│  │ │ 🟢 Carta Porte  │ │          │                                 │  │
│  │ │   🟢 Origen/Des │ │          │ <cfdi:Comprobante>              │  │
│  │ │   🟢 Mercancías │ │          │   <cfdi:Emisor .../>            │  │
│  │ │   🟢 Autotransp │ │          │   <cfdi:Receptor .../>          │  │
│  │ │   🟢 Operador   │ │          │   <cfdi:Conceptos>              │  │
│  │ │   🟢 Permisos   │ │          │     ...                         │  │
│  │ │ 🔴 DODA/Pedim   │ │          │   </cfdi:Conceptos>             │  │
│  │ │ 🟢 Complementos │ │          │   <cfdi:Complemento>            │  │
│  │ │ 🟢 Addenda      │ │          │     <cartaporte30:...>          │  │
│  │ └─────────────────┘ │          │   </cfdi:Complemento>           │  │
│  │                     │          │ </cfdi:Comprobante>             │  │
│  │                     │          │                                 │  │
│  ├─────────────────────┤          ├─────────────────────────────────┤  │
│  │                     │          │                                 │  │
│  │ 📋 Footer           │          │ 🔒 Footer                       │  │
│  │ ┌─────────────────┐ │          │ - SHA-256 Hash                  │  │
│  │ │ Gestión de      │ │          │ - "Sólo Lectura • Forense"     │  │
│  │ │ Materialidad    │ │          │                                 │  │
│  │ │ (si CP o DODA)  │ │          │                                 │  │
│  │ └─────────────────┘ │          │                                 │  │
│  │                     │          │                                 │  │
│  └─────────────────────┘          └─────────────────────────────────┘  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Datos

```
┌──────────────┐
│   Usuario    │
│  Click CFDI  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  XmlVisorModal (Wrapper)             │
│  Props: { uuid, onClose }            │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  XmlVisorForense                     │
│  useEffect(() => fetchXml())         │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  axios.get(`/api/cfdi/detalle/${uuid}`)│
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Backend API Response                │
│  {                                   │
│    cfdi: {                           │
│      uuid, fecha, emisor, receptor,  │
│      total, xmlOriginal, ...         │
│    },                                │
│    impuestos: [...]                  │
│  }                                   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  DOMParser.parseFromString()         │
│  xmlDoc = parsed XML Document        │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  analizarEstructuraForense(xmlDoc)   │
│  - Detecta secciones                 │
│  - Cuenta elementos                  │
│  - Asigna semáforos                  │
│  - Identifica complementos           │
└──────┬───────────────────────────────┘
       │
       ├─────────────────┬──────────────┬──────────────┐
       ▼                 ▼              ▼              ▼
┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐
│ setSecciones│  │setCartaPorte│  │setAddenda│  │  setDoda │
│    (array)  │  │  Detectada  │  │Detectada │  │Detectada │
└─────────────┘  └─────────────┘  └──────────┘  └──────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Render UI                           │
│  - Índice con semáforos              │
│  - Badges especiales                 │
│  - Resúmenes (CartaPorteResumen)     │
│  - XML con syntax highlighting       │
└──────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Usuario Click en Sección            │
│  navegarASeccion(seccionId)          │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  1. Mapea seccionId → selector XML   │
│  2. Busca nodo en xmlDoc             │
│  3. Calcula línea en texto           │
│  4. Scroll suave al elemento         │
│  5. Aplica highlight temporal        │
└──────────────────────────────────────┘
```

---

## Detección de Complementos

```
┌─────────────────────────────────────────────────────────────┐
│                  analizarEstructuraForense()                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐  ┌──────────────┐  ┌──────────────┐
│ Carta Porte?  │  │  Addenda?    │  │  DODA?       │
└───────┬───────┘  └──────┬───────┘  └──────┬───────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────────────────────────────────────────┐
│ querySelector('cartaporte20\\:CartaPorte,         │
│                cartaporte30\\:CartaPorte')        │
└───────┬───────────────────────────────────────────┘
        │
        ├─── Si existe ───┐
        │                 │
        ▼                 ▼
┌───────────────┐  ┌──────────────────────────────┐
│ setCartaPorte │  │ Analizar subsecciones:       │
│ Detectada     │  │ - Ubicaciones (querySelectorAll)│
│ (true)        │  │ - Mercancías (querySelectorAll) │
│               │  │ - Autotransporte (querySelector)│
│               │  │ - Operador (querySelector)      │
│               │  │ - Permisos (querySelectorAll)   │
└───────┬───────┘  └──────┬───────────────────────┘
        │                 │
        ▼                 ▼
┌───────────────────────────────────────────────────┐
│ Crear SeccionForense con subsecciones             │
│ {                                                 │
│   id: 'carta-porte',                              │
│   label: 'Carta Porte',                           │
│   icon: '🚛',                                     │
│   status: 'presente',                             │
│   subsecciones: [                                 │
│     { id: 'cp-ubicaciones', ... },                │
│     { id: 'cp-mercancias', ... },                 │
│     ...                                           │
│   ]                                               │
│ }                                                 │
└───────────────────────────────────────────────────┘
```

---

## Navegación Inteligente

```
┌──────────────────────────────────────┐
│  Usuario Click en "Carta Porte"      │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  navegarASeccion('carta-porte')      │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  setSeccionActiva('carta-porte')     │
│  (Actualiza UI - fondo azul)         │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  selectorMap['carta-porte']          │
│  → '[*|CartaPorte], cartaporte...'   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Extraer tagName del selector        │
│  'CartaPorte'                        │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Crear regex para buscar tag         │
│  /<[^>]*CartaPorte[^>]*>/i           │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  xmlText.match(regex)                │
│  → { index: 1234, ... }              │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Calcular número de línea            │
│  beforeMatch.split('\n').length      │
│  → lineNumber = 42                   │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Obtener elemento DOM                │
│  lineElements[lineNumber - 1]        │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  element.scrollIntoView({            │
│    behavior: 'smooth',               │
│    block: 'center'                   │
│  })                                  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  element.classList.add(              │
│    'highlight-active'                │
│  )                                   │
│  → Fondo azul + borde + animación    │
└──────┬───────────────────────────────┘
       │
       ▼ (después de 3 segundos)
┌──────────────────────────────────────┐
│  setTimeout(() => {                  │
│    element.classList.remove(         │
│      'highlight-active'              │
│    )                                 │
│  }, 3000)                            │
└──────────────────────────────────────┘
```

---

## Sistema de Semáforos

```
┌─────────────────────────────────────────────────────────┐
│              Lógica de Asignación de Status              │
└─────────────────────────────────────────────────────────┘

Para cada sección:

┌──────────────────────────┐
│  ¿Existe el nodo?        │
└──────┬───────────────────┘
       │
       ├─── NO ───► 🔴 status: 'ausente'
       │
       └─── SÍ ───┐
                  │
                  ▼
       ┌──────────────────────────┐
       │  ¿Tiene datos completos? │
       └──────┬───────────────────┘
              │
              ├─── SÍ ───► 🟢 status: 'presente'
              │
              └─── NO ───► 🟡 status: 'incompleto'

Ejemplos:

1. Emisor/Receptor:
   - Si emisor Y receptor existen → 🟢 'presente'
   - Si solo uno existe → 🟡 'incompleto'
   - Si ninguno existe → 🔴 'ausente'

2. Carta Porte - Ubicaciones:
   - Si hay >= 2 ubicaciones → 🟢 'presente'
   - Si hay 1 ubicación → 🟡 'incompleto'
   - Si no hay ubicaciones → 🔴 'ausente'

3. Conceptos:
   - Si hay > 0 conceptos → 🟢 'presente'
   - Si no hay conceptos → 🔴 'ausente'
```

---

## Integración CartaPorteResumen

```
┌─────────────────────────────────────────────────────────┐
│                  XmlVisorForense                         │
│                                                          │
│  {cartaPorteDetectada && xmlDoc && (                    │
│    <CartaPorteResumen xmlDoc={xmlDoc} />                │
│  )}                                                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              CartaPorteResumen Component                 │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        │             │             │             │
        ▼             ▼             ▼             ▼
┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│extraerUbica │ │extraerMer│ │extraerAut│ │extraerOpe│
│  ciones()   │ │cancias() │ │otransp() │ │rador()   │
└─────┬───────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
      │              │            │            │
      ▼              ▼            ▼            ▼
┌─────────────────────────────────────────────────────────┐
│  querySelectorAll('[*|Ubicacion]')                      │
│  querySelectorAll('[*|Mercancia]')                      │
│  querySelector('[*|Autotransporte]')                    │
│  querySelector('[*|TiposFigura]')                       │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Extraer atributos con getAttribute()                   │
│  - Ubicacion: tipo, nombre, ciudad, estado, fecha       │
│  - Mercancia: descripcion, cantidad, peso, valor        │
│  - Autotransporte: permiso, placas, modelo, seguro      │
│  - Operador: nombre, licencia, RFC                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Render UI con datos extraídos                          │
│  - 📍 Ruta (Origen → Destino)                           │
│  - 📦 Lista de mercancías                               │
│  - 🚚 Datos del vehículo                                │
│  - 👤 Info del operador                                 │
│  - ⚠️ Checklist de evidencias                           │
└─────────────────────────────────────────────────────────┘
```

---

## Paleta de Colores

```
┌─────────────────────────────────────────────────────────┐
│                    Color System                          │
└─────────────────────────────────────────────────────────┘

Fondos:
  #0d1117 ████ Principal (GitHub Dark)
  #161b22 ████ Paneles
  #1f2937 ████ Gray-800
  #111827 ████ Gray-900
  #030712 ████ Gray-950

Bordes:
  #374151 ████ Gray-700
  #4b5563 ████ Gray-600

Acentos:
  #6366f1 ████ Indigo-500 (Principal)
  #4f46e5 ████ Indigo-600 (Hover)
  #a855f7 ████ Purple-500 (Secundario)

Semáforos:
  #10b981 ████ Green-500 (Presente)
  #eab308 ████ Yellow-500 (Incompleto)
  #ef4444 ████ Red-500 (Ausente)

Especiales:
  #f97316 ████ Orange-500 (Carta Porte)
  #a855f7 ████ Purple-500 (Addenda)
  #f59e0b ████ Amber-500 (Materialidad)

Textos:
  #ffffff ████ White (Títulos)
  #e5e7eb ████ Gray-200 (Texto principal)
  #9ca3af ████ Gray-400 (Secundario)
  #6b7280 ████ Gray-500 (Labels)
```

---

**Versión**: 1.0.0  
**Fecha**: Diciembre 2025  
**Equipo**: Auditoría Sentinel - Arquitectura
