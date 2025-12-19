# 🚀 Inicio Rápido - 3 Pasos

## ⚡ Opción 1: Automático (Recomendado)

```bash
.\QUICK_START_MEJORADO.bat
```

**¡Eso es todo!** El script hará todo automáticamente.

---

## 🔧 Opción 2: Manual

### Paso 1: Iniciar Backend
```bash
cd apps/backend
npm run start:dev
```

### Paso 2: Iniciar Frontend (nueva terminal)
```bash
cd apps/frontend
npm run dev
```

### Paso 3: Abrir en navegador
```
http://localhost:3000
```

---

## 👤 Credenciales de Prueba

```
Usuario:    demo@saas-fiscal.com
Contraseña: password123
```

---

## 🔍 Verificar Estado

```bash
.\VERIFICAR_PROYECTO.bat
```

---

## 📚 Más Información

- **Guía completa:** `REVISION_Y_PREPARACION_LOCAL.md`
- **Resumen ejecutivo:** `RESUMEN_EJECUTIVO.md`
- **Solución de problemas:** `TROUBLESHOOTING.md`

---

## 🆘 Ayuda Rápida

### Backend no inicia
```bash
cd apps/backend
npm install
npm run db:push
npm run seed:demo
```

### Frontend no conecta
Verificar `apps/frontend/.env`:
```env
VITE_API_URL=http://localhost:4000
```

### Puerto en uso
```bash
# Encontrar proceso
netstat -ano | findstr :4000

# Matar proceso
taskkill /PID <PID> /F
```

---

**¿Listo?** Ejecuta: `.\QUICK_START_MEJORADO.bat`
