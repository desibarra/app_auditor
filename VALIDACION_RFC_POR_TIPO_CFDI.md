# 📋 DOCUMENTACIÓN RFC-FIRST POR TIPO DE CFDI

## Validación RFC Según Tipo de Comprobante

### Reglas de Negocio Implementadas

#### 1. CFDI Tipo "I" (Ingreso)
**Validación:** RFC **Receptor**

**Justificación:**
- El receptor es quien RECIBE el ingreso (nuestro cliente)
- La empresa debe ser el **receptor** del comprobante
- Si emitimos una factura de ingreso, nuestro RFC está como **emisor** (no aplica para import)

**Ejemplo:**
```xml
<cfdi:Comprobante TipoDeComprobante="I">
  <cfdi:Emisor Rfc="PROVEEDOR123" />  ← No validamos este
  <cfdi:Receptor Rfc="EMPRESA456" />  ← ✅ VALIDAMOS ESTE
</cfdi:Comprobante>
```

**Decision:**
- Si RFC receptor existe en empresas → `accept`
- Si RFC receptor NO existe → `reject`
- Si RFC receptor pertenece a otra empresa del sistema → `relocate`

---

#### 2. CFDI Tipo "E" (Egreso)
**Validación:** RFC **Receptor**

**Justificación:**
- Notas de crédito o devoluciones
- La empresa es el **receptor** de la nota
- Similar a Ingreso

**Ejemplo:**
```xml
<cfdi:Comprobante TipoDeComprobante="E">
  <cfdi:Emisor Rfc="PROVEEDOR123" />
  <cfdi:Receptor Rfc="EMPRESA456" />  ← ✅ VALIDAMOS ESTE
</cfdi:Comprobante>
```

**Decision:**
- Misma lógica que tipo "I"

---

#### 3. CFDI Tipo "N" (Nómina)
**Validación:** RFC **Emisor**

**Justificación:**
- La empresa EMITE las nóminas a sus empleados
- El receptor es el empleado (RFC individual)
- Validamos que nuestra empresa sea el **emisor**

**Ejemplo:**
```xml
<cfdi:Comprobante TipoDeComprobante="N">
  <cfdi:Emisor Rfc="EMPRESA456" />    ← ✅ VALIDAMOS ESTE
  <cfdi:Receptor Rfc="EMPLEADO789" />  ← Este es el trabajador
</cfdi:Comprobante>
```

**Decision:**
- Si RFC emisor existe en empresas → `accept`
- Si RFC emisor NO existe → `reject`
- Si RFC emisor pertenece a otra empresa → `relocate`

---

#### 4. CFDI Tipo "P" (Pago)
**Validación:** RFC **Receptor** (permisivo)

**Justificación:**
- Complementos de pago pueden tener terceros involucrados
- Relacionan pagos con facturas anteriores
- Se permite más flexibilidad

**Ejemplo:**
```xml
<cfdi:Comprobante TipoDeComprobante="P">
  <cfdi:Emisor Rfc="BANCO123" />       ← Puede ser banco o tercero
  <cfdi:Receptor Rfc="EMPRESA456" />   ← ✅ PREFERIMOS VALIDAR ESTE
</cfdi:Comprobante>
```

**Decision:**
- Si RFC receptor existe → `accept`
- Si RFC receptor NO existe pero emisor SÍ → `accept` + auditar relación
- Si ninguno existe → `reject`

---

#### 5. CFDI Tipo "T" (Traslado)
**Validación:** RFC **Receptor** o **Emisor** (flexible)

**Justificación:**
- Carta porte para movimiento de mercancías
- Puede involucrar múltiples partes
- Validamos cualquiera de los dos

**Ejemplo:**
```xml
<cfdi:Comprobante TipoDeComprobante="T">
  <cfdi:Emisor Rfc="EMPRESA456" />
  <cfdi:Receptor Rfc="CLIENTE789" />
</cfdi:Comprobante>
```

**Decision:**
- Si cualquier RFC (emisor o receptor) existe → `accept`
- Si ninguno existe → `reject`

---

## Matriz de Validación

| Tipo | Descripción  | RFC Validado | Rechaza si no existe | Relocate si otra empresa |
|------|-------------|--------------|---------------------|-------------------------|
| I    | Ingreso     | Receptor     | ✅ SÍ               | ✅ SÍ                   |
| E    | Egreso      | Receptor     | ✅ SÍ               | ✅ SÍ                   |
| N    | Nómina      | Emisor       | ✅ SÍ               | ✅ SÍ                   |
| P    | Pago        | Receptor*    | ❌ NO (permisivo)   | ✅ SÍ                   |
| T    | Traslado    | Ambos**      | ✅ SÍ               | ✅ SÍ                   |

\* Si receptor no existe, intenta con emisor  
\*\* Acepta si cualquiera de los dos existe

