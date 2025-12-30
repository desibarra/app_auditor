# Dockerfile para Frontend React (Contexto Raíz)
FROM node:18-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json apps/frontend/
COPY apps/backend/package.json apps/backend/

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Construir el frontend
WORKDIR /app/apps/frontend
RUN pnpm run build

# --- Etapa de Producción (Nginx) ---
FROM nginx:alpine

# Copiar build al directorio de nginx
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
