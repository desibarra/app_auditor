import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

import * as express from 'express';

async function bootstrap() {
  // Desactivar bodyParser por defecto para usar la configuración explícita de express
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Configurar límite de payload para archivos grandes (50MB)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Configurar CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Configurar prefijo global de API
  app.setGlobalPrefix('api');

  // Habilitar validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Backend running on: http://localhost:${port}/api`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
}

bootstrap();
