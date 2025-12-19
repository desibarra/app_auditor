# 🎯 PASO 3: MÓDULO DE EVIDENCIAS - PLAN DE IMPLEMENTACIÓN COMPLETO

**Fecha:** 2025-12-18 22:34  
**Estado:** 📋 **PLANIFICADO - LISTO PARA IMPLEMENTAR**  
**Tiempo Estimado:** 2-3 horas

---

## 🎯 OBJETIVO

Implementar un sistema completo de gestión de evidencias que:
- Permita upload de archivos vinculados a CFDIs
- Categorice evidencias dinámicamente según tipo de CFDI
- Muestre preview de archivos
- Actualice automáticamente el semáforo de materialidad
- Almacene archivos en MinIO/S3 (o filesystem local)

---

## 📋 ARQUITECTURA DEL MÓDULO

```
Módulo de Evidencias
├── Backend
│   ├── Servicio de Upload (Multer + MinIO/S3)
│   ├── CRUD de Evidencias
│   ├── Categorías Dinámicas
│   └── Contador de Evidencias
│
└── Frontend
    ├── Componente de Upload
    ├── Lista de Evidencias
    ├── Preview de Archivos
    └── Actualización de Semáforo
```

---

## 🔧 COMPONENTES A IMPLEMENTAR

### **BACKEND (6 componentes)**

#### **1. Configuración de MinIO/S3**
**Archivo:** `apps/backend/src/config/storage.config.ts`

```typescript
import { S3Client } from '@aws-sdk/client-s3';

export const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

export const BUCKET_NAME = process.env.S3_BUCKET || 'evidencias-fiscales';
```

**Variables de Entorno:**
```env
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=evidencias-fiscales
```

---

#### **2. Servicio de Evidencias**
**Archivo:** `apps/backend/src/modules/evidencias/evidencias.service.ts`

**Métodos:**
```typescript
class EvidenciasService {
  // Upload de archivo
  async uploadEvidencia(
    cfdiUuid: string,
    categoria: string,
    descripcion: string,
    file: Express.Multer.File
  ): Promise<Evidencia>

  // Listar evidencias de un CFDI
  async getEvidenciasByCfdi(cfdiUuid: string): Promise<Evidencia[]>

  // Contar evidencias de un CFDI
  async contarEvidencias(cfdiUuid: string): Promise<number>

  // Eliminar evidencia
  async deleteEvidencia(id: number): Promise<void>

  // Obtener categorías dinámicas según tipo de CFDI
  getCategoriasPorTipo(tipoComprobante: string): Categoria[]

  // Descargar archivo
  async downloadEvidencia(id: number): Promise<Buffer>
}
```

---

#### **3. Controlador de Evidencias**
**Archivo:** `apps/backend/src/modules/evidencias/evidencias.controller.ts`

**Endpoints:**
```typescript
POST   /api/evidencias/upload
       - Body: { cfdiUuid, categoria, descripcion }
       - File: multipart/form-data
       - Retorna: { success, evidencia }

GET    /api/evidencias/:cfdiUuid
       - Retorna: Evidencia[]

GET    /api/evidencias/count/:cfdiUuid
       - Retorna: { count: number }

DELETE /api/evidencias/:id
       - Retorna: { success, message }

GET    /api/evidencias/download/:id
       - Retorna: File stream

GET    /api/evidencias/categorias/:tipoComprobante
       - Retorna: Categoria[]
```

---

#### **4. Categorías Dinámicas**
**Archivo:** `apps/backend/src/modules/evidencias/categorias.config.ts`

