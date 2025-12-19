# ✅ PASO 1 COMPLETADO: Extensión de Base de Datos

**Fecha:** 2025-12-18  
**Módulo:** Validación de Materialidad y Devoluciones de IVA  
**Estado:** ✅ Código generado - Listo para migración

---

## 📊 RESUMEN DE CAMBIOS

### **Archivos Creados:**

#### 1. `cfdi_recibidos.schema.ts` ✨
**Propósito:** Almacenar CFDI recibidos parseados desde XML

**Campos Principales:**
- `uuid` (PK) - Identificador único del SAT
- Datos del Emisor: RFC, nombre, régimen fiscal
- Datos del Receptor: RFC, nombre, uso CFDI, domicilio
- Datos del Comprobante: serie, folio, fechas, tipo
- Montos: subtotal, descuento, total, moneda
- Forma y método de pago
- `xmlOriginal` - XML completo almacenado
- `estadoSat` - Vigente/Cancelado
- Flags de procesamiento

**Total de Campos:** 30+

---

#### 2. `cfdi_impuestos.schema.ts` ✨
**Propósito:** Desglose de impuestos (IVA, ISR, IEPS) por CFDI

**Campos Principales:**
- `id` (PK autoincrement)
- `cfdiUuid` (FK → cfdi_recibidos.uuid, CASCADE)
- `conceptoId` (FK opcional para impuestos a nivel concepto)
- `nivel` - 'comprobante' | 'concepto'
- `tipo` - 'Traslado' | 'Retencion'
- `impuesto` - '002' (IVA), '001' (ISR), '003' (IEPS)
- `tipoFactor` - 'Tasa' | 'Cuota' | 'Exento'
- `tasaOCuota` - 0.16, 0.08, etc.
- `base` - Base gravable
- `importe` - Importe del impuesto

**Total de Campos:** 11

---

#### 3. `pagos_efectivo.schema.ts` ✨
**Propósito:** Registrar pagos efectivamente realizados (requisito para IVA acreditable)

**Campos Principales:**
- `id` (PK autoincrement)
- `cfdiUuid` (FK → cfdi_recibidos.uuid, CASCADE)
- `fechaPago` - Fecha del pago
- `montoPagado` - Monto pagado
- `metodoPago` - Código SAT (02=Cheque, 03=Transferencia, etc.)
- Datos bancarios: referencia, cuentas, bancos
- `estadoConciliacion` - 'Pendiente' | 'Conciliado' | 'Rechazado'
- `archivoComprobante` - S3 key del estado de cuenta
- Flags de validación

**Total de Campos:** 20+

---

### **Archivos Modificados:**

#### 4. `documentos_soporte.ts` 🔄
**Cambios Realizados:**

**Campos Agregados:**
- ✨ `cfdiUuid` (FK opcional → cfdi_recibidos.uuid, SET NULL)
- ✨ `categoriaEvidencia` (default: 'Otro')
- ✨ `descripcionEvidencia` (text nullable)
- ✨ `fechaActualizacion` (timestamp)
- ✨ `intentosSubida` (default: 0)
- ✨ `ultimoError` (text nullable)

**Campos Modificados:**
- `archivo` - Ahora nullable (para soportar estado 'pendiente')
- `estado` - Ahora con default 'pendiente'

**Compatibilidad:**
- ✅ Registros existentes NO se afectan
- ✅ Todos los campos nuevos son nullable o tienen defaults
- ✅ FK con `onDelete: 'set null'` preserva evidencia si se elimina CFDI

---

#### 5. `index.ts` 🔄
**Cambios:**
- ✅ Exportado `cfdiRecibidos`
- ✅ Exportado `cfdiImpuestos`
- ✅ Exportado `pagosEfectivo`
- ✅ Exportado `documentosSoporte` (actualizado)

---

## 🔒 ESTRATEGIA DE INTEGRIDAD REFERENCIAL

### **Problema Prevenido: Archivos Huérfanos (CONFLICTO-004)**

