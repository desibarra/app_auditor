# Guía para Prueba Local de la Plataforma SaaS Fiscal PyMEs

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalados los siguientes programas:

- **Node.js 18+**: [Descargar Node.js](https://nodejs.org/)
- **Docker**: [Descargar Docker](https://www.docker.com/)
- **Docker Compose**: Incluido con Docker Desktop.

---

## Paso 1: Levantar Infraestructura

Ejecuta el siguiente comando para levantar los servicios necesarios (PostgreSQL, Redis, PgAdmin):

```bash
docker-compose -f infra/docker/docker-compose.yml up -d
```

---

## Paso 2: Preparar Backend

1. Navega al directorio del backend:
   ```bash
   cd apps/backend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura el archivo `.env`:
   - Copia el archivo de ejemplo:
     ```bash
     cp .env.example .env
     ```

4. Aplica las migraciones:
   ```bash
   npm run db:migrate
   ```

5. Ejecuta el seed de datos de prueba:
   ```bash
   npm run seed:demo
   ```

6. Levanta el servidor de desarrollo:
   ```bash
   npm run start:dev
   ```

---

## Paso 3: Preparar Frontend

1. Navega al directorio del frontend:
   ```bash
   cd apps/frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura el archivo `.env.local`:
   - Copia el archivo de ejemplo:
     ```bash
     cp .env.example .env.local
     ```

4. Levanta el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

## Paso 4: Verificar Estado

1. Verifica que los servicios están corriendo:
   ```bash
   docker ps
   ```

2. Prueba el backend:
   ```bash
   curl http://localhost:4000/api/health
   ```

3. Abre el frontend en tu navegador:
   ```
   http://localhost:5173
   ```

---

## Paso 5: Flujo Manual de Prueba

1. **Login**:
   - Usuario: `demo@saas-fiscal.com`
   - Contraseña: `password123`

2. **Seleccionar Empresa**:
   - Selecciona "Empresa de Prueba" (RFC: `TEST123456789`).

3. **Ir al Módulo Devoluciones de IVA**:
   - Navega al módulo desde el menú principal.

4. **Crear Expediente**:
   - RFC: `TEST123456789`
   - Periodo: `2025-01`
   - Tipo: `Saldos a favor de IVA`

5. **Recalcular Cédulas**:
   - En el detalle del expediente, haz clic en "Recalcular cédulas".

6. **Verificar Cédulas**:
   - Confirma que los CFDI de prueba aparecen correctamente.
   - Verifica los totales (base, IVA, total).

---

## Troubleshooting

### Problema: Docker no levanta los contenedores
- Solución: Verifica que Docker esté corriendo y ejecuta:
  ```bash
  docker-compose -f infra/docker/docker-compose.yml up -d
  ```

### Problema: Error de conexión a la base de datos
- Solución: Verifica que el contenedor de PostgreSQL esté corriendo:
  ```bash
  docker ps
  ```

### Problema: El frontend no carga
- Solución: Asegúrate de que el backend esté corriendo en `http://localhost:4000` y revisa el archivo `.env.local`.