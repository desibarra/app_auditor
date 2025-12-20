# Implementación de Módulo de Evidencias (Materialidad) - Reporte de Cambios

## Resumen Ejecutivo
Se ha habilitado exitosamente la carga de evidencias de gran tamaño (>10MB, hasta 50MB) y se ha estabilizado el flujo de persistencia evitando dependencias externas críticas en entorno de desarrollo.

## Problemas Resueltos

### 1. Límite de Carga (Error 500 / 413)
- **Causa:** NestJS y Multer tenían límites por defecto de 1MB/10MB.
- **Solución:**
  - `main.ts`: Configurado `express.json` y `urlencoded` a **50mb**. body-parser nativo desactivado.
  - `EvidenciasController`: Interceptor configurado explícitamente con `{ limits: { fileSize: 50 * 1024 * 1024 } }`.

### 2. Error de Validación (Error 400 Bad Request)
- **Causa:** `ValidationPipe` eliminaba el cuerpo de la petición porque el DTO era una Interfaz y no una Clase decorada.
- **Solución:**
  - Creado `CreateEvidenciaDto` con decoradores `class-validator` (@IsString, @IsUUID).
  - Frontend reordenado para enviar metadatos antes del archivo en `FormData`.

### 3. Error de Infraestructura (Error 500 S3/MinIO)
- **Causa:** La conexión a MinIO local fallaba (`ECONNREFUSED`).
- **Solución:** Implementado **Fallback a Filesystem Local**.
  - Los archivos se guardan en `apps/backend/uploads/evidencias/EMPRESA/UUID/`.
  - El servicio gestiona la creación de carpetas automáticamente.

### 4. Error de Integridad de Datos (Constraint Failed)
- **Causa:** La tabla `documentos_soporte` tiene `expediente_id` como `NOT NULL`, pero las evidencias se suben asociadas a un CFDI, no necesariamente a un expediente existente.
- **Solución:**
  - Lógica de "Auto-Binding": El servicio busca un expediente existente para la empresa.
  - Si no existe, crea un expediente "Dummy" (`Materialidad Automática`) transparente para el usuario y asigna el ID.

## Archivos Críticos Modificados
- `apps/backend/src/modules/evidencias/evidencias.service.ts` (Lógica principal)
- `apps/backend/src/modules/evidencias/evidencias.controller.ts` (Endpoints y DTOs)
- `apps/frontend/src/components/UploadEvidencia.tsx` (Cliente)
- `apps/backend/src/main.ts` (Configuración global)

## Notas para Despliegue en Producción
Para producción, si se desea usar S3, se debe revertir la lógica de almacenamiento local en `EvidenciasService` o configurarla mediante variables de entorno (`STORAGE_DRIVER=s3`).
