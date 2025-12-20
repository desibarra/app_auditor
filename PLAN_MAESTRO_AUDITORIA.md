# PLAN MAESTRO DE AUDITORÍA Y BLINDAJE FISCAL 360°

Este documento define la hoja de ruta estratégica para evolucionar la plataforma **SaaS Fiscal** de un gestor de archivos a un **Sistema de Defensa Fiscal Integral**. El objetivo es automatizar la creación de la "Sustancia Económica" y la "Materialidad" de las operaciones para resistir cualquier revisión electrónica del SAT.

---

## 🏗️ 1. Estatus Actual (Diagnóstico)

A la fecha, el sistema cuenta con los pilares fundamentales de la auditoría digital:

*   **✅ Motor de XMLs:** Importación, parsing y almacenamiento estructurado de CFDI v4.0.
*   **✅ Verificación SAT Real-Time:** Conexión SOAP directa con el SAT para validar estatus "Vigente/Cancelado" al segundo.
*   **✅ Gestión de Materialidad:** Módulo para cargar y vincular Evidencias (Contratos, Entregables) por UUID.
*   **✅ Dictamen Automático:** Generación de Legajos PDF con resumen financiero, cálculo de IVA estimado y cruce de validaciones (Filtro estricto por Fecha de Timbrado).

---

## 🗺️ 2. Hoja de Ruta por Etapas (Plano Maestro)

### 🟢 ETAPA 1: Flujo de Efectivo y Sustancia Bancaria (Prioridad Inmediata)
*El dinero es la evidencia final. Sin flujo de efectivo rastreable, la operación es inexistente para la autoridad.*

1.  **Módulo de Estados de Cuenta:**
    *   ✅ **[CÓDIGO LISTO]** Interfaz para carga mensual de PDFs bancarios (Santander, Banbajío, BBVA).
    *   ✅ **[CÓDIGO LISTO]** Simulación de OCR para demo de conciliación.
2.  **Conciliación 1:1 (Matchmaker):**
    *   ✅ **[CÓDIGO LISTO]** Endpoint de vinculación `Movimiento <-> CFDI`.
    *   ✅ **[UI LISTA]** Tabla de movimientos con botón de "Conciliar".
3.  **Validación de Pago en Dictamen:**
    *   Actualizar `LegajoService` para que el PDF incluya una columna "Bancarizado: SÍ/NO" y anexe el fragmento del estado de cuenta como evidencia probatoria.

### 🟡 ETAPA 2: Trazabilidad de Ingresos y Tasa 0% (Logística y Comercio Exterior)
*Para empresas como Comercializadoras o Exportadoras, la materialidad está en el movimiento físico de mercancías.*

1.  **Combo de Exportación (Checklist Inteligente):**
    *   Si el CFDI es de Ingreso con Tasa 0% o Cliente Extranjero, activar requisitos obligatorios:
        *   Pedimento de Exportación.
        *   DODA / PITA.
        *   Carta Porte (Complemento o archivo físico de transporte).
        *   Remisiones o "Packing List".
2.  **Validación de Ruta:**
    *   Campos estructurados para registrar Origen y Destino de la mercancía, trazando la ruta lógica desde el domicilio fiscal.

### 🟠 ETAPA 3: Sustancia Laboral e Infraestructura
*Demostrar que la empresa tiene la capacidad humana y material para prestar el servicio o producir el bien.*

1.  **Expediente de Nómina Mensual:**
    *   Carga de listas de asistencia firmadas (PDF).
    *   Acuses de pago de declaraciones de Retenciones de ISR y Cuotas IMSS (SUA/SIPARE).
2.  **Padrón de Activos (Infraestructura):**
    *   Repositorio digital de Títulos de Propiedad, Contratos de Renta de Bodegas y Tarjetas de Circulación (crítico para Autotransporte).

### 🔴 ETAPA 4: Inteligencia de Defensa y Narrativa
*La "Razón de Negocios" explicada en lenguaje humano para el auditor.*

1.  **Memoria Descriptiva (Generador de Escritos):**
    *   Formularios para redactar la "Historia de la Operación": ¿Cómo se contactó al proveedor? ¿Quién es el enlace? ¿Cómo se entregó el servicio?
    *   Generación automática de Diagramas de Flujo del proceso operativo.
2.  **Conciliación Contable (Balanza de Comprobación):**
    *   Módulo para importar XML de Balanza de Comprobación o Auxiliares.
    *   Cruce automático: `Total CFDI vs. Total Contable vs. Total Declarado`.

---

## 📡 3. Reglas de Oro para el Agente (Compliance)

Estas reglas son inquebrantables en el desarrollo del código:

1.  **📅 Fecha de Certificación (Timbrado):**
    *   Todos los reportes, filtros y cierres mensuales se basan EXCLUSIVAMENTE en la fecha de certificación (`FechaTimbrado`) del SAT. La fecha de emisión es irrelevante para efectos de flujo de impuestos.
2.  **✅ Filtro de Vigencia Estricto:**
    *   Solo los CFDIs con estatus `Vigente` (verificado en tiempo real) suman a los totales. Los `Cancelados` se excluyen y se alertan.
3.  **🏭 Flexibilidad Multi-Giro:**
    *   La UI debe adaptarse. Si la empresa es "Koppara" (Comercializadora), prioriza pedimentos. Si es "Vanguardia" (Transporte), prioriza Cartas Porte y Activos.

---

## 🚀 Próxima Misión: Implementación FinTech (Etapa 1)

**Objetivo:** Cerrar el ciclo de auditoría vinculando el **CFDI** con el **Movimiento Bancario**.

1.  Crear tabla `movimientos_bancarios` en base de datos.
2.  Crear UI "Bóveda Bancaria" en Frontend.
3.  Implementar lógica de conciliación.
