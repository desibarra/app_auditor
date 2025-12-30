# 🚀 Guía de Despliegue en Producción Local

## 📋 Requisitos Previos

- ✅ Docker Desktop instalado y corriendo
- ✅ Al menos 4GB de RAM disponible
- ✅ 10GB de espacio en disco

## 🎯 Inicio Rápido

### Opción 1: Despliegue Automático (Recomendado)

```bash
# Ejecutar el script de despliegue
DEPLOY_PRODUCTION.bat
```

Este script:
1. ✅ Verifica que Docker esté corriendo
2. 🛑 Detiene contenedores existentes
3. 🏗️ Construye las imágenes optimizadas
4. 🚀 Inicia todos los servicios
5. 📊 Muestra el estado y logs iniciales

### Opción 2: Gestión Interactiva

```bash
# Ejecutar el gestor de producción
MANAGE_PRODUCTION.bat
```

Menú interactivo con opciones para:
- Iniciar/Detener servicios
- Ver logs en tiempo real
- Reiniciar servicios
- Hacer backups de la BD
- Reconstruir desde cero

### Opción 3: Manual con Docker Compose

```bash
# Construir imágenes
docker-compose -f docker-compose.prod.yml build

# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🌐 URLs de Acceso

Una vez iniciado, accede a:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/api/health
- **Redis**: localhost:6379

## 📦 Arquitectura de Producción

```
┌─────────────────────────────────────────┐
│         NGINX (Puerto 3000)             │
│  - Sirve archivos estáticos             │
│  - Proxy reverso a API                  │
│  - Compresión GZIP                      │
│  - Caché de assets                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      NestJS Backend (Puerto 4000)       │
│  - API REST                             │
│  - Procesamiento de CFDIs               │
│  - Lógica de negocio                    │
└──────────────┬──────────────────────────┘
               │
               ├──────────────┐
               ▼              ▼
        ┌──────────┐   ┌──────────┐
        │  SQLite  │   │  Redis   │
        │   (BD)   │   │ (Caché)  │
        └──────────┘   └──────────┘
```

## 🔧 Configuración

### Variables de Entorno

Edita `.env.production` para configurar:

```bash
# Seguridad (IMPORTANTE: Cambiar en producción real)
JWT_SECRET=tu-secret-seguro-aqui
SESSION_SECRET=otro-secret-seguro

# CORS (Ajustar según tu dominio)
CORS_ORIGIN=http://localhost:3000

# Base de datos
DATABASE_PATH=/app/data/saas_fiscal.db
```

### Generar Secretos Seguros

En PowerShell:
```powershell
# Generar JWT_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Generar SESSION_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 📊 Comandos Útiles

### Ver Logs

```bash
# Todos los servicios
docker-compose -f docker-compose.prod.yml logs -f

# Solo backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Solo frontend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Últimas 100 líneas
docker-compose -f docker-compose.prod.yml logs --tail=100
```

### Estado de Servicios

```bash
# Ver estado
docker-compose -f docker-compose.prod.yml ps

# Ver recursos utilizados
docker stats
```

### Reiniciar Servicios

```bash
# Reiniciar todos
docker-compose -f docker-compose.prod.yml restart

# Reiniciar solo backend
docker-compose -f docker-compose.prod.yml restart backend
```

### Detener Servicios

```bash
# Detener (mantiene volúmenes)
docker-compose -f docker-compose.prod.yml down

# Detener y eliminar volúmenes (CUIDADO: Borra datos)
docker-compose -f docker-compose.prod.yml down -v
```

## 💾 Backup y Restauración

### Crear Backup

```bash
# Crear directorio de backups
mkdir backups

# Copiar base de datos
docker cp sentinel-backend-prod:/app/data/saas_fiscal.db backups/saas_fiscal_backup.db
```

O usar el script:
```bash
MANAGE_PRODUCTION.bat
# Opción 7: Backup de base de datos
```

### Restaurar Backup

