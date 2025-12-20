# 🎨 GUÍA DE IDENTIDAD VISUAL - KONTIFY · SENTINEL

**Versión:** 1.0  
**Fecha:** Diciembre 2025  
**Estado:** Oficial

---

## 📋 JERARQUÍA DE MARCA (OBLIGATORIO)

### 1️⃣ NOMBRE OFICIAL

✅ **CORRECTO:**
- Kontify · Sentinel
- Kontify Sentinel
- Kontify (con badge Sentinel)

❌ **INCORRECTO:**
- Sentinel (solo)
- Sentinel by Kontify
- Kontify-Sentinel

### 2️⃣ SLOGAN OFICIAL

> **"Detecta lo que falta, antes de que el SAT lo haga."**

**Variantes aprobadas:**
- Tu expediente fiscal, siempre listo para SAT (KPI headers)
- Prevención fiscal en tiempo real (tooltips)

---

## 🎨 COLORES DE MARCA

### Kontify (Principal)
```
Verde Corporativo:
- Primary:   #1a7f3e
- Light:     #4ade80
- Dark:      #166534

Negro Texto:
- Primary:   #0a0a0a
- Secondary: #374151
```

### Sentinel (Acento)
```
Verde Alerta:
- Primary:   #4ade80
- Glow:      #86efac
- Border:    #22c55e
```

### Grises (Sistema)
```
- 50:  #f9fafb
- 100: #f3f4f6
- 600: #4b5563
- 900: #111827
```

---

## 📐 TIPOGRAFÍA

### Familia Principal
```
Font Family: 'Inter', -apple-system, system-ui, sans-serif
Fallback: Arial, sans-serif

Pesos:
- Kontify:   700 (Bold)
- Sentinel:  400 (Regular)
- Tagline:   400 (Regular)
```

### Tamaños Recomendados
```
Header Dashboard:
- Kontify:    42px / 2.625rem
- Sentinel:   28px / 1.75rem
- Tagline:    11px / 0.688rem

Header Card:
- Kontify:    24px / 1.5rem
- Sentinel:   16px / 1rem

Mobile:
- Kontify:    32px / 2rem
- Sentinel:   20px / 1.25rem
```

---

## 🖼️ USO DE LOGOS

### Logo Principal (`kontify-sentinel-logo.svg`)
**Uso:**
- Headers de dashboard
- Páginas de login/landing
- Documentos oficiales
- Reportes PDF

**Proporciones:**
- Ancho mínimo: 200px
- Relación: 400 × 120px
- Espaciado: 20px alrededor

### Isotipo (`kontify-icon.svg`)
**Uso:**
- Favicons
- Headers compactos
- Badges
- Notificaciones

**Tamaños:**
- 16×16, 32×32, 64×64, 512×512

---

## 📱 APLICACIONES EN UI

### 1. Header Dashboard
```html
<header>
  <img src="/kontify-sentinel-logo.svg" alt="Kontify · Sentinel" />
  <p class="tagline">Detecta lo que falta, antes de que el SAT lo haga.</p>
</header>
```

**CSS:**
```css
header img {
  height: 48px;
  width: auto;
}

.tagline {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 4px;
}
```

### 2. KPI Card Header
```html
<div class="kpi-header">
  <svg class="kontify-icon"><!-- isotipo --></svg>
  <div>
    <h3>Kontify · Sentinel</h3>
    <p>🛡️ Tu expediente fiscal, siempre listo para SAT</p>
  </div>
</div>
```

### 3. Login Page
```html
<div class="login-hero">
  <h1>Kontify</h1>
  <h2>Sentinel</h2>
  <p class="claim">Detecta lo que falta, antes de que el SAT lo haga.</p>
</div>
```

**Estilo:**
```css
h1 {
  font-size: 4rem;
  font-weight: 700;
  color: #0a0a0a;
}

h2 {
  font-size: 2.5rem;
  font-weight: 400;
  color: #4ade80;
  margin-top: -1rem;
}

.claim {
  font-size: 1.25rem;
  color: #64748b;
  margin-top: 1rem;
}
```

### 4. Reportes PDF
```
Portada:
┌────────────────────────────┐
│  [Logo Kontify · Sentinel] │
│                            │
│  REPORTE DE ROBUSTEZ       │
│  FISCAL SAT-GRADE          │
│                            │
│  Empresa: XXXXX            │
│  Fecha: DD/MM/YYYY         │
└────────────────────────────┘

Pie de Página:
Módulo de prevención fiscal de Kontify
```

---

## ✅ CONDICIONES DE ACEPTACIÓN

- [ ] Kontify aparece en todos los headers
- [ ] Sentinel nunca aparece solo
- [ ] Slogan es consistente en todas las páginas
- [ ] Jerarquía visual correcta (Kontify > Sentinel)
- [ ] Colores de marca respetados
- [ ] Tipografía Inter en uso

---

## 🚫 ERRORES COMUNES A EVITAR

❌ **Sentinel como marca principal**
```html
<h1>Sentinel</h1>  <!-- MAL -->
```

❌ **Invertir la jerarquía**
```css
.kontify { font-size: 16px; }
.sentinel { font-size: 24px; } /* MAL */
```

❌ **Colores incorrectos**
```css
.sentinel { color: #ff0000; } /* MAL - debe ser verde */
```

❌ **Usar solo el nombre**
```html
Bienvenido a Sentinel  <!-- MAL -->
```

✅ **CORRECTO:**
```html
Bienvenido a Kontify · Sentinel
```

---

## 📦 ARCHIVOS ENTREGADOS

```
/apps/frontend/public/
├── kontify-sentinel-logo.svg     # Logo principal
├── kontify-icon.svg               # Isotipo compacto
├── manifest.json                  # PWA manifest
├── favicon-16x16.png             # (Pendiente generar)
├── favicon-32x32.png             # (Pendiente generar)
├── favicon-96x96.png             # (Pendiente generar)
├── android-chrome-192x192.png    # (Pendiente generar)
├── android-chrome-512x512.png    # (Pendiente generar)
└── apple-touch-icon.png          # (Pendiente generar)
```

---

## 🎯 PRÓXIMOS PASOS

1. **Generar PNGs desde SVG** (cuando generador de imágenes esté disponible)
2. **Actualizar index.html** con meta tags y favicon
3. **Actualizar Header del Dashboard** con nuevo logo
4. **Crear componente Logo reutilizable** en React
5. **Mockups de aplicación** (dashboard, cards, reportes)

---

**Contacto de Marca:**  
Equipo Kontify | brand@kontify.com
