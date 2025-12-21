# 🏦 Módulo Bancos - Implementación Robusta de Importación Excel

## Estado Actual del Problema

El importador Excel actual falla con archivos reales de bancos mexicanos porque:
1. La detección de encabezados es muy estricta
2. No maneja variaciones en nombres de columnas
3. No filtra filas de totales/pie de página
4. El parsing de fechas es limitado
5. No hay logs suficientes para debug

## Solución Implementada

### Mejoras Clave

#### 1. Detección Inteligente de Encabezados
- **Palabras clave expandidas** para cada tipo de columna:
  - FECHA: 'FECHA', 'DATE', 'DIA', 'OPERACION', 'APLICACION'
  - DESCRIPCION: 'DESCRIPCION', 'CONCEPTO', 'DETALLE', 'MOVIMIENTO', 'LEYENDA'
  - CARGO: 'CARGO', 'CARGOS', 'RETIRO', 'DEBITO', 'EGRESO', 'SALIDA'
  - ABONO: 'ABONO', 'ABONOS', 'DEPOSITO', 'CREDITO', 'INGRESO', 'ENTRADA'
  - REFERENCIA: 'REFERENCIA', 'FOLIO', 'NO.', 'NUMERO'
  - MONTO: 'IMPORTE', 'MONTO', 'CANTIDAD', 'AMOUNT'

- **Escaneo flexible**: Busca en las primeras 30 filas
- **Validación mínima**: Solo requiere FECHA + (DESCRIPCION o MONTO)

#### 2. Filtrado de Filas No Válidas
- Omite filas vacías
- Detecta y salta filas con palabras clave de totales: 'TOTAL', 'SALDO FINAL', 'SUMA'
- Cuenta filas procesadas vs omitidas para debugging

#### 3. Parsing Robusto de Fechas
Soporta múltiples formatos:
- DD/MM/YYYY (formato mexicano estándar)
- DD-MM-YYYY
- MM/DD/YYYY (con heurística: si día > 12, es DD/MM)
- YYYY-MM-DD (ISO)
- Objetos Date de Excel
- Años de 2 dígitos (convierte a 20XX)

#### 4. Limpieza de Montos
- Remueve separadores de miles (,)
- Maneja signos negativos
- Soporta tanto números nativos como strings
- Tolerante a formatos variados

#### 5. Logging Detallado
```
📥 [BANCOS] Iniciando importación: estado_cuenta.xlsx (45KB)
✅ Header detectado en fila 3
📊 Procesadas 56 filas, 4 omitidas, 52 movimientos extraídos
🔍 Buscando coincidencias entre 52 movimientos y 120 CFDIs...
✅ Importación completada: 52 movimientos, 15 conciliados (29%)
```

## Formatos Soportados

### BBVA
```
Fecha | Descripción | Cargo | Abono | Saldo
01/11/2025 | PAGO PROVEEDOR | 1,500.00 | | 10,000.00
```

### Banorte
```
Día | Concepto | Retiros | Depósitos | Referencia
01 | TRANSFERENCIA SPEI | 2,500.00 | | 123456
```

### Santander
```
Fecha Operación | Detalle | Importe | Folio
2025-11-01 | COMPRA POS | -850.50 | ABC123
```

### BanBajío
```
Fecha | Leyenda | Cargo | Abono
01/11/25 | PAGO SERVICIO | 500.00 | 
```

## Conciliación Automática

### Criterios de Match
1. **Monto exacto** (tolerancia ±$0.50)
2. **Fecha cercana** (ventana de ±7 días)
3. **Tipo compatible** (opcional, por ahora match general)

### Resultados
- Movimientos conciliados marcados con ✅
- UUID del CFDI vinculado guardado
- Porcentaje de conciliación calculado
- Lista de no conciliados disponible para revisión manual

## Próximos Pasos Recomendados

### Corto Plazo (Esta Semana)
1. ✅ Parser robusto implementado
2. ⏳ Probar con archivos reales de KOPPARA y TRASLADOS
3. ⏳ Ajustar keywords si es necesario

### Mediano Plazo (Próximo Mes)
1. Preview de detección de columnas antes de importar
2. Mapeo manual de columnas si auto-detect falla
3. Validación de saldos (inicial + movimientos = final)
4. Alertas de movimientos sin CFDI

### Largo Plazo (Q1 2026)
1. Conexión directa con APIs bancarias (BBVA, Banorte)
2. Importación automática programada
3. Reglas de conciliación personalizables
4. Machine learning para mejorar matching

## Código de Prueba

Para probar manualmente:
```bash
# Backend logs
tail -f apps/backend/logs/bancos.log

# Test con curl
curl -X POST http://localhost:3000/api/bancos/import-excel \
  -F "file=@estado_cuenta.xlsx" \
  -F "empresaId=xxx" \
  -F "banco=BBVA" \
  -F "cuenta=1234" \
  -F "anio=2025" \
  -F "mes=11"
```

## Troubleshooting

### "No se encontraron encabezados"
- Verificar que el Excel tenga al menos columnas de FECHA y MONTO
- Revisar logs del backend para ver qué palabras detectó
- Asegurar que los encabezados estén en las primeras 30 filas

### "No se extrajeron movimientos válidos"
- Verificar formato de fechas (debe ser reconocible)
- Asegurar que haya montos numéricos
- Revisar que no todas las filas sean totales/resúmenes

### Conciliación baja
- Verificar que existan CFDIs en el sistema para ese periodo
- Ajustar ventana de fechas si es necesario (actualmente ±7 días)
- Revisar tolerancia de montos (actualmente ±$0.50)

## Conclusión

El módulo de Bancos ahora está listo para procesar archivos reales de bancos mexicanos. La implementación es:
- ✅ Robusta (maneja variaciones de formato)
- ✅ Flexible (múltiples formatos de fecha/monto)
- ✅ Inteligente (conciliación automática)
- ✅ Debuggeable (logs detallados)

**Estado**: LISTO PARA PRUEBAS CON DATOS REALES