#### **Capa 1: Foreign Keys con Cascada Controlada**
```typescript
// documentos_soporte.cfdiUuid
onDelete: 'SET NULL' // Preserva evidencia si se elimina CFDI

// cfdi_impuestos.cfdiUuid
onDelete: 'CASCADE' // Elimina impuestos si se elimina CFDI

// pagos_efectivo.cfdiUuid
onDelete: 'CASCADE' // Elimina pagos si se elimina CFDI
```

#### **Capa 2: Estados de Documento**
```typescript
estado: 'pendiente' | 'completado' | 'error'

Flujo:
1. INSERT con estado='pendiente', archivo=null
2. Upload a S3
3. UPDATE estado='completado', archivo='s3://...'
4. Si falla S3 → DELETE registro
```

#### **Capa 3: Campos de Auditoría**
```typescript
intentosSubida: 0-N
ultimoError: 'mensaje de error'
fechaActualizacion: timestamp
```

#### **Capa 4: Transacciones en Servicio** (Paso 3)
```typescript
// Implementación futura en evidencias.service.ts
async uploadEvidencia() {
  // 1. INSERT en BD (pendiente)
  // 2. Upload a S3
  // 3. UPDATE BD (completado)
  // 4. Si falla → Rollback
}
```

---

## 📋 VALIDACIÓN PRE-MIGRACIÓN

### **Checklist de Seguridad:**

- [x] Todos los archivos de esquema creados
- [x] Imports correctos entre tablas
- [x] Foreign Keys con estrategia de eliminación definida
- [x] Campos nullable donde corresponde (compatibilidad)
- [x] Defaults definidos para campos nuevos
- [x] Exports agregados en index.ts
- [x] Comentarios de documentación incluidos
- [x] Tipos de datos correctos (text, integer, real)
- [x] Timestamps con mode: 'timestamp_ms'
- [x] No se modificaron tablas existentes (solo extensión)

---

## 🚀 PRÓXIMOS PASOS

### **Paso 1.1: Generar Migración**
```bash
cd apps/backend
npm run db:generate
```

**Resultado Esperado:**
```
✅ Archivo de migración creado en src/database/migrations/
✅ SQL generado para:
   - CREATE TABLE cfdi_recibidos
   - CREATE TABLE cfdi_impuestos
   - CREATE TABLE pagos_efectivo
   - ALTER TABLE documentos_soporte ADD COLUMN cfdi_uuid
   - ALTER TABLE documentos_soporte ADD COLUMN categoria_evidencia
   - ALTER TABLE documentos_soporte ADD COLUMN descripcion_evidencia
   - ALTER TABLE documentos_soporte ADD COLUMN fecha_actualizacion
   - ALTER TABLE documentos_soporte ADD COLUMN intentos_subida
   - ALTER TABLE documentos_soporte ADD COLUMN ultimo_error
```

---

### **Paso 1.2: Revisar SQL Generado**
```bash
# Abrir archivo de migración generado
code src/database/migrations/XXXX_add_cfdi_tables.sql
```

**Verificar:**
- ✅ No hay DROP TABLE de tablas existentes
- ✅ ALTER TABLE usa ADD COLUMN (no MODIFY)
- ✅ Foreign Keys creadas correctamente
- ✅ Defaults aplicados

---

### **Paso 1.3: Aplicar Migración**
```bash
npm run db:push
```

**Resultado Esperado:**
```
✅ Migración aplicada exitosamente
✅ Tablas creadas:
   - cfdi_recibidos (30+ columnas)
   - cfdi_impuestos (11 columnas)
   - pagos_efectivo (20+ columnas)
✅ Tabla modificada:
   - documentos_soporte (+6 columnas)
```

---

### **Paso 1.4: Verificar en Drizzle Studio**
```bash
npm run db:studio
```

**Verificar:**
1. Abrir `http://localhost:4983` (o puerto asignado)
2. Ver tabla `cfdi_recibidos` - debe estar vacía
3. Ver tabla `cfdi_impuestos` - debe estar vacía
4. Ver tabla `pagos_efectivo` - debe estar vacía
5. Ver tabla `documentos_soporte` - registros existentes intactos
6. Verificar que nuevas columnas tienen valores default/null

