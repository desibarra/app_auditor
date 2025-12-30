@echo off
setlocal
echo.
echo [96m==================================================[0m
echo [1m  RECUPERADOR DE DATOS DE AUDITORIA (DOCKER -> LOCAL)[0m
echo [96m==================================================[0m
echo.
echo Este script extraera tus empresas y datos fiscales registrados en Docker
echo y los conectara a tu entorno de desarrollo local (npm run dev).
echo.
echo [33mIMPORTANTE: Asegurate de que Docker Desktop este en ejecucion.[0m
echo.
pause

echo.
echo [94m[1/3][0m Verificando directorio de destino...
if not exist "apps\backend\data" mkdir "apps\backend\data"

echo.
echo [94m[2/3][0m Intentando extraccion directa desde contenedor...
docker cp sentinel-backend-prod:/app/data/saas_fiscal.db apps/backend/data/dev.db 2>npm-debug.log

if %errorlevel% equ 0 (
    echo [92m[EXITO] Base de datos extraida del contenedor correctamente.[0m
    goto :fin
)

echo.
echo [33m[AVISO][0m No se encontro el contenedor activo.
echo [94m[3/3][0m Intentando extraccion profunda desde VOLUMEN de Docker...

REM Intenta montar el volumen 'app_auditor_backend_data' o 'backend_data'
REM dependiendo del nombre del proyecto. Probaremos ambos.

docker run --rm -v app_auditor_backend_data:/source -v "%cd%\apps\backend\data":/dest alpine cp /source/saas_fiscal.db /dest/dev.db 2>nul
if %errorlevel% equ 0 goto :exito_volumen

docker run --rm -v backend_data:/source -v "%cd%\apps\backend\data":/dest alpine cp /source/saas_fiscal.db /dest/dev.db 2>nul
if %errorlevel% equ 0 goto :exito_volumen

echo.
echo [91m[ERROR CRITICO][0m No se pudieron encontrar los datos en Docker.
echo Posibles causas:
echo  1. Docker Desktop no esta corriendo.
echo  2. Los volumenes fueron borrados (docker system prune).
echo  3. El nombre del volumen es diferente (ejecuta 'docker volume ls').
echo.
pause
exit /b 1

:exito_volumen
echo [92m[EXITO] Base de datos recuperada desde el Volumen de Docker.[0m

:fin
echo.
echo [96m==================================================[0m
echo [1m  LISTO. TUS DATOS HAN SIDO RESTAURADOS.[0m
echo [96m==================================================[0m
echo.
echo Por favor:
echo 1. Deten cualquier proceso "npm run dev" corriendo (Ctrl+C).
echo 2. Vuelve a ejecutar: npm run dev
echo 3. Recarga el Dashboard -> Las empresas deberian aparecer.
echo.
pause
