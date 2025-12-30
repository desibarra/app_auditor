# 🚀 SENTINEL FISCAL - PRODUCCIÓN LOCAL LISTA

## ✅ Archivos Creados

### 📦 Configuración Docker
- ✅ `apps/backend/Dockerfile` - Imagen optimizada del backend
- ✅ `apps/backend/.dockerignore` - Exclusiones para Docker
- ✅ `apps/frontend/Dockerfile` - Imagen optimizada del frontend  
- ✅ `apps/frontend/.dockerignore` - Exclusiones para Docker
- ✅ `apps/frontend/nginx.conf` - Configuración de Nginx
- ✅ `docker-compose.prod.yml` - Orquestación de servicios

### ⚙️ Configuración de Entorno
- ✅ `.env.production` - Variables de entorno del backend
- ✅ `apps/frontend/.env.production` - Variables de entorno del frontend
- ✅ `apps/frontend/src/vite-env.d.ts` - Tipos TypeScript

### 🛠️ Scripts de Gestión
- ✅ `START_PRODUCTION.bat` - **INICIO RÁPIDO** ⭐
- ✅ `DEPLOY_PRODUCTION.bat` - Despliegue completo
- ✅ `MANAGE_PRODUCTION.bat` - Gestión interactiva
- ✅ `GUIA_PRODUCCION_LOCAL.md` - Documentación completa

---

## 🎯 CÓMO INICIAR (3 PASOS)

### 1️⃣ Asegúrate que Docker Desktop esté corriendo

Abre Docker Desktop y espera a que inicie completamente.

### 2️⃣ Ejecuta el script de inicio rápido

```bash
START_PRODUCTION.bat
```

Este script:
- ✅ Verifica Docker
- ✅ Construye las imágenes (solo la primera vez, ~5-10 min)
- ✅ Inicia todos los servicios
- ✅ Abre el navegador automáticamente

### 3️⃣ ¡Listo! Accede a la aplicación

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000
- **Health Check**: http://localhost:4000/api/health

---

## 🎮 GESTIÓN DIARIA

### Iniciar la aplicación
```bash
START_PRODUCTION.bat
```

### Gestión completa (menú interactivo)
```bash
MANAGE_PRODUCTION.bat
```

Opciones disponibles:
1. Iniciar en modo producción
2. Detener servicios
3. Ver logs en tiempo real
4. Ver estado de servicios
5. Reiniciar servicios
6. Limpiar y reconstruir
7. Backup de base de datos
8. Restaurar backup
9. Salir

### Ver logs en tiempo real
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Detener la aplicación
```bash
docker-compose -f docker-compose.prod.yml down
```

---

## 🏗️ ARQUITECTURA

```
┌─────────────────────────────────────────┐
│    NAVEGADOR (localhost:3000)           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  NGINX (Frontend Container)             │
│  - Archivos estáticos (HTML/CSS/JS)     │
│  - Proxy reverso /api → backend         │
│  - Compresión GZIP                      │
│  - Caché de assets                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  NestJS (Backend Container)             │
│  - API REST                             │
│  - Procesamiento CFDIs                  │
│  - Lógica de negocio                    │
└──────────────┬──────────────────────────┘
               │
               ├──────────────┐
               ▼              ▼
        ┌──────────┐   ┌──────────┐
        │  SQLite  │   │  Redis   │
        │ (Volumen)│   │ (Caché)  │
        └──────────┘   └──────────┘
```

---

## 🔧 CONFIGURACIÓN IMPORTANTE

### ⚠️ Antes de usar en producción REAL

Edita `.env.production` y cambia:

```bash
# Generar secretos seguros
JWT_SECRET=CAMBIAR_ESTE_SECRET
SESSION_SECRET=CAMBIAR_ESTE_SECRET

# Ajustar CORS según tu dominio
CORS_ORIGIN=https://tu-dominio.com
```

Para generar secretos seguros en PowerShell:
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 📊 DIFERENCIAS: DESARROLLO vs PRODUCCIÓN

