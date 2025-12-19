# ✅ Checklist de Prueba Local

## Infraestructura
- [ ] Docker containers levantados: `docker ps` muestra postgres, redis, pgadmin
- [ ] Postgres accesible en localhost:5432
- [ ] Redis accesible en localhost:6379
- [ ] PgAdmin accesible en http://localhost:5050

## Backend
- [ ] Deps instaladas: `npm install` en apps/backend sin errores
- [ ] .env configurado con DATABASE_URL correcta
- [ ] Migraciones corridas: `npm run db:migrate` sin errores
- [ ] Seed ejecutado: `npm run seed:demo` sin errores
- [ ] Backend levantado: `npm run start:dev` arranca sin errores
- [ ] Endpoint /api/health responde en http://localhost:4000/api/health
- [ ] Swagger disponible en http://localhost:4000/api/docs

## Frontend
- [ ] Deps instaladas: `npm install` en apps/frontend sin errores
- [ ] .env.local configurado
- [ ] Dev server levantado: `npm run dev` arranca sin errores
- [ ] Frontend abre en http://localhost:5173 sin error de conexión

## Prueba End-to-End
- [ ] Login funciona (demo@saas-fiscal.com / password123)
- [ ] Aparece la empresa "Empresa de Prueba"
- [ ] Se puede navegar al módulo "Devoluciones de IVA"
- [ ] Se puede crear un expediente (RFC TEST123456789, periodo 2025-01)
- [ ] Se puede ver la lista de expedientes creados
- [ ] Se puede entrar al detalle del expediente
- [ ] Se puede recalcular cédulas
- [ ] Aparecen los CFDI de prueba en la cédula de IVA acreditable
- [ ] Los totales (base, IVA, total) son correctos
- [ ] PgAdmin muestra datos en tablas (expedientes_devolucion_iva, cedulas_iva)