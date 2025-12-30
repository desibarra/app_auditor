@echo off
color 0A
title SENTINEL FISCAL - INICIO PRODUCCION LOCAL

echo.
echo  ███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗     
echo  ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║     
echo  ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║     
echo  ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║     
echo  ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗
echo  ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝
echo.
echo  ═══════════════════════════════════════════════════════════════
echo                    PRODUCCION LOCAL v1.0
echo  ═══════════════════════════════════════════════════════════════
echo.

REM Verificar Docker
echo  [PASO 1/3] Verificando Docker Desktop...
timeout /t 1 /nobreak >nul
docker info >nul 2>&1
if errorlevel 1 (
    color 0C
    echo.
    echo  ❌ ERROR: Docker Desktop no esta corriendo
    echo.
    echo  Por favor:
    echo  1. Abre Docker Desktop
    echo  2. Espera a que el icono muestre que esta corriendo
    echo  3. Ejecuta este script nuevamente
    echo.
    pause
    exit /b 1
)
echo  ✅ Docker Desktop esta corriendo
echo.

REM Verificar si ya está corriendo
echo  [PASO 2/3] Verificando estado de la aplicacion...
timeout /t 1 /nobreak >nul
docker-compose -f docker-compose.prod.yml ps 2>nul | findstr "Up" >nul 2>&1
if not errorlevel 1 (
    echo  ✅ La aplicacion ya esta corriendo
    echo.
    echo  ═══════════════════════════════════════════════════════════════
    echo                        ACCESO A LA APP
    echo  ═══════════════════════════════════════════════════════════════
    echo.
    echo   Frontend:  http://localhost:3000
    echo   Backend:   http://localhost:4000
    echo   Health:    http://localhost:4000/api/health
    echo.
    echo  ═══════════════════════════════════════════════════════════════
    echo.
    set /p RESTART="  ¿Deseas reiniciar la aplicacion? (s/n): "
    if /i "%RESTART%"=="s" (
        echo.
        echo  🔄 Reiniciando servicios...
        docker-compose -f docker-compose.prod.yml restart
        timeout /t 3 /nobreak >nul
        echo  ✅ Aplicacion reiniciada
    )
    goto open_browser
)

REM Verificar si las imágenes existen
docker images 2>nul | findstr "app_auditor" >nul 2>&1
if errorlevel 1 (
    echo  🏗️  Primera vez - Construyendo imagenes...
    echo.
    echo  ⏳ Esto tomara 5-10 minutos (solo la primera vez)
    echo  ☕ Es buen momento para un cafe...
    echo.
    docker-compose -f docker-compose.prod.yml build
    if errorlevel 1 (
        color 0C
        echo.
        echo  ❌ Error al construir imagenes
        echo.
        pause
        exit /b 1
    )
    echo.
    echo  ✅ Imagenes construidas exitosamente
) else (
    echo  ✅ Imagenes encontradas
)
echo.

echo  [PASO 3/3] Iniciando servicios en modo produccion...
timeout /t 1 /nobreak >nul
docker-compose -f docker-compose.prod.yml up -d

if errorlevel 1 (
    color 0C
    echo.
    echo  ❌ Error al iniciar servicios
    echo.
    echo  Intenta:
    echo  1. docker-compose -f docker-compose.prod.yml down
    echo  2. Ejecuta este script nuevamente
    echo.
    pause
    exit /b 1
)

echo  ✅ Servicios iniciados
echo.
echo  ⏳ Esperando a que los servicios esten listos...
timeout /t 8 /nobreak >nul

:open_browser
cls
color 0A
echo.
echo  ███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗     
echo  ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║     
echo  ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║     
echo  ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║     
echo  ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗
echo  ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝
echo.
echo  ═══════════════════════════════════════════════════════════════
echo                    ✅ APLICACION LISTA
echo  ═══════════════════════════════════════════════════════════════
echo.
echo   🌐 Frontend:     http://localhost:3000
echo   ⚙️  Backend API:  http://localhost:4000
echo   💚 Health Check: http://localhost:4000/api/health
echo.
echo  ═══════════════════════════════════════════════════════════════
echo                    COMANDOS UTILES
echo  ═══════════════════════════════════════════════════════════════
echo.
echo   Ver logs:        docker-compose -f docker-compose.prod.yml logs -f
echo   Detener:         docker-compose -f docker-compose.prod.yml down
echo   Reiniciar:       docker-compose -f docker-compose.prod.yml restart
echo   Estado:          docker-compose -f docker-compose.prod.yml ps
echo   Gestionar:       MANAGE_PRODUCTION.bat
echo.
echo  ═══════════════════════════════════════════════════════════════
echo.

echo  🚀 Abriendo navegador...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo  ✨ Disfruta de Sentinel Fiscal en modo produccion!
echo.
pause
