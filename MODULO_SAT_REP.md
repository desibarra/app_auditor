# 📊 MÓDULO REPORTE SAT - FLUJO DE EFECTIVO (REP)

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend
- [x] Servicio `ReportesService` creado
- [x] Controlador `ReportesController` creado
- [x] Módulo `ReportesModule` registrado en `app.module.ts`
- [x] Endpoint `GET /api/reportes/sat-rep` expuesto

### Frontend
- [x] Página `ReporteSatRepPage.tsx` creada
- [x] Ruta `/reportes/sat-rep` registrada en `App.tsx`
- [x] Enlace agregado al menú de navegación
- [x] Librería `xlsx` disponible para exportación

---

## 🧪 VALIDACIÓN FINAL

### Paso 1: Verificar Endpoint Backend
```bash
# Probar endpoint directamente (reemplazar IDs reales)
curl "http://localhost:3000/api/reportes/sat-rep?empresaId=TU_EMPRESA_ID&year=2025"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "year": "2025",
  "empresaId": "...",
  "data": [
    {
      "periodo": "2025-12",
      "flujo": "COBRADO",
      "totalReps": 5,
      "totalEfectivo": 50000,
      "baseIva16": 43103.45,
      "iva16": 6896.55,
      "baseIva8": 0,
      "iva8": 0,
      "baseIva0": 0,
      "isrRetenido": 0,
      "ivaRetenido": 0,
      "ieps": 0
    }
  ],
  "metadata": {
    "generadoEn": "2026-01-02T...",
    "fuenteDatos": "CFDI Tipo P (REP 2.0)",
    "advertencia": "Este reporte muestra FLUJO DE EFECTIVO REAL, no facturación devengada."
  }
}
```

### Paso 2: Verificar Frontend
1. Navegar a: `http://localhost:5173/reportes/sat-rep`
2. Seleccionar empresa en el header global
3. Seleccionar año (2025, 2024, etc.)
4. Verificar que la tabla muestre datos
5. Probar exportación a Excel

### Paso 3: Comparar con Reporte SAT Real
**CRÍTICO:** Para validar que el módulo es APTO:

1. Descargar reporte oficial del SAT para un mes específico
2. Comparar cifras:
   - Total de REPs
   - Total de efectivo
   - Bases de IVA por tasa
   - Impuestos trasladados
   - Retenciones

**Si las cifras cuadran → Módulo APTO ✅**
**Si hay diferencias → Investigar origen de discrepancia ⚠️**

---

## 📋 ESTRUCTURA DE DATOS

### Query SQL Principal
El reporte se genera con 2 CTEs:

1. **`pagos_base`**: Extrae todos los REPs del año
   - Fuente: `cfdi_recibidos` WHERE `tipo_comprobante = 'P'`
   - JOIN con `cfdi_relaciones` para obtener `imp_pagado`

2. **`impuestos_pago`**: Agrupa impuestos de los REPs
   - Fuente: `cfdi_impuestos` WHERE `nivel = 'pago'`
   - Agrupa por tipo de impuesto y tasa

### Columnas del Reporte
| Campo | Descripción | Fuente |
|-------|-------------|--------|
| `periodo` | Año-Mes (YYYY-MM) | `strftime('%Y-%m', fecha)` |
| `flujo` | COBRADO / PAGADO | `rol` (EMITIDO/RECIBIDO) |
| `totalReps` | Cantidad de REPs | `COUNT(DISTINCT rep_uuid)` |
| `totalEfectivo` | Dinero real | `SUM(imp_pagado)` |
| `baseIva16` | Base gravada 16% | `SUM(base) WHERE tasa = 0.16` |
| `iva16` | IVA trasladado 16% | `SUM(importe) WHERE tasa = 0.16` |
| `baseIva8` | Base gravada 8% | `SUM(base) WHERE tasa = 0.08` |
| `iva8` | IVA trasladado 8% | `SUM(importe) WHERE tasa = 0.08` |
| `baseIva0` | Base exenta | `SUM(base) WHERE tasa = 0.00` |
| `isrRetenido` | ISR retenido | `SUM(importe) WHERE tipo = '001'` |
| `ivaRetenido` | IVA retenido | `SUM(importe) WHERE tipo = '002' AND negativo` |
| `ieps` | IEPS | `SUM(importe) WHERE tipo = '003'` |

---

## ⚠️ ADVERTENCIAS IMPORTANTES

### 1. Dependencia de REPs
Este reporte **SOLO** muestra flujo de efectivo si:
- Los Complementos de Pago (REP) están cargados en el sistema
- Los REPs tienen correctamente registrados los impuestos en `cfdi_impuestos` con `nivel = 'pago'`

### 2. No es Facturación Devengada
- Este reporte NO muestra facturas emitidas/recibidas
- Solo muestra dinero realmente cobrado/pagado según REPs
- Puede diferir significativamente del Dashboard general

### 3. Validación Obligatoria
Antes de usar este módulo en producción:
- Comparar al menos 3 meses contra reportes SAT oficiales
- Verificar que las bases de IVA cuadren
- Validar que las retenciones coincidan

---

## 🔧 TROUBLESHOOTING

### Problema: "Sin Complementos de Pago (REP) en XXXX"
**Causa:** No hay CFDIs tipo 'P' en ese año
**Solución:** Importar XMLs de Complementos de Pago

### Problema: "Bases de IVA en 0"
**Causa:** Los impuestos no están registrados en `cfdi_impuestos` con `nivel = 'pago'`
**Solución:** Verificar que el parser de REP 2.0 esté extrayendo `ImpuestosP`

### Problema: "Cifras no cuadran con SAT"
**Causas posibles:**
1. Falta importar algunos REPs
2. REPs cancelados no filtrados correctamente
3. Diferencia en criterio de agrupación (fecha de pago vs fecha de factura)

**Solución:** Revisar logs del backend y comparar UUID por UUID

---

## 📊 EJEMPLO DE USO

### Caso: Devolución de IVA
1. Ir a `/reportes/sat-rep`
2. Seleccionar año del ejercicio fiscal
3. Filtrar solo "COBRADO" (flujo de ingresos)
4. Exportar a Excel
5. Usar columnas `baseIva16` e `iva16` para calcular IVA acreditable
6. Comparar con reporte oficial del SAT
7. Si cuadra → Usar como soporte de devolución

---

## 🎯 ESTADO DEL MÓDULO

**Versión:** 1.0.0
**Estado:** ✅ IMPLEMENTADO
**Validación:** ⏳ PENDIENTE (Requiere comparación con datos SAT reales)
**Apto para producción:** ⚠️ SOLO DESPUÉS DE VALIDACIÓN

---

## 📝 NOTAS TÉCNICAS

### Optimizaciones Aplicadas
- Query SQL optimizado con CTEs para mejor rendimiento
- Índices recomendados:
  ```sql
  CREATE INDEX idx_cfdi_tipo_fecha ON cfdi_recibidos(tipo_comprobante, fecha);
  CREATE INDEX idx_cfdi_impuestos_nivel ON cfdi_impuestos(nivel, tipo_impuesto);
  ```

### Limitaciones Conocidas
1. No soporta múltiples monedas (asume MXN)
2. No incluye tipo de cambio para REPs en USD
3. No diferencia entre parcialidades de un mismo CFDI

### Próximas Mejoras (Opcional)
- [ ] Filtro por mes específico (no solo año completo)
- [ ] Gráfica de tendencia de flujo de efectivo
- [ ] Comparación año vs año
- [ ] Detalle drill-down por REP individual
