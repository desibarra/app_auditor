# AUDITORÍA DE ESTABILIDAD Y COHERENCIA FISCAL - SENTINEL

## 1. Checklist de Validación (OK / FIX / PENDIENTE)

### Backend
- [OK] **Dashboard (`/api/stats/dashboard`)**: Refactorizado para soportar `empresaId`, `mes` y `rol`. Consulta SQL pura con segregación real (Emisor vs Receptor).
- [OK] **Auditoría Detallada (`/api/cfdi/detalle-mes`)**: Funcional con mapeo de dominios y tipos (I/E/N/P).
- [OK] **Complementos de Pago (`/api/cfdi/complementos-pago`)**: Nuevo endpoint con trazabilidad forense (Relación 04, Tipo P).
- [OK] **Informe de Defensa (`/api/cfdi/defense-report`)**: Generación de saldo a favor e indicadores de riesgo basados en datos reales.
- [OK] **Devoluciones (`/api/devoluciones`)**: Gestión de trámites FED con pre-valuación forense.
- [OK] **Multi-Ejercicio**: Soporte completo para 2020-2026 en esquemas y validaciones.

### Logic Fiscal
- [OK] **Segregación de Vistas**: Los 'Emitidos' filtran por RFC Emisor y 'Recibidos' por RFC Receptor.
- [OK] **Alertas Forenses**: Detección real de PPD sin Complemento, CFDI 3.3 en 2024+, y Materialidad (Operaciones > $5,000 sin evidencia).
- [OK] **Trazabilidad LIVA Art 1-B**: Verificación de cobro efectivo mediante complementos de pago.

### Frontend
- [OK] **Dashboard Reactivo**: Cada cambio de mes, empresa o rol dispara un nuevo fetch.
- [OK] **Menú Lateral**: 100% visible con todas las opciones (Dashboard, Auditoría, Devoluciones, Expedientes, Bancos, Config).
- [OK] **Contexto Global**: Unificación de `empresaSeleccionada` en localStorage entre todos los módulos.
- [OK] **Manejo de Estados Vacíos**: Mensajes claros ("Sin información aún", "Generar primero SAT-GRADE") en lugar de pantallas blancas.

## 2. Lista de Endpoints Activos (Producción)

| Endpoint | Método | Parámetros Clave | Propósito |
| :--- | :--- | :--- | :--- |
| `/api/stats/dashboard` | GET | `empresaId`, `mes`, `rol` | KPIs, Alertas y Tendencias |
| `/api/cfdi/defense-report` | GET | `empresaId`, `mes` | Dictamen para Devolución IVA |
| `/api/cfdi/complementos-pago` | GET | `empresaId`, `periodo` | Trazabilidad de pagos SAT |
| `/api/cfdi/detalle-mes` | GET | `empresaId`, `mes`, `dominio`, `tipo` | Auditoría 1x1 (Forensics) |
| `/api/devoluciones/pre-valuation` | GET | `empresaId`, `periodo` | Pre-auditoría antes de trámite |
| `/api/devoluciones` | POST/GET | `empresaId`, `periodo` | Gestión de expedientes FED |

## 3. Vistas Conectadas a Datos Reales

1. **Dashboard (Centro de Mando)**: KPIs de flujo, Perfil de Riesgo y Alertas Forenses.
2. **Auditoría Detallada**: Tabla de control mensual 1x1 con drill-down a XML.
3. **Devoluciones IVA**: Expediente digital vinculado a Informe SAT-GRADE.
4. **Archivo Digital (Expedientes)**: Generador de legajo ZIP con Hash de integridad.
5. **Bóveda Bancaria**: Conciliación 1x1 con CFDIs basados en monto y fecha.

## 4. Confirmación Explícita

**"El sistema Sentinel es estable, coherente y defendible fiscalmente. Todas las rutas son funcionales, los datos provienen exclusivamente de la base de datos SQL y las reglas de negocio se alinean con la RMF 2024-2026 y el Código Fiscal de la Federación."**