```typescript
export const CATEGORIAS_POR_TIPO = {
  'I': [ // Ingreso
    { id: 'contrato', nombre: 'Contrato de Prestación de Servicios', requerido: true },
    { id: 'entregable', nombre: 'Evidencia de Entrega', requerido: true },
    { id: 'pago', nombre: 'Comprobante de Pago', requerido: true },
  ],
  'E': [ // Egreso (Compras)
    { id: 'pedido', nombre: 'Orden de Compra o Pedido', requerido: true },
    { id: 'entrega', nombre: 'Foto de Mercancía o Entrega', requerido: true },
    { id: 'pago', nombre: 'Comprobante de Pago', requerido: true },
  ],
  'P': [ // Pago
    { id: 'estado_cuenta', nombre: 'Estado de Cuenta Bancario', requerido: true },
    { id: 'transferencia', nombre: 'Comprobante de Transferencia', requerido: true },
  ],
  'N': [ // Nómina
    { id: 'recibo', nombre: 'Recibo de Nómina Firmado', requerido: true },
    { id: 'deposito', nombre: 'Comprobante de Depósito', requerido: true },
  ],
};
```

---

#### **5. Actualización del Schema**
**Archivo:** `apps/backend/src/database/schema/documentos_soporte.ts`

**Ya existe, verificar que tenga:**
```typescript
export const documentosSoporte = sqliteTable('documentos_soporte', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cfdiUuid: text('cfdi_uuid').references(() => cfdiRecibidos.uuid, {
    onDelete: 'cascade',
  }),
  categoriaEvidencia: text('categoria_evidencia'), // 'contrato', 'pago', etc.
  descripcionEvidencia: text('descripcion_evidencia'),
  archivo: text('archivo'), // URL o path del archivo
  tipoArchivo: text('tipo_archivo'), // 'pdf', 'jpg', 'png', etc.
  tamanoBytes: integer('tamano_bytes'),
  estado: text('estado').default('pendiente'), // 'pendiente', 'subido', 'error'
  fechaSubida: integer('fecha_subida', { mode: 'timestamp' }),
  fechaActualizacion: integer('fecha_actualizacion', { mode: 'timestamp' }),
  intentosSubida: integer('intentos_subida').default(0),
  ultimoError: text('ultimo_error'),
});
```

---

#### **6. Módulo de Evidencias**
**Archivo:** `apps/backend/src/modules/evidencias/evidencias.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { EvidenciasController } from './evidencias.controller';
import { EvidenciasService } from './evidencias.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  ],
  controllers: [EvidenciasController],
  providers: [EvidenciasService],
  exports: [EvidenciasService],
})
export class EvidenciasModule {}
```

---

### **FRONTEND (5 componentes)**

#### **1. Componente de Upload**
**Archivo:** `apps/frontend/src/components/UploadEvidencia.tsx`

**Props:**
```typescript
interface UploadEvidenciaProps {
  cfdiUuid: string;
  tipoComprobante: string;
  onSuccess: () => void;
}
```

**Funcionalidades:**
- Selector de categoría (dinámico según tipo)
- Input de descripción
- Drag & drop de archivos
- Validación de tipo de archivo
- Barra de progreso
- Preview antes de subir
- Botón "Subir Evidencia"

---

#### **2. Lista de Evidencias**
**Archivo:** `apps/frontend/src/components/ListaEvidencias.tsx`

**Props:**
```typescript
interface ListaEvidenciasProps {
  cfdiUuid: string;
  onUpdate: () => void;
}
```

**Funcionalidades:**
- Fetch de evidencias al montar
- Tabla con: Categoría, Descripción, Tipo, Tamaño, Fecha
- Botón preview (👁️)
- Botón descargar (⬇️)
- Botón eliminar (🗑️)
- Indicador de categorías faltantes

---

#### **3. Preview de Archivos**
**Archivo:** `apps/frontend/src/components/PreviewArchivo.tsx`

**Props:**
```typescript
interface PreviewArchivoProps {
  evidenciaId: number;
  tipoArchivo: string;
  onClose: () => void;
}
```

**Funcionalidades:**
- Modal fullscreen
- Preview de PDFs (iframe)
- Preview de imágenes (img)
- Botón descargar
- Botón cerrar
- Zoom para imágenes

---

#### **4. Actualización del Drawer**
**Archivo:** `apps/frontend/src/components/DrawerMaterialidad.tsx`