| Aspecto | Desarrollo | Producción Local |
|---------|-----------|------------------|
| **Inicio** | `npm run dev` | `START_PRODUCTION.bat` |
| **Hot Reload** | ✅ Sí | ❌ No |
| **Optimización** | ❌ No | ✅ Sí (minificado) |
| **Source Maps** | ✅ Sí | ❌ No |
| **Logs** | Verbosos | Esenciales |
| **Rendimiento** | Normal | Alto |
| **Tamaño** | Grande | Optimizado |
| **Docker** | Opcional | Requerido |

---

## 💾 BACKUP Y RESTAURACIÓN

### Crear Backup Automático
```bash
MANAGE_PRODUCTION.bat
# Opción 7: Backup de base de datos
```

Esto crea: `backups/saas_fiscal_YYYYMMDD_HHMMSS.db`

### Backup Manual
```bash
docker cp sentinel-backend-prod:/app/data/saas_fiscal.db backups/mi_backup.db
```

### Restaurar Backup
```bash
MANAGE_PRODUCTION.bat
# Opción 8: Restaurar backup
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ "Docker no está corriendo"
**Solución**: Abre Docker Desktop y espera a que inicie

### ❌ "Puerto 3000 ya está en uso"
**Solución**: 
```bash
# Detener otros servicios
docker-compose -f docker-compose.prod.yml down

# O cambiar puerto en docker-compose.prod.yml
```

### ❌ "Error al construir imágenes"
**Solución**:
```bash
# Limpiar y reconstruir
docker-compose -f docker-compose.prod.yml down
docker system prune -f
docker-compose -f docker-compose.prod.yml build --no-cache
```

### ❌ "Frontend carga pero no hay datos"
**Solución**:
```bash
# Verificar que backend esté corriendo
docker-compose -f docker-compose.prod.yml ps

# Ver logs del backend
docker-compose -f docker-compose.prod.yml logs backend

# Verificar health check
curl http://localhost:4000/api/health
```

### 📋 Ver logs detallados
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 📈 MONITOREO

### Ver estado de servicios
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Ver uso de recursos
```bash
docker stats
```

### Health Checks
- Backend: http://localhost:4000/api/health
- Frontend: http://localhost:3000

---

## 🎓 PRÓXIMOS PASOS

1. ✅ **Ejecuta** `START_PRODUCTION.bat`
2. 🧪 **Prueba** todas las funcionalidades
3. 📊 **Monitorea** logs y rendimiento
4. 💾 **Configura** backups automáticos
5. 🔒 **Revisa** configuración de seguridad
6. 📖 **Lee** `GUIA_PRODUCCION_LOCAL.md` para más detalles

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **Guía Completa**: `GUIA_PRODUCCION_LOCAL.md`
- **Gestión Interactiva**: Ejecuta `MANAGE_PRODUCTION.bat`
- **Docker Compose**: `docker-compose.prod.yml`

---

## ✨ CARACTERÍSTICAS DE PRODUCCIÓN

✅ **Optimización**
- Código minificado y comprimido
- Imágenes Docker multi-etapa
- Caché de assets estáticos
- Compresión GZIP

✅ **Seguridad**
- Headers de seguridad (X-Frame-Options, etc.)
- CORS configurado
- Secrets en variables de entorno
- Contenedores aislados

✅ **Rendimiento**
- Nginx para archivos estáticos
- Redis para caché
- Health checks automáticos
- Restart automático en fallos

✅ **Persistencia**
- Volúmenes Docker para datos
- Base de datos SQLite persistente
- Backups fáciles

---

## 🚀 ¡LISTO PARA PRODUCCIÓN LOCAL!

Ejecuta:
```bash
START_PRODUCTION.bat
```

Y accede a: **http://localhost:3000**

---

**¿Necesitas ayuda?** 
- Revisa `GUIA_PRODUCCION_LOCAL.md`
- Ejecuta `MANAGE_PRODUCTION.bat` para gestión interactiva
- Consulta logs: `docker-compose -f docker-compose.prod.yml logs -f`
