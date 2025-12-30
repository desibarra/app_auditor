# Dockerfile para Backend NestJS (Contexto Raíz)
FROM node:18-alpine AS builder

# Instalar dependencias del sistema
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de definición de dependencias del workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar todo el código fuente
COPY . .

# Generar cliente de base de datos y construir
WORKDIR /app/apps/backend
RUN pnpm run db:generate || true
RUN pnpm run build

# --- Etapa de Producción ---
FROM node:18-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos necesarios para instalar solo producción
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY --from=builder /app/apps/frontend/package.json apps/frontend/

# Instalar solo dependencias de producción
RUN pnpm install --prod --frozen-lockfile

# Copiar los artifactos construidos desde la etapa builder
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/drizzle ./apps/backend/drizzle

# Configurar directorio de trabajo final
WORKDIR /app/apps/backend

# Crear directorio para datos
RUN mkdir -p /app/data

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_PATH=/app/data/saas_fiscal.db

EXPOSE 4000

CMD ["node", "dist/main.js"]
