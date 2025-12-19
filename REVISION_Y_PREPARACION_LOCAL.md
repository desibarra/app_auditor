# 📋 Revisión y Preparación para Compilación Local

**Fecha:** 2025-12-18  
**Proyecto:** SaaS Fiscal PyMEs - App Auditor  
**Objetivo:** Revisar la aplicación y prepararla para compilar en modo local y realizar pruebas

---

## 🔍 ESTADO ACTUAL DEL PROYECTO

### ✅ Componentes Identificados

#### **Backend (NestJS + SQLite + Drizzle ORM)**
- **Ubicación:** `apps/backend/`
- **Puerto:** 4000
- **Base de datos:** SQLite (`sqlite/dev.db`)
- **ORM:** Drizzle ORM
- **Módulos principales:**
  - Auth (Autenticación)
  - Empresas
  - CFDI (Comprobantes Fiscales)
  - Dashboard
  - Expedientes
  - S3 (Almacenamiento)
  - Seed (Datos de prueba)

#### **Frontend (Vite + React + TypeScript + Tailwind)**
- **Ubicación:** `apps/frontend/`
- **Puerto:** 3000
- **Framework:** Vite + React 18
- **Estilos:** Tailwind CSS
- **Routing:** React Router DOM

---

## ⚠️ PROBLEMAS DETECTADOS

### 1. **Inconsistencia en Configuración de Base de Datos**
- ❌ El README menciona PostgreSQL, pero el proyecto usa SQLite
- ❌ Las instrucciones mencionan Docker Compose para PostgreSQL
- ✅ **Solución:** El proyecto está configurado correctamente para SQLite, solo hay que actualizar documentación

### 2. **Archivos de Entorno**
- ✅ Backend tiene `.env` y `.env.example`
- ✅ Frontend tiene `.env`, `.env.local` y `.env.example`
- ⚠️ El `.env.example` del frontend menciona puerto 3000 pero debería ser 5173 (puerto por defecto de Vite)

### 3. **Configuración de CORS**
- ⚠️ El backend espera el frontend en `http://localhost:3000`
- ⚠️ Vite por defecto usa puerto 5173
- ✅ El `vite.config.ts` está configurado para usar puerto 3000 (correcto)

### 4. **Dependencias de Docker**
- ❌ Las instrucciones mencionan Docker para PostgreSQL/Redis/PgAdmin
- ✅ El proyecto usa SQLite (no necesita Docker)
- ⚠️ Puede haber referencias a servicios que no se usan

---

## 🛠️ CORRECCIONES NECESARIAS

### 1. Actualizar `.env.example` del Frontend

**Archivo:** `apps/frontend/.env.example`

**Cambio necesario:**
```env
VITE_API_URL=http://localhost:4000
VITE_APP_NAME=SaaS Fiscal PyMEs
```

### 2. Actualizar Documentación

**Archivos a actualizar:**
- `README.md` - Eliminar referencias a PostgreSQL/Docker
- `INSTRUCCIONES_PRUEBA_LOCAL.md` - Simplificar pasos (no requiere Docker)
- `CHECKLIST_PRUEBA.md` - Eliminar checks de PostgreSQL/Redis/PgAdmin

### 3. Verificar Estructura de Directorios

**Crear directorio de datos si no existe:**
```bash
mkdir -p apps/backend/data
```

---

## 📝 GUÍA DE COMPILACIÓN LOCAL (CORREGIDA)

### **Requisitos Previos**
- Node.js >= 18.0.0
- npm >= 9.0.0
- **NO se requiere Docker** (el proyecto usa SQLite)

---

### **PASO 1: Instalación de Dependencias**

#### Opción A: Instalación desde la raíz (recomendado)
```bash
# Desde la raíz del proyecto
npm install
```

#### Opción B: Instalación individual
```bash
# Backend
cd apps/backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### **PASO 2: Configurar Variables de Entorno**

#### Backend
```bash
cd apps/backend

# Copiar archivo de ejemplo (si no existe .env)
copy .env.example .env

# Verificar contenido del .env:
# NODE_ENV=development
# PORT=4000
# DATABASE_PATH=./data/dev.db
# ENABLE_SEED_ON_START=true
```

#### Frontend
```bash
cd apps/frontend

# Copiar archivo de ejemplo (si no existe .env)
copy .env.example .env

# Verificar contenido del .env:
# VITE_API_URL=http://localhost:4000
# VITE_APP_NAME=SaaS Fiscal PyMEs
```

---

### **PASO 3: Preparar Base de Datos**

```bash
cd apps/backend

# Crear directorio de datos si no existe
mkdir data

# Generar esquema de base de datos
npm run db:generate

# Aplicar migraciones
npm run db:push

# Cargar datos de prueba
npm run seed:demo
```

**Nota:** Si `db:generate` o `db:push` fallan, es posible que necesites usar:
```bash
npx drizzle-kit generate:sqlite
npx drizzle-kit push:sqlite
```

---

### **PASO 4: Iniciar Servidores**

#### Opción A: Iniciar ambos desde la raíz
```bash
# Desde la raíz del proyecto
npm run dev
```

Esto iniciará:
- Backend en `http://localhost:4000`
- Frontend en `http://localhost:3000`

#### Opción B: Iniciar individualmente (en terminales separadas)

**Terminal 1 - Backend:**
```bash
cd apps/backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd apps/frontend
npm run dev
```

---

### **PASO 5: Verificar Funcionamiento**

#### 1. Verificar Backend
```bash
# Endpoint de salud
curl http://localhost:4000/api/health

# O abrir en navegador:
# http://localhost:4000/api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-18T..."
}
```

