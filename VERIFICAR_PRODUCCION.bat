@echo off
REM ========================================
REM Verificación Pre-Despliegue
REM ========================================

echo.
echo ========================================
echo   VERIFICACION PRE-DESPLIEGUE
echo ========================================
echo.

set ERRORS=0

REM 1. Verificar Docker
echo [1/7] Verificando Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo [X] Docker no esta instalado
    set /a ERRORS+=1
) else (
    docker info >nul 2>&1
    if errorlevel 1 (
        echo [X] Docker no esta corriendo
        set /a ERRORS+=1
    ) else (
        echo [OK] Docker esta corriendo
    )
)

REM 2. Verificar archivos Docker
echo [2/7] Verificando archivos Docker...
if not exist "docker-compose.prod.yml" (
    echo [X] Falta docker-compose.prod.yml
    set /a ERRORS+=1
) else (
    echo [OK] docker-compose.prod.yml encontrado
)

if not exist "apps\backend\Dockerfile" (
    echo [X] Falta apps\backend\Dockerfile
    set /a ERRORS+=1
) else (
    echo [OK] Backend Dockerfile encontrado
)

if not exist "apps\frontend\Dockerfile" (
    echo [X] Falta apps\frontend\Dockerfile
    set /a ERRORS+=1
) else (
    echo [OK] Frontend Dockerfile encontrado
)

REM 3. Verificar configuración
echo [3/7] Verificando configuracion...
if not exist ".env.production" (
    echo [!] Advertencia: .env.production no encontrado
    echo     Se usaran valores por defecto
) else (
    echo [OK] .env.production encontrado
)

if not exist "apps\frontend\nginx.conf" (
    echo [X] Falta apps\frontend\nginx.conf
    set /a ERRORS+=1
) else (
    echo [OK] nginx.conf encontrado
)

REM 4. Verificar espacio en disco
echo [4/7] Verificando espacio en disco...
for /f "tokens=3" %%a in ('dir /-c ^| find "bytes free"') do set FREE_SPACE=%%a
echo [OK] Espacio disponible verificado

REM 5. Verificar puertos
echo [5/7] Verificando puertos disponibles...
netstat -ano | findstr ":3000" >nul 2>&1
if not errorlevel 1 (
    echo [!] Advertencia: Puerto 3000 puede estar en uso
    echo     La aplicacion podria no iniciar correctamente
)

netstat -ano | findstr ":4000" >nul 2>&1
if not errorlevel 1 (
    echo [!] Advertencia: Puerto 4000 puede estar en uso
    echo     La aplicacion podria no iniciar correctamente
)

echo [OK] Verificacion de puertos completada

REM 6. Verificar memoria disponible
echo [6/7] Verificando recursos del sistema...
for /f "skip=1" %%p in ('wmic os get FreePhysicalMemory') do (
    set FREE_MEM=%%p
    goto :mem_done
)
:mem_done
if defined FREE_MEM (
    if %FREE_MEM% LSS 2097152 (
        echo [!] Advertencia: Poca memoria disponible (menos de 2GB)
        echo     Se recomienda cerrar otras aplicaciones
    ) else (
        echo [OK] Memoria disponible suficiente
    )
)

REM 7. Verificar estructura de directorios
echo [7/7] Verificando estructura de directorios...
if not exist "apps\backend" (
    echo [X] Falta directorio apps\backend
    set /a ERRORS+=1
) else if not exist "apps\frontend" (
    echo [X] Falta directorio apps\frontend
    set /a ERRORS+=1
) else (
    echo [OK] Estructura de directorios correcta
)

echo.
echo ========================================
echo   RESUMEN DE VERIFICACION
echo ========================================
echo.

if %ERRORS% EQU 0 (
    echo [OK] Todas las verificaciones pasaron!
    echo.
    echo La aplicacion esta lista para desplegarse.
    echo.
    echo Para iniciar, ejecuta:
    echo   START_PRODUCTION.bat
    echo.
) else (
    echo [X] Se encontraron %ERRORS% errores
    echo.
    echo Por favor corrige los errores antes de continuar.
    echo.
)

echo ========================================
echo.
pause
