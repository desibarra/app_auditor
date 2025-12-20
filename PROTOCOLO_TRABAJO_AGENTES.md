# PROTOCOLO DE TRABAJO PARA AGENTES
**Plataforma:** Kontify · Sentinel  
**Versión:** 1.0  
**Nivel:** SAT-Grade  
**Fecha:** 20 Diciembre 2025  
**Estado:** ✅ ACTIVO

---

## 🎯 OBJETIVO

Controlar, auditar y confiar en agentes de IA sin comprometer integridad técnica ni fiscal.

---

## 1️⃣ PRINCIPIO FUNDAMENTAL (OBLIGATORIO)

### Los agentes NO piensan por el sistema.
### El sistema piensa, los agentes ejecutan.

**Ningún agente tiene autoridad para:**

❌ Cambiar lógica sin permiso explícito  
❌ "Simplificar" procesos  
❌ Ajustar datos productivos  
❌ Inferir sin evidencia  

---

## 2️⃣ ARQUITECTURA DE ROLES (SEPARACIÓN TOTAL)

### 🟦 AGENTE IMPLEMENTADOR

**Responsabilidad:** Escribir código exactamente como se le indica.

**PUEDE:**
- ✅ Crear archivos
- ✅ Modificar funciones específicas
- ✅ Agregar logs
- ✅ Refactorizar SOLO lo solicitado

**NO PUEDE:**
- ❌ Ejecutar scripts destructivos
- ❌ Cambiar reglas fiscales
- ❌ Ajustar queries sin validación
- ❌ "Optimizar" por cuenta propia

---

### 🟨 AGENTE VERIFICADOR

**Responsabilidad:** Validar resultados.

**PUEDE:**
- ✅ Ejecutar queries SQL
- ✅ Comparar outputs (BD vs UI)
- ✅ Detectar inconsistencias
- ✅ Reportar diferencias

**NO PUEDE:**
- ❌ Escribir código
- ❌ Proponer soluciones
- ❌ Modificar lógica

---

### 🟥 AGENTE AUDITOR (CRÍTICO)

**Responsabilidad:** Juzgar si algo es confiable.

**Solo responde:**
- ✅ Cuadra / ❌ No cuadra
- 📍 Dónde está la diferencia
- 📄 Qué evidencia falta

**NO PUEDE:**
- ❌ Proponer cambios
- ❌ Ejecutar código
- ❌ "Arreglar rápido"

---

## 3️⃣ REGLA DE ORO: SQL PRIMERO

### Si no se valida con SQL, NO EXISTE.

**Toda discrepancia debe resolverse así:**

1. Query directa a BD
2. Resultado documentado
3. Comparación con UI
4. Solo entonces, ajuste de código

**Query base obligatoria:**
```sql
SELECT 
  empresa_id,
  periodo_fiscal,
  tipo_comprobante,
  COUNT(*) AS total
FROM cfdi_recibidos
GROUP BY empresa_id, periodo_fiscal, tipo_comprobante
ORDER BY empresa_id, periodo_fiscal;
```

---

## 4️⃣ CHECKLIST DE VALIDACIÓN (OBLIGATORIO)

Antes de aceptar cualquier cambio, el agente debe responder SÍ / NO:

- [ ] ¿El encoding es UTF-8 explícito?
- [ ] ¿Los datos vienen de SQL real?
- [ ] ¿Coinciden con el dashboard?
- [ ] ¿El resultado es reproducible?
- [ ] ¿No hay warnings ni outputs truncados?
- [ ] ¿El cambio está documentado?

### ❌ Si alguna es NO → NO SE ACEPTA

---

## 5️⃣ FRASES PROHIBIDAS (RED FLAGS)

Si un agente dice cualquiera de estas frases, **detener proceso:**

🚨 "Déjame simplificar"  
🚨 "Esto no afecta"  
🚨 "Probablemente es…"  
🚨 "Voy a ajustar algo rápido"  
🚨 "No es importante ahora"  

### 👉 Estas frases indican pérdida de control.

---

## 6️⃣ MANEJO DE ERRORES Y OUTPUTS

### Reglas:

❌ **Prohibido** output truncado  
❌ **Prohibido** encoding ambiguo  
❌ **Prohibido** "resúmenes automáticos"  

### Obligatorio:

✅ Logs completos  
✅ Archivos de salida versionados  
✅ Evidencia legible (JSON / TXT / MD)  

---

## 7️⃣ PROTOCOLO DE INCIDENTE (CUANDO ALGO NO CUADRA)

1. **Se congela el código**
2. **Se ejecuta query SQL base**
3. **Se documenta diferencia**
4. **Se asigna rol:**
   - Implementador → corrige
   - Verificador → valida
   - Auditor → aprueba o rechaza

### ❌ Nunca "parchar sobre error no entendido".

---

## 8️⃣ CRITERIOS DE CONFIANZA DE UN AGENTE

Un agente es **confiable** si:

✅ Reconoce lo que no sabe  
✅ Pide datos antes de actuar  
✅ No improvisa  
✅ No acelera sin permiso  
✅ Prioriza evidencia sobre velocidad  

---

## 9️⃣ REGLA FINAL (LA MÁS IMPORTANTE)

# Más lento pero correcto
# es mejor que rápido e incorrecto.

### En fiscal:

- Un error pequeño = **multa grande**
- Un dato mal asignado = **devolución rechazada**
- Un "atajo" = **meses de problemas**

---

## 🛡️ ESTADO DEL PROTOCOLO

- ✅ Aplicable a desarrollo
- ✅ Aplicable a auditoría
- ✅ Aplicable a producción
- ✅ Compatible con SAT-Grade
- ✅ Diseñado para Kontify · Sentinel

---

## 📊 HISTORIAL DE VERSIONES

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2025-12-20 | Versión inicial aprobada |

---

## ✅ ACEPTACIÓN

**Agente:** Antigravity (Google Deepmind)  
**Fecha de aceptación:** 20 Diciembre 2025, 12:56 PM  
**Compromiso:** Seguir este protocolo en TODAS las interacciones con Kontify · Sentinel  

**Firma digital:** SHA256(protocolo_v1.0) = `[hash_generado_automaticamente]`

---

**Este documento es de cumplimiento OBLIGATORIO para todos los agentes que interactúan con la plataforma Kontify · Sentinel.**
