# 🚀 Sentinel Fiscal - Plataforma de Auditoría Fiscal

## ⚡ INICIO RÁPIDO - PRODUCCIÓN LOCAL

### 1️⃣ Abre Docker Desktop
Asegúrate que Docker Desktop esté corriendo (ícono de ballena verde en la bandeja del sistema)

### 2️⃣ Ejecuta el script de inicio
```bash
START_PRODUCTION.bat
```

### 3️⃣ Accede a la aplicación
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000

---

## 📁 Archivos Importantes

| Archivo | Descripción |
|---------|-------------|
| **START_PRODUCTION.bat** ⭐ | Inicio rápido (USA ESTE) |
| **LEEME_PRIMERO.md** 📖 | Guía completa de inicio |
| **MANAGE_PRODUCTION.bat** 🎮 | Menú de gestión interactivo |
| **docker-compose.prod.yml** 🐳 | Configuración Docker |

---

## 🎯 Modos de Ejecución

### Modo Desarrollo (Hot Reload)
```bash
# Backend
cd apps/backend
npm run start:dev

# Frontend
cd apps/frontend
npm run dev
```

### Modo Producción Local (Optimizado)
```bash
START_PRODUCTION.bat
```

---

## 📊 Arquitectura

```
Frontend (React + Vite)  →  Nginx  →  Backend (NestJS)  →  SQLite
                                                          →  Redis
```

---

## 🛠️ Gestión

### Iniciar
```bash
START_PRODUCTION.bat
```

### Detener
```bash
docker-compose -f docker-compose.prod.yml down
```

### Ver Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Menú Interactivo
```bash
MANAGE_PRODUCTION.bat
```

---

## 📚 Documentación

- **LEEME_PRIMERO.md** - Guía de inicio paso a paso
- **GUIA_PRODUCCION_LOCAL.md** - Documentación completa
- **PRODUCCION_LOCAL_LISTO.md** - Resumen ejecutivo

---

## 🐛 Problemas Comunes

### Docker no está corriendo
**Solución**: Abre Docker Desktop y espera a que inicie

### Puerto en uso
**Solución**: 
```bash
docker-compose -f docker-compose.prod.yml down
```

### Error al construir
**Solución**:
```bash
docker-compose -f docker-compose.prod.yml down
docker system prune -f
START_PRODUCTION.bat
```

---

## 💾 Backup

### Crear Backup
```bash
MANAGE_PRODUCTION.bat
# Opción 7: Backup de base de datos
```

### Restaurar Backup
```bash
MANAGE_PRODUCTION.bat
# Opción 8: Restaurar backup
```

---

## 🔒 Seguridad

Antes de usar en producción real, edita `.env.production`:
- Cambia `JWT_SECRET`
- Cambia `SESSION_SECRET`
- Configura `CORS_ORIGIN` con tu dominio

---

## 📈 Características

✅ Procesamiento de CFDIs 4.0  
✅ Validación SAT  
✅ Dashboard analítico  
✅ Gestión de empresas  
✅ Reportes PDF/Excel  
✅ Trazabilidad fiscal  
✅ Alertas forenses  

---

## 🎓 Stack Tecnológico

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: NestJS, TypeScript
- **Base de datos**: SQLite (producción local), PostgreSQL (opcional)
- **Caché**: Redis
- **Servidor web**: Nginx
- **Contenedores**: Docker

---

## 📞 Soporte

Para más información, consulta:
- `LEEME_PRIMERO.md` - Guía completa
- `GUIA_PRODUCCION_LOCAL.md` - Documentación técnica
- Logs: `docker-compose -f docker-compose.prod.yml logs -f`

---

## ✨ Versión

**v1.0.0** - Producción Local Lista

---

**Desarrollado con ❤️ para auditoría fiscal en México**
