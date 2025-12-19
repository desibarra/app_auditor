# Troubleshooting

## Problema: Puerto 5173 ya está en uso
- **Causa**: Otro proceso está utilizando el puerto.
- **Solución**: Detén el proceso que usa el puerto o cambia el puerto en `vite.config.ts`.
  ```bash
  npx kill-port 5173
  ```

## Problema: Base de datos no conecta
- **Causa**: El contenedor de PostgreSQL no está corriendo.
- **Solución**: Verifica los contenedores activos:
  ```bash
  docker ps
  ```
  Si no está activo, reinicia Docker Compose:
  ```bash
  docker-compose -f infra/docker/docker-compose.yml up -d
  ```

## Problema: `npm install` falla
- **Causa**: Dependencias corruptas o faltantes.
- **Solución**: Limpia la caché de npm y reinstala:
  ```bash
  npm cache clean --force
  npm install
  ```

## Problema: Frontend no ve el backend
- **Causa**: El backend no está corriendo o la URL es incorrecta.
- **Solución**: Verifica que el backend esté activo en `http://localhost:4000` y revisa `.env.local`.

## Problema: Seed no ejecuta
- **Causa**: Error en las migraciones o conexión a la base de datos.
- **Solución**: Verifica las migraciones y la conexión:
  ```bash
  npm run db:migrate
  npm run seed:demo
  ```