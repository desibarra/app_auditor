# VERIFICACION CFDI EMITIDOS - SQL PRIMERO

**Fecha:** 2025-12-20T19:04:29.455Z
**Protocolo:** SAT-Grade v1.0

---

## 1. ESTRUCTURA DE TABLA cfdi_recibidos

### Columnas disponibles:

- uuid (TEXT)
- emisor_rfc (TEXT)
- emisor_nombre (TEXT)
- emisor_regimen_fiscal (TEXT)
- receptor_rfc (TEXT)
- receptor_nombre (TEXT)
- receptor_uso_cfdi (TEXT)
- receptor_domicilio_fiscal (TEXT)
- serie (TEXT)
- folio (TEXT)
- fecha (TEXT)
- fecha_timbrado (TEXT)
- tipo_comprobante (TEXT)
- subtotal (REAL)
- descuento (REAL)
- total (REAL)
- moneda (TEXT)
- tipo_cambio (REAL)
- forma_pago (TEXT)
- metodo_pago (TEXT)
- condiciones_pago (TEXT)
- lugar_expedicion (TEXT)
- xml_original (TEXT)
- estado_sat (TEXT)
- fecha_validacion_sat (INTEGER)
- fecha_cancelacion (INTEGER)
- empresa_id (TEXT)
- fecha_importacion (INTEGER)
- fecha_actualizacion (INTEGER)
- procesado (INTEGER)
- tiene_errores (INTEGER)
- mensaje_error (TEXT)

**¿Existe columna 'rol_cfdi'?** ❌ NO

## 2. EMPRESAS EN BD

Total empresas: 2

### PRODUCTOS NATURALES KOPPARA DEL BAJIO SA DE CV (PNK140311QM2)

**CFDI EMITIDOS** (emisor_rfc = empresa):
- Total: 4
- Meses: 3
- Importe: $79,632.36

**CFDI RECIBIDOS** (receptor_rfc = empresa):
- Total: 31
- Meses: 3
- Importe: $108,903.45

#### Detalle EMITIDOS por mes:


**2025-12:**
- I: 1 CFDIs ($857.99)

**2025-10:**
- I: 1 CFDIs ($30,937.62)

**2025-09:**
- I: 2 CFDIs ($47,836.75)

---

### TRASLADOS DE VANGUARDIA SA DE CV (TVA060209QL6)

**CFDI EMITIDOS** (emisor_rfc = empresa):
- Total: 2245
- Meses: 4
- Importe: $21,872,932.08

**CFDI RECIBIDOS** (receptor_rfc = empresa):
- Total: 8259
- Meses: 12
- Importe: $417,156,405.81

#### Detalle EMITIDOS por mes:


**2025-12:**
- I: 329 CFDIs ($1,917,776.26)

**2025-10:**
- I: 797 CFDIs ($5,557,808.78)

**2025-08:**
- I: 980 CFDIs ($9,110,812.72)

**2025-07:**
- I: 139 CFDIs ($5,286,534.32)

---

## 3. CONCLUSIONES

- Total CFDIs EMITIDOS en BD: 2249
- Total CFDIs RECIBIDOS en BD: 8290

### ⚠️ ACCIÓN REQUERIDA

No existe columna `rol_cfdi` en la tabla.

**Opciones:**
1. Agregar columna `rol_cfdi` en schema
2. Usar query basada en `emisor_rfc = empresa.rfc`

**Recomendación:** Opción 2 (no requiere migración)

### ✅ DATOS DISPONIBLES PARA IMPLEMENTACIÓN

- Hay 2249 CFDIs emitidos identificables
- Query funcional: `emisor_rfc = empresa.rfc`
- Listo para crear endpoints dedicados