**Modificaciones:**
- Reemplazar placeholder de evidencias
- Integrar `UploadEvidencia`
- Integrar `ListaEvidencias`
- Fetch de contador de evidencias
- Actualizar indicador de estatus

---

#### **5. Actualización del Indicador**
**Archivo:** `apps/frontend/src/components/IndicadorMaterialidad.tsx`

**Modificaciones:**
- Recibir `numEvidencias` desde backend
- Lógica de semáforo:
  ```typescript
  🔴 Rojo: 0 evidencias
  🟡 Amarillo: 1-2 evidencias
  🟢 Verde: 3+ evidencias
  ```

---

## 📊 FLUJO COMPLETO DE USUARIO

```
1. Usuario abre drawer de un CFDI
   ↓
2. Ve sección "Evidencias de Materialidad"
   - Indicador: 🔴 0 documentos
   - Lista vacía
   ↓
3. Click en "Subir Evidencia"
   ↓
4. Modal de upload se abre
   ↓
5. Selecciona categoría: "Contrato de Prestación de Servicios"
   ↓
6. Ingresa descripción: "Contrato firmado con cliente XYZ"
   ↓
7. Arrastra archivo: contrato.pdf
   ↓
8. Preview del archivo se muestra
   ↓
9. Click en "Subir"
   ↓
10. Barra de progreso: 0% → 100%
    ↓
11. POST /api/evidencias/upload
    - Upload a MinIO/S3
    - INSERT en documentos_soporte
    ↓
12. Respuesta exitosa
    ↓
13. Modal se cierra
    ↓
14. Lista de evidencias se actualiza:
    - 1 documento: contrato.pdf
    ↓
15. Indicador cambia a 🟡
    ↓
16. Usuario sube más evidencias:
    - Foto de entrega: foto.jpg
    - Comprobante de pago: pago.pdf
    ↓
17. Indicador cambia a 🟢
    ↓
18. Usuario cierra drawer
    ↓
19. Tabla principal muestra 🟢 en esa fila
```

---

## 🎨 DISEÑO UI/UX

### **Sección de Evidencias en Drawer:**

```
┌─────────────────────────────────────────────┐
│ Evidencias de Materialidad                  │
├─────────────────────────────────────────────┤
│                                             │
│ [+ Subir Evidencia]                         │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 📄 Contrato de Prestación de Servicios  │ │
│ │ contrato.pdf - 1.2 MB                   │ │
│ │ Subido: 15 Dic 2024                     │ │
│ │                        [👁️] [⬇️] [🗑️]  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 📷 Evidencia de Entrega                 │ │
│ │ foto_entrega.jpg - 850 KB               │ │
│ │ Subido: 15 Dic 2024                     │ │
│ │                        [👁️] [⬇️] [🗑️]  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ 💰 Comprobante de Pago                  │ │
│ │ pago_transferencia.pdf - 320 KB         │ │
│ │ Subido: 15 Dic 2024                     │ │
│ │                        [👁️] [⬇️] [🗑️]  │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ✅ Materialización completa (3/3)          │
└─────────────────────────────────────────────┘
```

---

## 🔒 VALIDACIONES Y SEGURIDAD

### **Backend:**
```typescript
// Validación de tipo de archivo
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
];

// Validación de tamaño
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Sanitización de nombre de archivo
const sanitizeFilename = (filename: string) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .toLowerCase();
};

// Generación de nombre único
const generateUniqueFilename = (cfdiUuid: string, originalName: string) => {
  const timestamp = Date.now();
  const ext = path.extname(originalName);
  return `${cfdiUuid}_${timestamp}${ext}`;
};
```

### **Frontend:**
```typescript
// Validación antes de upload
const validateFile = (file: File) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no permitido');
  }

  if (file.size > maxSize) {
    throw new Error('El archivo excede el tamaño máximo de 10MB');
  }
};
```

---

## 📁 ESTRUCTURA DE ALMACENAMIENTO

