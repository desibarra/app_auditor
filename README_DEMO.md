# 🎮 MODO DEMO: SENTINEL AUDIT ENGINE

Este modo permite realizar demostraciones "Offline" o sin backend poblado, inyectando datos forenses realistas directamente en la interfaz.

## 🚀 Cómo Activar
El modo demo está **ACTIVADO POR DEFECTO** en el código entregado.
Variables de control:
- `hooks/useMetricasDominio.ts`: `const USE_DEMO_MODE = true;`
- `components/TablaControlMensualDominio.tsx`: `const USE_DEMO_MODE = true;`

## 📊 Datos Inyectados
### 1. Dashboard
- **Periodo:** Septiembre 2025.
- **Empresa:** `demo-forense.com.mx` (Rol: Emisor).
- **KPIs:** 
  - Ingresos: $4,528,900.50
  - CFDI del Mes: 154
- **Gráfica:** Historial de 12 meses con picos en Agosto/Septiembre.

### 2. Auditoría 1x1
- **Tabla:** Lista de CFDI precargada.
- **Caso Clave 1:** `TRASLADOS DE VANGUARDIA` (Monto $125,000) -> Falta Carta Porte.
- **Caso Clave 2:** `INTERNATIONAL LOGISTICS` (Monto $15,000 USD) -> Operación Extranjera.

## 📸 Guía para Screenshots (Manual)
Dado que el sistema de captura automática está saturado, sigue estos pasos para obtener las imágenes perfectas:

1.  **Dashboard Sentinel:** Abre la home. Verás los KPIs cargados. Captura la tarjeta de "Alertas Activas".
2.  **Filtros:** Ve a `Auditoría Forense`. Filtra por "Monto > 100,000". Verás el caso clave.
3.  **Visor XML:** Click en 👁 del caso "TRASLADOS". Muestra el XML inmutable.
4.  **Expediente (Rojo):** Click en "Evidencias". Verás el score bajo y "Falta Carta Porte".
5.  **Expediente (Verde):** Sube cualquier PDF. Verás la animación de blindaje a 100%.

## ⚠️ Nota Técnica
Para producción, recuerde cambiar `USE_DEMO_MODE = false` en los dos archivos mencionados.