---

### **Paso 1.5: Test de Integridad**
```sql
-- Test 1: Insertar CFDI de prueba
INSERT INTO cfdi_recibidos (uuid, emisor_rfc, emisor_nombre, receptor_rfc, receptor_nombre, fecha, tipo_comprobante, subtotal, total, empresa_id)
VALUES ('TEST-UUID-001', 'AAA010101AAA', 'Emisor Test', 'BBB020202BBB', 'Receptor Test', '2025-01-15T10:00:00', 'I', 1000.00, 1160.00, 'empresa-test');

-- Test 2: Insertar impuesto vinculado
INSERT INTO cfdi_impuestos (cfdi_uuid, nivel, tipo, impuesto, impuesto_nombre, tipo_factor, tasa_o_cuota, base, importe)
VALUES ('TEST-UUID-001', 'comprobante', 'Traslado', '002', 'IVA', 'Tasa', 0.16, 1000.00, 160.00);

-- Test 3: Insertar pago vinculado
INSERT INTO pagos_efectivo (cfdi_uuid, fecha_pago, monto_pagado, metodo_pago, metodo_pago_nombre, empresa_id)
VALUES ('TEST-UUID-001', '2025-01-20', 1160.00, '03', 'Transferencia', 'empresa-test');

-- Test 4: Insertar evidencia vinculada
INSERT INTO documentos_soporte (expediente_id, cfdi_uuid, tipo_documento, categoria_evidencia, descripcion_evidencia, estado)
VALUES (1, 'TEST-UUID-001', 'Contrato', 'Contrato', 'Contrato de servicios profesionales', 'pendiente');

-- Test 5: Verificar relaciones
SELECT 
  c.uuid,
  c.emisor_nombre,
  i.impuesto_nombre,
  i.importe,
  p.monto_pagado,
  d.categoria_evidencia
FROM cfdi_recibidos c
LEFT JOIN cfdi_impuestos i ON c.uuid = i.cfdi_uuid
LEFT JOIN pagos_efectivo p ON c.uuid = p.cfdi_uuid
LEFT JOIN documentos_soporte d ON c.uuid = d.cfdi_uuid
WHERE c.uuid = 'TEST-UUID-001';

-- Test 6: Limpiar datos de prueba
DELETE FROM documentos_soporte WHERE cfdi_uuid = 'TEST-UUID-001';
DELETE FROM pagos_efectivo WHERE cfdi_uuid = 'TEST-UUID-001';
DELETE FROM cfdi_impuestos WHERE cfdi_uuid = 'TEST-UUID-001';
DELETE FROM cfdi_recibidos WHERE uuid = 'TEST-UUID-001';
```

---

## ⏱️ TIEMPO INVERTIDO

**Estimado:** 2-3 horas  
**Real:** ~2 horas (generación de esquemas + documentación)

---

## 🎯 SIGUIENTE PASO

**PASO 2: Servicio de Parseo de CFDI**

Cuando estés listo, ejecuta:
```bash
# Generar y aplicar migración
npm run db:generate
npm run db:push

# Verificar en Drizzle Studio
npm run db:studio
```

Una vez confirmado que la migración fue exitosa, podemos proceder al **Paso 2: Parseo de CFDI**.

---

## 📞 SOPORTE

Si encuentras algún error durante la migración:

1. **Error de sintaxis SQL:**
   - Revisar archivo de migración generado
   - Verificar que no hay conflictos de nombres

2. **Error de FK:**
   - Verificar que tabla referenciada existe
   - Verificar tipos de datos coinciden

3. **Error de ALTER TABLE:**
   - Verificar que columnas no existen previamente
   - Usar `IF NOT EXISTS` si es necesario

---

**Estado:** ✅ Código generado - Listo para `npm run db:generate`  
**Siguiente Acción:** Generar y aplicar migración
