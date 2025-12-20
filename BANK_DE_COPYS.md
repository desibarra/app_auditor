# 📝 BANK DE COPYS - KONTIFY · SENTINEL

**Versión:** 1.0  
**Última actualización:** Diciembre 2025

---

## 🎯 SLOGAN PRINCIPAL

> **"Detecta lo que falta, antes de que el SAT lo haga."**

---

## 📱 COPYS POR CONTEXTO

### 1. HEADER DASHBOARD
```
Título: Kontify · Sentinel
Subtítulo: Detecta lo que falta, antes de que el SAT lo haga.
Status: ✓ Backend conectado
```

### 2. KPI CARDS

#### Meses Incompletos
```
Título: 📅 Meses Incompletos
Descripción: Tu expediente fiscal, siempre listo para SAT
Estado OK: ✅ Todos completos
Estado Alerta: ⚠️ Faltan tipos de CFDI
```

#### Alertas Activas
```
Título: 🚨 Alertas Activas
Descripción: CFDIs cancelados sin actualizar
Call-to-Action: Ver detalles →
```

#### CFDI del Mes
```
Título: 📊 CFDI del Mes
Descripción: Prevención fiscal en tiempo real
Detalle: X ingresos / Y egresos
```

### 3. TOOLTIPS

```
Tabla Control Mensual:
⚠️ Falta CFDI tipo: Pago, Egreso

Mes Completo:
✅ Todos los tipos esperados presentes

Confidence Score Bajo:
⚠️ Movimiento bancario con baja confiabilidad (score < 80%)

RFC Mal Asignado:
❌ Este CFDI pertenece a otra empresa
```

### 4. MENSAJES DE ÉXITO

```
XML Cargado:
✅ 145 CFDIs importados · Métricas actualizadas

Mes Validado:
✅ Diciembre 2025 completo · Listo para SAT

Expediente Listo:
✅ Expediente fiscal completo · Aprobado para devolución IVA
```

### 5. MENSAJES DE ALERTA

```
Mes Incompleto:
⚠️ Noviembre 2025: Falta CFDI tipo Pago
👉 Solicita factura antes del cierre mensual

RFC Cross-Empresa Detectado:
❌ Este XML pertenece a [Empresa X]
👉 Será reasignado automáticamente

Desfase Banco-CFDI:
⚠️ Diferencia detectada: $12,450 MXN
👉 Revisar conciliación antes de declarar
```

### 6. COPYS DE ONBOARDING

```
Bienvenida:
¡Bienvenido a Kontify · Sentinel!
Tu sistema de prevención fiscal en tiempo real

Primer Paso:
Carga tus primeros XMLs y descubre faltantes al instante

Beneficio Clave:
Un error fiscal cuesta $80K. Nosotros costamos $2K/mes
```

### 7. EMAILS TRANSACCIONALES

#### Subject: Mes Incompleto Detectado
```
Subject: ⚠️ [Empresa] - Mes Incompleto Detectado
Preheader: Acción requerida antes del cierre fiscal

Hola [Nombre],

Kontify · Sentinel detectó que **Noviembre 2025** está incompleto:

❌ Falta: CFDI tipo Pago

¿Por qué importa?
Un expediente incompleto puede costar $80K en multas y devoluciones rechazadas.

Acción inmediata:
→ Solicita el CFDI faltante antes del día 30

[Ver Dashboard]

---
Kontify · Sentinel
Detecta lo que falta, antes de que el SAT lo haga.
```

#### Subject: Expediente Listo para SAT
```
Subject: ✅ [Empresa] - Expediente Fiscal Completo
Preheader: Todos los meses validados · Listo para auditoría

Hola [Nombre],

¡Buenas noticias! Tu expediente fiscal está completo:

✅ 12 meses validados
✅ Todos los tipos de CFDI presentes
✅ Banco vs CFDI conciliado

Estado: LISTO PARA DEVOLUCIÓN IVA

[Descargar Reporte]

---
Kontify · Sentinel
Tu expediente fiscal, siempre listo para SAT
```

### 8. LANDING PAGE

