# 🚀 QUICK START - MÓDULO DE EVIDENCIAS

## ⚡ INICIO RÁPIDO (5 minutos)

### **Paso 1: Configurar Variables de Entorno**
```bash
cd apps/backend
# Copiar el archivo de ejemplo (si no existe .env)
# Agregar estas líneas al .env:
```

Agregar al archivo `.env`:
```env
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=evidencias-fiscales
```

---

### **Paso 2: Iniciar MinIO (Opcional - Solo para desarrollo)**

#### **Opción A: Con Docker (Recomendado)**
```bash
docker run -d -p 9000:9000 -p 9001:9001 --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

#### **Opción B: Sin MinIO (Usar filesystem local)**
Comentar temporalmente el código de S3 en `evidencias.service.ts` y usar filesystem.

---

### **Paso 3: Crear Bucket en MinIO**
1. Abrir http://localhost:9001
2. Login: `minioadmin` / `minioadmin`
3. Click en "Buckets" → "Create Bucket"
4. Nombre: `evidencias-fiscales`
5. Click "Create"

---

### **Paso 4: Reiniciar Backend**
```bash
cd apps/backend
npm run start:dev
```

Esperar mensaje: `Application is running on: http://localhost:4000`

---

## 🧪 PROBAR CON POSTMAN

### **Test 1: Obtener Categorías**
```http
GET http://localhost:4000/api/evidencias/categorias/I
```

**Respuesta esperada:**
```json
{
  "categorias": [
    {
      "id": "contrato",
      "nombre": "Contrato de Prestación de Servicios",
      "requerido": true,
      "icono": "📄"
    },
    ...
  ]
}
```

✅ Si ves las categorías, el backend está funcionando!

---

### **Test 2: Subir Evidencia**

**Requisito:** Necesitas un UUID de CFDI existente. Puedes obtenerlo de:
```http
GET http://localhost:4000/api/cfdi/recientes?empresaId=tu-empresa-id
```

**Upload:**
```http
POST http://localhost:4000/api/evidencias/upload
Content-Type: multipart/form-data

Body (form-data):
- cfdiUuid: "uuid-del-cfdi-existente"
- categoria: "contrato"
- descripcion: "Contrato de prueba"
- file: [seleccionar un PDF o imagen]
```

**Respuesta esperada:**
```json
{
  "success": true,
  "evidencia": {
    "id": 1,
    "cfdiUuid": "...",
    "categoria": "contrato",
    "archivo": "empresa-id/cfdi-uuid/archivo_timestamp.pdf",
    "tamanoBytes": 125829
  }
}
```

---

### **Test 3: Listar Evidencias**
```http
GET http://localhost:4000/api/evidencias/{cfdiUuid}
```

---

### **Test 4: Contar Evidencias**
```http
GET http://localhost:4000/api/evidencias/count/{cfdiUuid}
```

---

## ❌ TROUBLESHOOTING

### **Error: "CFDI no encontrado"**
**Solución:** Asegúrate de usar un UUID de CFDI que exista en tu base de datos.

```bash
# Verificar CFDIs existentes
GET http://localhost:4000/api/cfdi/recientes?empresaId=tu-empresa-id
```

---

### **Error: "Connection refused" al subir archivo**
**Solución:** MinIO no está corriendo.

```bash
# Verificar si MinIO está corriendo
docker ps | grep minio

# Si no está, iniciarlo
docker start minio

# O crear uno nuevo
docker run -d -p 9000:9000 -p 9001:9001 --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  minio/minio server /data --console-address ":9001"
```

---

### **Error: "Bucket does not exist"**
**Solución:** Crear el bucket en MinIO.

1. Ir a http://localhost:9001
2. Login: minioadmin / minioadmin
3. Crear bucket: `evidencias-fiscales`

---

### **Error: "Module not found"**
**Solución:** Reinstalar dependencias.

```bash
cd apps/backend
npm install
```

---

## 🎯 SIGUIENTE PASO

Una vez que el backend esté funcionando correctamente, podemos continuar con:

**Fase 2: Frontend Upload**
- Componente de upload con drag & drop
- Integración con el drawer de materialidad
- Barra de progreso
- Validaciones visuales

---

**¿Todo funcionando?** ✅  
**¿Listo para el frontend?** 🚀

---

**Última Actualización:** 2025-12-19 09:40