```bash
# Copiar backup al contenedor
docker cp backups/saas_fiscal_backup.db sentinel-backend-prod:/app/data/saas_fiscal.db

# Reiniciar backend
docker-compose -f docker-compose.prod.yml restart backend
```

## 🐛 Troubleshooting

### El frontend no carga

```bash
# Verificar que nginx está corriendo
docker-compose -f docker-compose.prod.yml ps frontend

# Ver logs de nginx
docker-compose -f docker-compose.prod.yml logs frontend

# Reconstruir frontend
docker-compose -f docker-compose.prod.yml up -d --build frontend
```

### El backend no responde

```bash
# Verificar health check
curl http://localhost:4000/api/health

# Ver logs del backend
docker-compose -f docker-compose.prod.yml logs backend

# Entrar al contenedor para debug
docker exec -it sentinel-backend-prod sh
```

### Error de base de datos

```bash
# Verificar que el volumen existe
docker volume ls | grep backend_data

# Ver permisos dentro del contenedor
docker exec -it sentinel-backend-prod ls -la /app/data
```

### Limpiar y empezar de cero

```bash
# Detener todo
docker-compose -f docker-compose.prod.yml down

# Limpiar imágenes
docker image prune -a -f

# Reconstruir
docker-compose -f docker-compose.prod.yml build --no-cache

# Iniciar
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Seguridad

### Checklist de Seguridad

- [ ] Cambiar `JWT_SECRET` y `SESSION_SECRET`
- [ ] Configurar CORS correctamente
- [ ] Revisar permisos de archivos
- [ ] Habilitar HTTPS (si es producción real)
- [ ] Configurar firewall
- [ ] Limitar rate limiting
- [ ] Revisar logs regularmente

## 📈 Monitoreo

### Health Checks

Los servicios tienen health checks automáticos:

```bash
# Ver estado de salud
docker-compose -f docker-compose.prod.yml ps

# Healthy = ✅ Funcionando correctamente
# Unhealthy = ❌ Hay problemas
```

### Métricas de Recursos

```bash
# Ver uso de CPU, RAM, Red
docker stats

# Ver solo contenedores de Sentinel
docker stats sentinel-backend-prod sentinel-frontend-prod
```

## 🚀 Optimizaciones

### Caché de Builds

Docker cachea las capas. Para aprovechar:

```bash
# Build normal (usa caché)
docker-compose -f docker-compose.prod.yml build

# Build sin caché (más lento pero limpio)
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Reducir Tamaño de Imágenes

Las imágenes ya están optimizadas con:
- ✅ Multi-stage builds
- ✅ Alpine Linux (imágenes pequeñas)
- ✅ Solo dependencias de producción
- ✅ .dockerignore para excluir archivos innecesarios

## 📝 Notas Importantes

1. **Persistencia de Datos**: La base de datos SQLite se guarda en un volumen Docker (`backend_data`), por lo que los datos persisten entre reinicios.

2. **Modo Producción**: La aplicación corre en modo producción con:
   - Código minificado y optimizado
   - Sin hot-reload
   - Mejor rendimiento
   - Logs menos verbosos

3. **Diferencias con Desarrollo**:
   - Desarrollo: `npm run dev` (hot-reload, debug)
   - Producción: Código compilado, optimizado, sin debug

4. **Acceso a la BD**: Para consultar la base de datos:
   ```bash
   docker exec -it sentinel-backend-prod sh
   cd /app/data
   sqlite3 saas_fiscal.db
   ```

## 🎓 Próximos Pasos

1. ✅ Iniciar la aplicación
2. 🧪 Probar todas las funcionalidades
3. 📊 Monitorear logs y rendimiento
4. 💾 Configurar backups automáticos
5. 🔒 Revisar configuración de seguridad
6. 🌐 (Opcional) Configurar dominio y HTTPS para producción real

---

**¿Necesitas ayuda?** Revisa los logs con `docker-compose -f docker-compose.prod.yml logs -f`
