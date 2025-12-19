# SaaS Fiscal PyMEs

Plataforma SaaS de cumplimiento fiscal para PyMEs en México.

## Estructura del Proyecto

```
saas-fiscal-pymes/
├── apps/
│   ├── backend/          # NestJS + Drizzle ORM + PostgreSQL
│   └── frontend/         # Vite + React + TypeScript + Tailwind CSS
├── packages/             # Código compartido (futuro)
├── docs/                 # Documentación
└── infra/               # Docker Compose y configuración
```

## Requisitos Previos

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL 15+
- Docker (opcional, para desarrollo local)

## Instalación

### 1. Clonar repositorio
```bash
git clone <repo-url>
cd saas-fiscal-pymes
```

### 2. Instalar dependencias
```bash
pnpm install
```

### 3. Configurar variables de entorno

**Backend:**
```bash
cd apps/backend
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

**Frontend:**
```bash
cd apps/frontend
cp .env.example .env
```

### 4. Iniciar base de datos (Docker)
```bash
cd infra/docker
docker-compose up -d
```

### 5. Ejecutar migraciones
```bash
cd apps/backend
pnpm db:generate
pnpm db:push
```

### 6. Iniciar servidores de desarrollo
```bash
# Desde la raíz del proyecto
pnpm dev

# O individualmente:
pnpm dev:backend   # Backend en http://localhost:4000
pnpm dev:frontend  # Frontend en http://localhost:3000
```

## Scripts Disponibles

### Raíz
- `pnpm dev` - Inicia backend y frontend
- `pnpm build` - Build de todos los workspaces
- `pnpm lint` - Lint de todos los workspaces

### Backend
- `pnpm start:dev` - Modo desarrollo con hot reload
- `pnpm build` - Build para producción
- `pnpm db:generate` - Generar migraciones de Drizzle
- `pnpm db:push` - Aplicar migraciones
- `pnpm db:studio` - Abrir Drizzle Studio

### Frontend
- `pnpm dev` - Servidor de desarrollo
- `pnpm build` - Build para producción
- `pnpm preview` - Preview del build

## Tecnologías

### Backend
- NestJS
- Drizzle ORM
- PostgreSQL
- TypeScript

### Frontend
- Vite
- React 18
- TypeScript
- Tailwind CSS
- React Router
- Axios

## Documentación

Ver carpeta `docs/` para documentación detallada:
- Arquitectura del sistema
- Especificación de producto
- Plan de Sprint 0
- Estructura del repositorio

## Estado del Proyecto

🚧 En desarrollo - MVP Sprint 0

## Licencia

Privado - Todos los derechos reservados
