# FORENSIC REPORT: DB CORRUPTION & PROTOCOL SANEAMIENTO

**Fecha:** 2025-12-30
**Modulo:** Sentinel Core Database
**Estatus:** DESCARTE Y REEMPLAZO OBLIGATORIO

## 1. Motivo de Descarte
Durante la auditoría técnica del 2025-12-30, se detectó una corrupción estructural en el esquema de la base de datos principal (`dev.db`).

## 2. Error Detectado
`SQLITE_CORRUPT: malformed database schema (audit_logs) - invalid rootpage`

Este error indica que las páginas raíz del árbol B de SQLite para la tabla `audit_logs` perdieron integridad física, imposibilitando consultas relacionales seguras y garantizando inconsistencias en los conteos de CFDIs.

## 3. Riesgos Evitados con el Saneamiento
- **Pérdida de Trazabilidad:** Las operaciones no se registraban correctamente.
- **Inconsistencia Fiscal:** Los totales de Ingresos/Egresos eran calculados sobre un almacenamiento inestable.
- **Falsos Duplicados:** La lógica de deduplicación fallaba al no poder consultar el índice corrupto.

## 4. Protocolo Ejecutado
1. Congelamiento de procesos Node.js.
2. Respaldo forense en `/apps/backend/legacy_corrupt/`.
3. Creación de nueva infraestructura de datos `dev_clean.db`.
4. Reforzamiento de restricciones `UNIQUE (uuid, empresa_id)`.

---
**Dictamen:** No se recomienda el uso de herramientas de reparación. El riesgo de datos fantasma es inaceptable para una auditoría fiscal SAT-Grade.