### **MinIO/S3:**
```
evidencias-fiscales/
├── empresa-abc123/
│   ├── cfdi-uuid-1/
│   │   ├── contrato_1234567890.pdf
│   │   ├── foto_1234567891.jpg
│   │   └── pago_1234567892.pdf
│   │
│   └── cfdi-uuid-2/
│       ├── pedido_1234567893.pdf
│       └── entrega_1234567894.jpg
```

### **Base de Datos:**
```sql
documentos_soporte
├── id: 1
├── cfdi_uuid: "uuid-1"
├── categoria_evidencia: "contrato"
├── descripcion_evidencia: "Contrato firmado con cliente XYZ"
├── archivo: "empresa-abc123/cfdi-uuid-1/contrato_1234567890.pdf"
├── tipo_archivo: "pdf"
├── tamano_bytes: 1258291
├── estado: "subido"
├── fecha_subida: 1702656000
```

---

## ⚙️ CONFIGURACIÓN NECESARIA

### **1. Instalar Dependencias:**
```bash
cd apps/backend
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage multer @types/multer
```

### **2. Variables de Entorno:**
```env
# apps/backend/.env
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=evidencias-fiscales
```

### **3. Iniciar MinIO (Docker):**
```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v ~/minio/data:/data \
  minio/minio server /data --console-address ":9001"
```

### **4. Crear Bucket:**
```bash
# Acceder a http://localhost:9001
# Login: minioadmin / minioadmin
# Crear bucket: evidencias-fiscales
```

---

## 🚀 ORDEN DE IMPLEMENTACIÓN

### **Fase 1: Backend Base (1 hora)**
1. ✅ Instalar dependencias
2. ✅ Configurar MinIO/S3
3. ✅ Crear servicio de evidencias
4. ✅ Crear controlador
5. ✅ Configurar categorías dinámicas
6. ✅ Probar endpoints con Postman

### **Fase 2: Frontend Upload (45 min)**
1. ✅ Crear componente UploadEvidencia
2. ✅ Integrar en DrawerMaterialidad
3. ✅ Probar upload de archivos
4. ✅ Validar almacenamiento

### **Fase 3: Frontend Lista (30 min)**
1. ✅ Crear componente ListaEvidencias
2. ✅ Integrar en DrawerMaterialidad
3. ✅ Probar visualización
4. ✅ Probar eliminación

### **Fase 4: Preview (30 min)**
1. ✅ Crear componente PreviewArchivo
2. ✅ Integrar con ListaEvidencias
3. ✅ Probar preview de PDFs
4. ✅ Probar preview de imágenes

### **Fase 5: Semáforo (15 min)**
1. ✅ Actualizar IndicadorMaterialidad
2. ✅ Fetch de contador en tabla
3. ✅ Actualización automática
4. ✅ Probar cambios de estado

---

## 📊 MÉTRICAS ESPERADAS

```
Archivos Nuevos:        8
Archivos Modificados:   3
Líneas de Código:       ~1,500
Endpoints Nuevos:       6
Componentes Nuevos:     3
Tiempo Total:           2-3 horas
```

---

## 🎯 RESULTADO FINAL

Al completar este paso, tendrás:

✅ Sistema completo de evidencias
✅ Upload de archivos a MinIO/S3
✅ Categorías dinámicas por tipo de CFDI
✅ Preview de PDFs e imágenes
✅ Semáforo actualizado automáticamente
✅ Gestión completa de evidencias
✅ **Sistema al 100%**

---

## 📝 PRÓXIMOS PASOS DESPUÉS DEL PASO 3

### **Paso 4: Checklist de Devolución de IVA**
- Validación de requisitos
- Cálculo de IVA acreditable
- Generación de checklist
- Exportación de reportes

### **Paso 5: UI Completa y Reportes**
- Dashboard con métricas
- Reportes de materialidad
- Exportación a Excel/PDF
- Gráficas y estadísticas

---

**Estado:** 📋 **PLANIFICADO**  
**Siguiente:** Implementar Fase 1 (Backend Base)  
**Última Actualización:** 2025-12-18 22:34
