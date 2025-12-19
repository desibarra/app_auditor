@echo off

REM Levantar infraestructura con Docker Compose
echo Levantando infraestructura con Docker Compose...
docker-compose -f infra/docker/docker-compose.yml up -d

REM Instalar dependencias del backend
echo Instalando dependencias del backend...
cd apps\backend
npm install

REM Configurar entorno del backend
echo Configurando entorno del backend...
copy .env.example .env

REM Correr migraciones y seed
echo Aplicando migraciones y ejecutando seed...
npm run setup:local

REM Levantar backend
echo Levantando backend...
npm run start:dev

REM Instalar dependencias del frontend
echo Instalando dependencias del frontend...
cd ..\..\frontend
npm install

REM Configurar entorno del frontend
echo Configurando entorno del frontend...
copy .env.local.example .env.local

REM Levantar frontend
echo Levantando frontend...
npm run dev

pause