---

## Logging Obligatorio por Evento

Para CADA carga de CFDI se registran:

```typescript
{
  rfc_emisor_detectado: string,
  rfc_receptor_detectado: string,
  tipo_comprobante: 'I' | 'E' | 'N' | 'P' | 'T',
  empresa_solicitada: string | null,
  empresa_asignada: string,
  decision: 'accept' | 'relocate' | 'reject',
  razon: string,
  timestamp: number,
  usuario_id: string | null,
  ip_address: string
}
```

---

## Casos de Prueba

### Caso 1: CFDI Ingreso - RFC Correcto
```json
{
  "tipo": "I",
  "emisor_rfc": "AAA010101AAA",
  "receptor_rfc": "EMPRESA123",
  "empresa_solicitada": "emp_001",
  "empresas_registradas": [
    { "id": "emp_001", "rfc": "EMPRESA123" }
  ]
}
```
**Resultado:**
- ✅ Decision: `accept`
- ✅ Empresa asignada: `emp_001`
- ✅ Razón: "RFC receptor coincide con empresa registrada"

---

### Caso 2: CFDI Ingreso - RFC de Otra Empresa
```json
{
  "tipo": "I",
  "emisor_rfc": "AAA010101AAA",
  "receptor_rfc": "OTRA_EMPRESA456",
  "empresa_solicitada": "emp_001",
  "empresas_registradas": [
    { "id": "emp_001", "rfc": "EMPRESA123" },
    { "id": "emp_002", "rfc": "OTRA_EMPRESA456" }
  ]
}
```
**Resultado:**
- ⚠️  Decision: `relocate`
- ✅ Empresa asignada: `emp_002`
- ⚠️  Razón: "RFC receptor pertenece a otra empresa (auto-corrección)"
- 🔔 Genera Security Event nivel MEDIUM

---

### Caso 3: CFDI Nómina - RFC Emisor
```json
{
  "tipo": "N",
  "emisor_rfc": "EMPRESA123",
  "receptor_rfc": "EMPLEADO789XXX",
  "empresa_solicitada": "emp_001",
  "empresas_registradas": [
    { "id": "emp_001", "rfc": "EMPRESA123" }
  ]
}
```
**Resultado:**
- ✅ Decision: `accept`
- ✅ Empresa asignada: `emp_001`
- ✅ Razón: "RFC emisor coincide (nómina)"
- ℹ️  RFC receptor es empleado (ignorado)

---

### Caso 4: CFDI Pago - RFC No Existe (Permisivo)
```json
{
  "tipo": "P",
  "emisor_rfc": "BANCO123456",
  "receptor_rfc": "EMPRESA123",
  "empresa_solicitada": null,
  "empresas_registradas": [
    { "id": "emp_001", "rfc": "EMPRESA123" }
  ]
}
```
**Resultado:**
- ✅ Decision: `accept`
- ✅ Empresa asignada: `emp_001`
- ⚠️  Razón: "RFC receptor encontrado (complemento de pago)"
- 🔔 Se audita relación con banco

---

### Caso 5: CFDI Ingreso - RFC Inexistente
```json
{
  "tipo": "I",
  "emisor_rfc": "AAA010101AAA",
  "receptor_rfc": "NOEXISTE999",
  "empresa_solicitada": null,
  "empresas_registradas": [
    { "id": "emp_001", "rfc": "EMPRESA123" }
  ]
}
```
**Resultado:**
- ❌ Decision: `reject`
- ❌ HTTP 400 Bad Request
- ❌ Mensaje: "El RFC NOEXISTE999 no está registrado. Por favor, registra la empresa primero en Configuración > Empresas."
- 🔔 Se audita como intento rechazado

---

## Implementación en Código

Ver: `rfc-validator.middleware.ts` líneas 90-150

Lógica principal:
```typescript
switch (cfdiData.tipoComprobante) {
  case 'I':
  case 'E':
    rfc = cfdiData.receptorRfc;
    break;
  
  case 'N':
    rfc = cfdiData.emisorRfc;
    break;
  
  case 'P':
    rfc = cfdiData.receptorRfc || cfdiData.emisorRfc;
    break;
  
  case 'T':
    rfc = cfdiData.receptorRfc || cfdiData.emisorRfc;
    break;
}
```

---

## Defensa Fiscal

Esta documentación sirve para:

1. **Auditoría SAT:** Demostrar proceso de validación robusto
2. **Devoluciones:** Evidenciar que los CFDIs son legítimos
3. **Compliance:** Cumplir con requisitos de trazabilidad
4. **Investigaciones:** Explicar por qué un CFDI está en cierta empresa

**Última actualización:** 20 de Diciembre, 2025  
**Versión:** 2.0 - RFC-First Zero-Trust
