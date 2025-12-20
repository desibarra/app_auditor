# VALIDACION ENDPOINTS EMITIDOS - SQL vs API

**Protocolo:** SAT-Grade v1.0 - SQL PRIMERO
**Fecha:** 2025-12-20T19:21:24.507Z

---

## EMPRESA DE PRUEBA

- ID: empresa-tva060209ql6
- RFC: TVA060209QL6

---

## A) VALIDACIÓN: RESUMEN MENSUAL EMITIDOS

### QUERY SQL DIRECTA (Fuente Primaria)

```sql
SELECT
  strftime('%Y-%m', fecha) AS periodo,
  COUNT(*) AS total_cfdis,
  SUM(total) AS total_importe,
  COUNT(DISTINCT receptor_rfc) AS clientes
FROM cfdi_recibidos
WHERE emisor_rfc = 'TVA060209QL6'
GROUP BY periodo
ORDER BY periodo DESC;
```

### RESULTADO SQL:

| Período | CFDIs | Importe | Clientes |
|---------|-------|---------|----------|
| 2025-12 | 329 | $1,917,776.26 | 25 |
| 2025-10 | 797 | $5,557,808.78 | 28 |
| 2025-08 | 980 | $9,110,812.72 | 33 |
| 2025-07 | 139 | $5,286,534.32 | 16 |

**Total registros:** 4

---

## B) VALIDACIÓN: MÉTRICAS EMITIDOS

### Período de prueba: 2025-12

### QUERY SQL DIRECTA (Fuente Primaria)

```sql
SELECT
  COUNT(*) AS cfdis_mes,
  SUM(total) AS importe_mes,
  COUNT(DISTINCT receptor_rfc) AS clientes_mes
FROM cfdi_recibidos
WHERE emisor_rfc = 'TVA060209QL6'
  AND strftime('%Y-%m', fecha) = '2025-12';
```

### RESULTADO SQL:

- CFDIs del mes: 329
- Importe total: $1,917,776.26
- Clientes activos: 25

- CFDIs cargados hoy: 2245

- Total general emitidos: 2245

---

## C) VALIDACIÓN DE LÓGICA

### Separación Emitidos vs Recibidos:

- CFDIs EMITIDOS (emisor_rfc): 2245
- CFDIs RECIBIDOS (receptor_rfc): 8259

**¿Están separados?** ✅ SÍ

---

## D) CHECKLIST DE ACEPTACIÓN

**El agente debe responder SÍ / NO:**

- [ ] ¿El endpoint responde sin error? → **PENDIENTE VALIDAR**
- [x] ¿Los números vienen de SQL? → **SÍ**
- [x] ¿Los periodos son correctos? → **SÍ**
- [x] ¿No hay datos mezclados con recibidos? → **SÍ**
- [x] ¿La lógica usa SOLO emisor_rfc? → **SÍ**

---

## E) DATOS ESPERADOS DEL ENDPOINT

### Endpoint: `/api/cfdi/emitidos/resumen-mensual?empresaId=empresa-tva060209ql6`

**Debe retornar:**

```json
{
  "success": true,
  "resumen": [
    {
      "mes": "2025-12",
      "total": 329,
      "importe_total": 1917776.26,
      "clientes": 25
    },
    {
      "mes": "2025-10",
      "total": 797,
      "importe_total": 5557808.78,
      "clientes": 28
    },
    {
      "mes": "2025-08",
      "total": 980,
      "importe_total": 9110812.72,
      "clientes": 33
    },
    {
      "mes": "2025-07",
      "total": 139,
      "importe_total": 5286534.32,
      "clientes": 16
    }
  ],
  "total_meses": 4
}
```

### Endpoint: `/api/cfdi/emitidos/metricas?empresaId=empresa-tva060209ql6&mes=2025-12`

**Debe retornar:**

```json
{
  "success": true,
  "metricas": {
    "cfdi_del_mes": 329,
    "importe_total_mes": 1917776.26,
    "clientes_activos": 25,
    "cargados_hoy": 2245,
    "total_general": 2245
  },
  "periodo": "2025-12",
  "empresa_rfc": "TVA060209QL6"
}
```

---

## ✅ SQL VALIDADO - LISTO PARA COMPARAR CON ENDPOINT

