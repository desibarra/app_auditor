@echo off
REM ========================================
REM Script de Gestión de Producción Local
REM Sentinel Fiscal - App Auditor
REM ========================================

:menu
cls
echo.
echo ========================================
echo   SENTINEL FISCAL - GESTION PRODUCCION
echo ========================================
echo.
echo 1. Iniciar en modo produccion
echo 2. Detener servicios
echo 3. Ver logs en tiempo real
echo 4. Ver estado de servicios
echo 5. Reiniciar servicios
echo 6. Limpiar y reconstruir
echo 7. Backup de base de datos
echo 8. Restaurar backup
echo 9. Salir
echo.
echo ========================================
set /p OPTION="Selecciona una opcion (1-9): "

if "%OPTION%"=="1" goto start
if "%OPTION%"=="2" goto stop
if "%OPTION%"=="3" goto logs
if "%OPTION%"=="4" goto status
if "%OPTION%"=="5" goto restart
if "%OPTION%"=="6" goto rebuild
if "%OPTION%"=="7" goto backup
if "%OPTION%"=="8" goto restore
if "%OPTION%"=="9" goto end
goto menu

:start
echo.
echo Iniciando servicios en modo produccion...
docker-compose -f docker-compose.prod.yml up -d
echo.
echo Servicios iniciados!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:4000/api/health
timeout /t 3 /nobreak >nul
goto menu

:stop
echo.
echo Deteniendo servicios...
docker-compose -f docker-compose.prod.yml down
echo Servicios detenidos!
timeout /t 2 /nobreak >nul
goto menu

:logs
echo.
echo Mostrando logs en tiempo real (Ctrl+C para salir)...
echo.
docker-compose -f docker-compose.prod.yml logs -f
goto menu

:status
echo.
echo Estado de servicios:
echo.
docker-compose -f docker-compose.prod.yml ps
echo.
pause
goto menu

:restart
echo.
echo Reiniciando servicios...
docker-compose -f docker-compose.prod.yml restart
echo Servicios reiniciados!
timeout /t 2 /nobreak >nul
goto menu

:rebuild
echo.
echo ADVERTENCIA: Esto reconstruira todas las imagenes desde cero.
set /p CONFIRM="Estas seguro? (s/n): "
if /i not "%CONFIRM%"=="s" goto menu
echo.
echo Deteniendo servicios...
docker-compose -f docker-compose.prod.yml down
echo Reconstruyendo imagenes...
docker-compose -f docker-compose.prod.yml build --no-cache
echo Iniciando servicios...
docker-compose -f docker-compose.prod.yml up -d
echo.
echo Reconstruccion completada!
timeout /t 3 /nobreak >nul
goto menu

:backup
echo.
echo Creando backup de la base de datos...
if not exist "backups" mkdir backups
set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
docker cp sentinel-backend-prod:/app/data/saas_fiscal.db backups\saas_fiscal_%TIMESTAMP%.db
echo.
echo Backup creado: backups\saas_fiscal_%TIMESTAMP%.db
pause
goto menu

:restore
echo.
echo Backups disponibles:
dir /b backups\*.db 2>nul
echo.
set /p BACKUP_FILE="Ingresa el nombre del archivo de backup: "
if not exist "backups\%BACKUP_FILE%" (
    echo Error: Archivo no encontrado
    pause
    goto menu
)
echo.
echo ADVERTENCIA: Esto sobrescribira la base de datos actual.
set /p CONFIRM="Estas seguro? (s/n): "
if /i not "%CONFIRM%"=="s" goto menu
docker cp backups\%BACKUP_FILE% sentinel-backend-prod:/app/data/saas_fiscal.db
docker-compose -f docker-compose.prod.yml restart backend
echo.
echo Base de datos restaurada!
pause
goto menu

:end
echo.
echo Saliendo...
exit /b 0
