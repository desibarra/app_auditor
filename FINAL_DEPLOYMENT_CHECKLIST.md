# ✅ CHECKLIST DE DESPLIEGUE: SENTINEL AUDIT

## 1. Validación de Caso Real (Devolución IVA Autotransporte)
- [x] **Flujo:** Ingreso (CFDI 'I') -> Evidencia -> Blindaje.
- [x] **Upload:** Se corrigió el error `NOT NULL constraint` mediante la inyección del folio de control (`AUDIT-YYYY-MM`).
- [x] **Score:** El cálculo de blindaje y la lista de faltantes (Carta Porte) funcionan correctamente.
- [x] **Visor XML:** Modo solo lectura validado con CFDI real.

## 2. Calidad de Código
- [x] **Frontend:** `TablaControlMensualDominio`, `ListaEvidencias`, `UploadEvidencia`, `XmlVisorModal` integrados y sin errores de compilación.
- [x] **Linting:** Warnings menores limpiados o aceptables (imports no usados eliminados logicamente).
- [x] **Backend:** Endpoints de `/api/evidencias` y `/api/cfdi` alineados con el frontend.

## 3. UX/UI (Sentinel Grade)
- [x] **Dark Mode:** Implementado en módulos críticos de riesgo (Evidencias).
- [x] **Feedback:** Mensajes de "No Data" y "Cargando" claros.
- [x] **Navegación:** Paginación y botones de acción responsivos.

## 4. Próximos Pasos (Post-Despliegue)
1.  **Monitoreo:** Vigilar logs de `folio_control` en producción para asegurar consistencia con módulos contables.
2.  **Backup:** Realizar respaldo de `expedientes_devolucion_iva` antes de cargas masivas.

---
**ESTADO: GO FOR LAUNCH 🚀**
**Versión:** 1.0.4-Sentinel
**Fecha:** 2025-12-20
