@echo off
REM ========================================
REM Script de Despliegue en Producción
REM Sentinel Fiscal - App Auditor
REM ========================================

echo.
echo ========================================
echo   SENTINEL FISCAL - DESPLIEGUE PRODUCCION
echo ========================================
echo.

REM Verificar que Docker está corriendo
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no esta corriendo. Por favor inicia Docker Desktop.
    pause
    exit /b 1
)

echo [1/6] Docker verificado correctamente
echo.

REM Detener contenedores existentes
echo [2/6] Deteniendo contenedores existentes...
docker-compose -f docker-compose.prod.yml down
echo.

REM Limpiar imágenes antiguas (opcional)
set /p CLEAN_IMAGES="Deseas limpiar imagenes antiguas? (s/n): "
if /i "%CLEAN_IMAGES%"=="s" (
    echo Limpiando imagenes antiguas...
    docker image prune -f
    echo.
)

REM Construir imágenes
echo [3/6] Construyendo imagenes de produccion...
echo Esto puede tomar varios minutos...
docker-compose -f docker-compose.prod.yml build --no-cache
if errorlevel 1 (
    echo [ERROR] Fallo la construccion de imagenes
    pause
    exit /b 1
)
echo.

REM Iniciar servicios
echo [4/6] Iniciando servicios en produccion...
docker-compose -f docker-compose.prod.yml up -d
if errorlevel 1 (
    echo [ERROR] Fallo al iniciar servicios
    pause
    exit /b 1
)
echo.

REM Esperar a que los servicios estén listos
echo [5/6] Esperando a que los servicios esten listos...
timeout /t 10 /nobreak >nul

REM Verificar estado de los servicios
echo [6/6] Verificando estado de servicios...
docker-compose -f docker-compose.prod.yml ps
echo.

REM Mostrar logs iniciales
echo ========================================
echo   LOGS INICIALES
echo ========================================
docker-compose -f docker-compose.prod.yml logs --tail=20
echo.

REM Información de acceso
echo ========================================
echo   DESPLIEGUE COMPLETADO
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:4000
echo Health:   http://localhost:4000/api/health
echo Redis:    localhost:6379
echo.
echo ========================================
echo   COMANDOS UTILES
echo ========================================
echo.
echo Ver logs:           docker-compose -f docker-compose.prod.yml logs -f
echo Ver logs backend:   docker-compose -f docker-compose.prod.yml logs -f backend
echo Ver logs frontend:  docker-compose -f docker-compose.prod.yml logs -f frontend
echo Detener servicios:  docker-compose -f docker-compose.prod.yml down
echo Reiniciar:          docker-compose -f docker-compose.prod.yml restart
echo Estado:             docker-compose -f docker-compose.prod.yml ps
echo.
echo ========================================

pause
