# Guía para Correr el Proyecto en Localhost

## Estructura de Carpetas
El proyecto está organizado como un monorepo con las siguientes carpetas:
```
saas-fiscal-pymes/
  apps/
    backend/
    frontend/
  infra/
    docker/
```

---

## Variables de Entorno

### Backend (`apps/backend/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/app_auditor
JWT_SECRET=supersecretkey
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=app-auditor-bucket
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

### Frontend (`apps/frontend/.env`):
```env
VITE_API_URL=http://localhost:3000/api
```

---

## Configuración de Docker

### Archivo `docker-compose.yml`:
Ubicado en `auditor-local/docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app_auditor
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
```

### Levantar Docker:
```bash
cd c:/Users/desib/Documents/auditor-local
docker-compose up -d
```
Verifica que los contenedores estén corriendo:
```bash
docker ps
```

---

## Comandos Exactos

### Backend:
1. Instalar dependencias:
   ```bash
   cd c:/Users/desib/Documents/saas-fiscal-pymes/apps/backend
   npm install
   ```
2. Generar y aplicar migraciones Drizzle:
   ```bash
   npx drizzle-kit generate:pg
   npx drizzle-kit migrate:pg
   ```
3. Iniciar el servidor en modo desarrollo:
   ```bash
   npm run start:dev
   ```

### Frontend:
1. Instalar dependencias:
   ```bash
   cd c:/Users/desib/Documents/saas-fiscal-pymes/apps/frontend
   npm install
   ```
2. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

### Correr ambos al mismo tiempo:
Usar `concurrently` para ejecutar ambos servidores:
```bash
npm install -g concurrently
concurrently "cd apps/backend && npm run start:dev" "cd apps/frontend && npm run dev"
```

---

## Seed de Datos Demo

### Endpoint:
Con el backend corriendo, ejecuta:
```bash
curl -X POST http://localhost:3000/api/seed/demo
```
Respuesta esperada:
```json
{
  "message": "Datos demo insertados correctamente."
}
```

---

## Rutas Finales del Frontend
- **Dashboard principal:** `/`
- **Importar CFDI:** `/import`
- **Lista de CFDI:** `/cfdi`
- **Detalle de Expediente:** `/cfdi/:uuid/expediente`
- **Login:** `/login`

---

Con esta guía y el seeding, puedes levantar el proyecto en localhost, probar el flujo completo y validar el MVP. ¡A volar!