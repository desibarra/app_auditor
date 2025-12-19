@echo off
REM ========================================
REM Script de Inicio Rápido - App Auditor
REM Versión: 2.0
REM Fecha: 2025-12-18
REM ========================================

echo.
echo ========================================
echo   App Auditor - Inicio Rapido
echo ========================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "apps\backend" (
    echo ERROR: No se encuentra el directorio apps\backend
    echo Por favor, ejecuta este script desde la raiz del proyecto
    pause
    exit /b 1
)

if not exist "apps\frontend" (
    echo ERROR: No se encuentra el directorio apps\frontend
    echo Por favor, ejecuta este script desde la raiz del proyecto
    pause
    exit /b 1
)

echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Por favor, instala Node.js 18+ desde https://nodejs.org/
    pause
    exit /b 1
)
echo OK - Node.js instalado
echo.

echo [2/6] Instalando dependencias del backend...
cd apps\backend
if not exist "node_modules" (
    echo Instalando dependencias por primera vez...
    call npm install
    if errorlevel 1 (
        echo ERROR: Fallo la instalacion de dependencias del backend
        cd ..\..
        pause
        exit /b 1
    )
) else (
    echo Dependencias ya instaladas
)
cd ..\..
echo OK - Dependencias del backend listas
echo.

echo [3/6] Configurando entorno del backend...
cd apps\backend
if not exist ".env" (
    echo Creando archivo .env desde .env.example...
    copy .env.example .env >nul
    echo OK - Archivo .env creado
) else (
    echo OK - Archivo .env ya existe
)

REM Crear directorio de datos si no existe
if not exist "data" (
    echo Creando directorio de datos...
    mkdir data
    echo OK - Directorio data creado
) else (
    echo OK - Directorio data existe
)
cd ..\..
echo.

echo [4/6] Preparando base de datos...
cd apps\backend
if not exist "data\dev.db" (
    echo Generando esquema de base de datos...
    call npm run db:generate
    if errorlevel 1 (
        echo ADVERTENCIA: db:generate fallo, intentando con drizzle-kit...
        call npx drizzle-kit generate:sqlite
    )
    
    echo Aplicando migraciones...
    call npm run db:push
    if errorlevel 1 (
        echo ADVERTENCIA: db:push fallo, intentando con drizzle-kit...
        call npx drizzle-kit push:sqlite
    )
    
    echo Cargando datos de prueba...
    call npm run seed:demo
    if errorlevel 1 (
        echo ADVERTENCIA: No se pudieron cargar los datos de prueba
    )
    echo OK - Base de datos preparada
) else (
    echo OK - Base de datos ya existe
)
cd ..\..
echo.

echo [5/6] Instalando dependencias del frontend...
cd apps\frontend
if not exist "node_modules" (
    echo Instalando dependencias por primera vez...
    call npm install
    if errorlevel 1 (
        echo ERROR: Fallo la instalacion de dependencias del frontend
        cd ..\..
        pause
        exit /b 1
    )
) else (
    echo Dependencias ya instaladas
)

if not exist ".env" (
    echo Creando archivo .env desde .env.example...
    copy .env.example .env >nul
    echo OK - Archivo .env creado
) else (
    echo OK - Archivo .env ya existe
)
cd ..\..
echo OK - Frontend configurado
echo.

echo [6/6] Iniciando servidores...
echo.
echo ========================================
echo   SERVIDORES INICIADOS
echo ========================================
echo.
echo Backend:  http://localhost:4000/api/health
echo Frontend: http://localhost:3000
echo.
echo Credenciales de prueba:
echo   Usuario: demo@saas-fiscal.com
echo   Password: password123
echo.
echo Presiona Ctrl+C para detener los servidores
echo ========================================
echo.

REM Iniciar ambos servidores usando concurrently
call npm run dev

pause
