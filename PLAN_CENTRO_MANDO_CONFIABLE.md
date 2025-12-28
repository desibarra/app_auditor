# CENTRO DE MANDO FISCAL - PLAN DE IMPLEMENTACIÓN

## ✅ ESTADO ACTUAL (Ya Implementado)

### 1. Estado Maestro Global ✅
```typescript
- empresaSeleccionada: string | null
- empresaData: { razonSocial, rfc, sector, regimenFiscal, lastUpdate }
- tabPrincipal: 'emitidos' | 'recibidos'
- subTab: 'ingresos' | 'nomina' | 'pagos' | 'gastos' | 'notas_credito'
- filtros: { mes, fechaInicio, fechaFin }
```

### 2. Hook de Métricas Reactivo ✅
```typescript
useMetricasDominio(empresaSeleccionada, getEndpoint(), filtros)
```
- Se actualiza automáticamente cuando cambian los filtros
- Retorna: metricas, loading, error

### 3. Componentes Conectados ✅
- ContextBar: Recibe sector y regimenFiscal dinámicos
- FiscalCharts: Recibe historico y topConcentracion
- Selectores: Empresa, Periodo, Tipo de Flujo

## 🔧 MEJORAS NECESARIAS

### 1. Eliminar Ceros Falsos ⚠️

**Problema Actual**:
```tsx
{metricasSafe.cfdi_del_mes || 0}  // Muestra "0" sin contexto
```

**Solución**:
```tsx
{!empresaSeleccionada ? (
    <div className="text-gray-500 text-sm">Seleccione empresa</div>
) : loadingMetrics ? (
    <div className="text-gray-500 text-sm">Cargando...</div>
) : metricasSafe.cfdi_del_mes ? (
    <span>{metricasSafe.cfdi_del_mes}</span>
) : (
    <div className="text-yellow-500 text-sm">
        Sin datos para este periodo
        <div className="text-xs text-gray-500 mt-1">
            💡 Importe CFDIs de {filtros.mes}
        </div>
    </div>
)}
```

### 2. Gráfica de Tendencia Dinámica ⚠️

**Problema Actual**:
- Usa `dashboardData?.historico` (endpoint diferente)
- No responde a filtros de tipo de flujo

**Solución**:
- Usar datos del hook `useMetricasDominio`
- Agregar `historico` al response del backend
- Filtrar por tipo de flujo seleccionado

### 3. Perfil Fiscal Dinámico ✅ (Parcial)

**Ya Implementado**:
- Lee sector y régimen de configuración
- Mapea códigos SAT a nombres

**Pendiente**:
- Detectar automáticamente por CFDIs si no está configurado
- Mostrar alertas según complementos detectados

### 4. Consistencia Total ⚠️

**Problema**:
- KPIs usan `useMetricasDominio`
- Gráfica usa `dashboardData` (endpoint diferente)
- No hay garantía de consistencia

**Solución**:
- TODO desde el mismo hook
- Mismos filtros, mismo endpoint, mismos datos

## 📋 PLAN DE ACCIÓN

### FASE 1: Estados Vacíos Inteligentes
1. Agregar componente `EmptyState`
2. Reemplazar ceros por estados contextuales
3. Mostrar loading states

### FASE 2: Gráfica de Tendencia
1. Agregar `historico` al hook `useMetricasDominio`
2. Pasar datos filtrados a `FiscalCharts`
3. Mensaje educativo si < 2 meses

### FASE 3: Validación de Consistencia
1. Verificar que KPIs = Gráfica = Tabla
2. Agregar logs de debugging
3. Tests de integración

### FASE 4: Perfil Fiscal Inteligente
1. Detectar giro por CFDIs más frecuentes
2. Detectar complementos (Carta Porte, etc.)
3. Alertas dinámicas según actividad

## 🎯 CRITERIOS DE ÉXITO

✅ Nunca mostrar $0 sin explicación
✅ Todo responde a los mismos filtros
✅ Gráfica muestra datos del periodo seleccionado
✅ Perfil Fiscal refleja actividad real
✅ Contador puede confiar 100% en los datos

## 📝 ARCHIVOS A MODIFICAR

1. `DashboardPage.tsx` - Lógica de estados vacíos
2. `useMetricasDominio.ts` - Agregar histórico
3. `FiscalCharts.tsx` - Usar datos del hook
4. `cfdi.service.ts` - Retornar histórico filtrado
5. `ContextBar.tsx` - Detección automática de giro

## ⏱️ ESTIMACIÓN

- Fase 1: 30 min
- Fase 2: 45 min
- Fase 3: 15 min
- Fase 4: 60 min

**Total: ~2.5 horas**

## 🚀 PRIORIDAD

1. **CRÍTICO**: Eliminar ceros falsos (confusión)
2. **ALTO**: Gráfica dinámica (inconsistencia)
3. **MEDIO**: Perfil fiscal inteligente (mejora UX)
4. **BAJO**: Validación exhaustiva (nice to have)
