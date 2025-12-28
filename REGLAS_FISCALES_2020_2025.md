# Reglas Fiscales Multi-Ejercicio Sentinel (2020-2025)

## Matriz de Validación Cronológica

### 1. Versionado de CFDI
- **2020 - 2021**: CFDI 3.3 obligatorio.
- **2022**: Periodo de convivencia (CFDI 3.3 y 4.0 válidos).
- **2023**: CFDI 4.0 obligatorio (marzo/abril en adelante).
  - *Sentinel:* Marca error CRÍTICO si detecta 3.3 en 2024+.

### 2. Complemento de Recepción de Pagos (REP)
- **2020 - 2021**: REP 1.0 válido.
- **2022**: Convivencia REP 1.0 y 2.0.
- **2023+**: REP 2.0 Obligatorio.
  - *Validación:* Estructura de `DoctoRelacionado` con desglose de impuestos (ObjetoImpDR).

### 3. Carta Porte (Traslado y Mercancías)
| Año | Requisito | Acción Sentinel |
| :--- | :--- | :--- |
| **2020-2021** | No exigible (Guía de llenado anterior) | Ignora validación CP. |
| **2022** | Entrada CP 2.0 (Periodo gracia) | Valida existencia si es Tipo 'T'. Alerta si falta. |
| **2023** | CP 2.0 Obligatorio / Inicio 3.0 | Error CRÍTICO si Tipo 'T' no tiene CP. Valida estructura básica. |
| **2024+** | CP 3.0 / 3.1 Obligatorio | Error CRÍTICO. Valida: Logística, Coherencia Peso/Dist, Internacional. |

## Reporte de Pagos y Complementos (SAT-Grade)
Nuevo módulo de auditoría que cruza:
`Facturas PPD (Ingresos)` vs `Complementos de Pago (REP)`

**Estados Fiscales:**
1.  **NO ACREDITABLE**: Factura PPD sin ningún complemento de pago asociado en el sistema. (Riesgo Fatal).
2.  **PARCIALMENTE ACREDITABLE**: El monto pagado en los complementos < Total Factura. (Solo acreditar IVA proporcional).
3.  **ACREDITABLE**: Pagado al 100% con REP válido.
4.  **PENDIENTE**: Sin pagos registrados aún (dentro del mes corriente).

### Reglas de Negocio
- Un PPD requiere forzosamente un REP para efectos de IVA (Art 1-B LIVA).
- El REP debe ser del mes que se acredita o anterior (Flujo de Efectivo).
