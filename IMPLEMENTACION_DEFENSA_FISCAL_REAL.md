# 🛡️ IMPLEMENTACIÓN: DEFENSA FISCAL REAL SAT

**Fecha**: 21 de Diciembre de 2025, 07:34 AM  
**Objetivo**: Convertir en herramienta operativa REAL de defensa fiscal

---

## 📋 CHECKLIST DE IMPLEMENTACIÓN

### 1️⃣ GRÁFICA DE TENDENCIA (CRÍTICO) - ⏳ EN PROGRESO
- [ ] Activar gráfica SIEMPRE con ≥1 periodo
- [ ] Responder a periodo seleccionado
- [ ] Cambiar según Emitidos/Recibidos
- [ ] Cambiar según dominio activo
- [ ] Mensaje claro cuando no hay datos
- [ ] Prohibir ocultar por defecto

### 2️⃣ PERFIL FISCAL DINÁMICO - ⏳ PENDIENTE
- [ ] Leer giro/actividad desde empresa
- [ ] Leer régimen fiscal
- [ ] Mostrar dinámicamente según empresa
- [ ] Mensaje "No clasificado (riesgo)" si falta

### 3️⃣ AUDITORÍA FORENSE 1x1 - 🔄 PARCIAL
- [x] Modal creado (ModalAuditoria1x1.tsx)
- [x] Filtros implementados
- [x] Ordenamiento implementado
- [x] Paginación implementada
- [ ] Integrar en TablaControlMensualDominio
- [ ] Crear endpoint backend

### 4️⃣ VISOR XML FORENSE - ✅ COMPLETADO
- [x] Vista previa XML (👁)
- [x] Modo oscuro corporativo
- [x] XML solo lectura
- [x] Índice lateral navegable
- [x] Scroll automático
- [x] Etiqueta "XML ORIGINAL – INMUTABLE"

### 5️⃣ EXPEDIENTE DE MATERIALIDAD - ⏳ PENDIENTE
- [ ] Alto contraste
- [ ] Diseño dark Sentinel
- [ ] Selector de evidencias completo
- [ ] Categorías Ingresos
- [ ] Categorías Egresos
- [ ] Categorías Otros XML

### 6️⃣ MATERIALIDAD REAL - ⏳ PENDIENTE
- [ ] Calcular Nivel de Blindaje (%)
- [ ] Checklist claro (✔ ⚠ ❌)
- [ ] Mensajes tipo SAT

---

## 🚀 ORDEN DE EJECUCIÓN

### FASE 1: BACKEND (Fundamentos)
1. Endpoint `/api/cfdi/detalle-mes` para auditoría 1x1
2. Endpoint `/api/empresas/:id/perfil-fiscal` para perfil dinámico
3. Endpoint `/api/stats/tendencia` para gráfica
4. Endpoint `/api/materialidad/expediente/:uuid` para evidencias

### FASE 2: FRONTEND (Integración)
1. Integrar ModalAuditoria1x1 en tabla mensual
2. Hacer perfil fiscal dinámico
3. Activar gráfica de tendencia
4. Crear componente ExpedienteMaterialidad

### FASE 3: VALIDACIÓN
1. Probar con datos reales
2. Verificar todos los flujos
3. Capturar pantallas de evidencia

---

## 📊 PROGRESO ACTUAL

```
BLOQUE 1 - Visor XML:           ✅ 100% COMPLETADO
BLOQUE 2 - Auditoría 1x1:       🔄  70% (Frontend listo, backend pendiente)
BLOQUE 3 - Gráfica Tendencia:   ⏳   0% PENDIENTE
BLOQUE 4 - Perfil Fiscal:       ⏳   0% PENDIENTE
BLOQUE 5 - Materialidad:        ⏳  10% (Solo estructura)

TOTAL: 36%
```

---

## 🎯 PRÓXIMA ACCIÓN INMEDIATA

Crear endpoints backend críticos para que la plataforma sea funcional.