#### 2. Verificar Frontend
Abrir en navegador: `http://localhost:3000`

#### 3. Verificar Base de Datos
```bash
cd apps/backend
npm run db:studio
```

Esto abrirá Drizzle Studio en el navegador para inspeccionar la base de datos.

---

### **PASO 6: Probar la Aplicación**

#### Credenciales de Prueba
- **Usuario:** `demo@saas-fiscal.com`
- **Contraseña:** `password123`

#### Flujo de Prueba
1. ✅ Iniciar sesión con credenciales de prueba
2. ✅ Seleccionar empresa "Empresa de Prueba" (RFC: `TEST123456789`)
3. ✅ Navegar al módulo "Devoluciones de IVA"
4. ✅ Crear un nuevo expediente
5. ✅ Verificar que se muestran los CFDI de prueba
6. ✅ Recalcular cédulas
7. ✅ Verificar totales (base, IVA, total)

---

## 🔧 COMANDOS ÚTILES

### Backend
```bash
# Desarrollo con hot-reload
npm run start:dev

# Compilar para producción
npm run build

# Ejecutar en producción
npm run start:prod

# Ver base de datos
npm run db:studio

# Regenerar base de datos
npm run db:reset

# Ejecutar seed
npm run seed:demo

# Verificar salud
npm run health
```

### Frontend
```bash
# Desarrollo
npm run dev

# Compilar para producción
npm run build

# Preview de producción
npm run preview

# Linting
npm run lint
```

### Desde la Raíz
```bash
# Iniciar ambos servidores
npm run dev

# Compilar todo
npm run build

# Linting de todo
npm run lint

# Formatear código
npm run format
```

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module 'drizzle-kit'"
```bash
cd apps/backend
npm install drizzle-kit --save-dev
```

### Error: "ENOENT: no such file or directory, open './data/dev.db'"
```bash
cd apps/backend
mkdir data
npm run db:push
```

### Error: "Port 4000 is already in use"
```bash
# En Windows, encontrar el proceso:
netstat -ano | findstr :4000

# Matar el proceso (reemplazar PID):
taskkill /PID <PID> /F
```

### Error: "Port 3000 is already in use"
```bash
# En Windows, encontrar el proceso:
netstat -ano | findstr :3000

# Matar el proceso (reemplazar PID):
taskkill /PID <PID> /F
```

### Error: Frontend no conecta con Backend
1. Verificar que el backend esté corriendo en puerto 4000
2. Verificar el archivo `.env` del frontend tenga `VITE_API_URL=http://localhost:4000`
3. Verificar CORS en `apps/backend/src/main.ts`

### Error: "No se pueden cargar los datos"
```bash
# Verificar que el seed se ejecutó correctamente
cd apps/backend
npm run seed:demo

# O verificar la base de datos
npm run db:studio
```

---

## 📊 ESTRUCTURA DE ARCHIVOS CLAVE

```
app_auditor/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── main.ts                 # Punto de entrada
│   │   │   ├── app.module.ts           # Módulo principal
│   │   │   ├── database/               # Configuración DB
│   │   │   ├── modules/                # Módulos de negocio
│   │   │   │   ├── auth/
│   │   │   │   ├── empresas/
│   │   │   │   ├── cfdi/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── expedientes/
│   │   │   │   └── seed/
│   │   │   └── scripts/
│   │   ├── data/                       # Base de datos SQLite
│   │   ├── .env                        # Variables de entorno
│   │   ├── drizzle.config.ts           # Config Drizzle ORM
│   │   └── package.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── main.tsx                # Punto de entrada
│       │   ├── App.tsx                 # Componente principal
│       │   ├── components/             # Componentes React
│       │   ├── pages/                  # Páginas
│       │   └── services/               # Servicios API
│       ├── .env                        # Variables de entorno
│       ├── vite.config.ts              # Config Vite
│       └── package.json
│
├── package.json                        # Workspace raíz
└── pnpm-workspace.yaml                 # Config workspace
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

### Antes de Compilar
- [ ] Node.js >= 18.0.0 instalado
- [ ] npm >= 9.0.0 instalado
- [ ] Dependencias instaladas (`npm install` en raíz)
- [ ] Archivos `.env` configurados en backend y frontend
- [ ] Directorio `apps/backend/data/` existe

### Durante la Compilación
- [ ] Backend compila sin errores (`npm run build` en backend)
- [ ] Frontend compila sin errores (`npm run build` en frontend)
- [ ] No hay errores de TypeScript
- [ ] No hay errores de linting

### Después de Iniciar
- [ ] Backend responde en `http://localhost:4000/api/health`
- [ ] Frontend carga en `http://localhost:3000`
- [ ] Base de datos tiene datos de prueba
- [ ] Login funciona con credenciales de prueba
- [ ] Se pueden navegar los módulos

---

## 🚀 PRÓXIMOS PASOS

1. **Corregir archivos de configuración** según lo indicado arriba
2. **Ejecutar instalación y compilación** siguiendo la guía
3. **Verificar funcionamiento** con el checklist
4. **Documentar cualquier error** encontrado
5. **Preparar para despliegue** si las pruebas son exitosas

---

## 📞 SOPORTE

Si encuentras problemas:
1. Revisar la sección de Troubleshooting
2. Verificar logs del backend y frontend
3. Revisar el archivo `TROUBLESHOOTING.md`
4. Consultar documentación en `docs/`

---

**Última actualización:** 2025-12-18  
**Estado:** ✅ Listo para pruebas locales