#### Hero Section
```
H1: Kontify
H2: Sentinel

Headline:
Detecta lo que falta, antes de que el SAT lo haga.

Subheadline:
Sistema de prevención fiscal en tiempo real que detecta meses incompletos, 
CFDIs mal asignados y desfases bancarios ANTES del cierre mensual.

CTA Principal: Comenzar Gratis
CTA Secundario: Ver Demo
```

#### Value Propositions
```
⏱️ Detección en Tiempo Real
No esperes al cierre mensual. Sabe QUÉ falta el mismo día que cargas XMLs.

💰 Ahorra Hasta $150K en Errores
Un solo mes incompleto cuesta $80K en multas. Prevención desde $2K/mes.

🛡️ Expedientes SAT-Grade
Trazabilidad completa con auditoría inmutable. Tu defensa cuando SAT audite.

✅ Devoluciones IVA Aprobadas
Expedientes completos = aprobación en 40 días, no 12 meses.
```

#### Social Proof
```
"Detectamos 3 meses incompletos ANTES del cierre. Nos salvó de $250K en multas."
— CFO, Empresa Manufacturera

"Lo que antes tomaba 40 horas ahora es 1 click. ROI del 4000%."
— Contador Público, Despacho PyMEs
```

### 9. REPORTES PDF

#### Portada
```
┌─────────────────────────────┐
│ [Logo Kontify · Sentinel]   │
│                             │
│ REPORTE DE ROBUSTEZ         │
│ FISCAL SAT-GRADE            │
│                             │
│ Empresa: [Nombre]           │
│ Período: Ene-Dic 2025       │
│ Fecha: DD/MM/YYYY           │
│                             │
│ Estado: ✅ APROBADO         │
└─────────────────────────────┘
```

#### Pie de Página
```
Módulo de prevención fiscal de Kontify
Detecta lo que falta, antes de que el SAT lo haga.
Página X de Y | Generado: DD/MM/YYYY HH:MM
```

### 10. TOOLTIPS TÉCNICOS

```
Tipos Esperados:
Basado en análisis histórico (60%+ de meses)

Confidence Score:
Nivel de certeza en detección bancaria (0-100%)

Mes Incompleto:
Falta tipo de CFDI esperado según patrón histórico

Auditoría Inmutable:
Registro SHA256 que NO puede modificarse (CFF Art. 30)
```

---

## 🎨 VARIANTES POR AUDIENCIA

### Para Empresarios (Simple)
```
✅ ¿Estás al día con SAT?
Un KPI lo dice todo.

Estado OK: Verde ✅
Estado Alerta: Rojo ⚠️
```

### Para Contadores (Técnico)
```
Control mensual en segundos
- Detección automática de faltantes
- Conciliación banco-CFDIs
- Trazabilidad SAT-Grade
```

### Para CFOs (ROI)
```
Un error fiscal: $80K
Sentinel: $2K/mes
ROI: 4000%

Payback: 1 solo error evitado
```

---

## 🚫 FRASES PROHIBIDAS

❌ "Sentinel" (sin Kontify)
❌ "Sistema de auditoría" (muy genérico)
❌ "Gestión de XMLs" (no es el valor principal)
❌ "Software contable" (no somos contabilidad)

✅ Usar siempre: Kontify · Sentinel
✅ Valor: Prevención fiscal / Detección temprana
✅ Beneficio: Evitar multas / Aprobar devoluciones

---

## 📊 MICROCOPY UI

### Botones
```
Primarios:
- Cargar XMLs
- Ver Dashboard
- Descargar Reporte
- Solicitar Devolución

Secundarios:
- Ver Detalles →
- Filtrar por Mes
- Exportar PDF
- Conciliar Banco
```

### Estados Vacíos
```
Sin CFDIs:
📁 Aún no has cargado CFDIs
Arrastra XMLs aquí o haz click para seleccionar

Sin Empresa:
🏢 Selecciona una empresa para comenzar
Puedes gestionar múltiples empresas desde aquí

Sin Alertas:
✅ Todo en orden
No hay alertas fiscales pendientes
```

### Loading States
```
Cargando:
⏳ Analizando XMLs...
🔍 Detectando patrones históricos...
✅ Validando contra SAT...
```

---

**Última revisión:** 20 Diciembre 2025  
**Aprobado por:** Equipo Kontify Brand
