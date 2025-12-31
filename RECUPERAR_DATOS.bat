@echo off
setlocal
echo.
echo  [96m================================================== [0m
echo  [1m  RECUPERADOR DE DATOS DE AUDITORIA (INTELIGENTE) [0m
echo  [96m================================================== [0m
echo.
echo Este script extraera tus empresas y datos fiscales registrados.
echo Intentara usar Docker, y si falla, buscara respaldos locales.
echo.

echo  [94m[1/3] [0m Preparando directorios...
if not exist "apps\backend\data" mkdir "apps\backend\data"

echo.
echo  [94m[2/3] [0m Intentando extraccion desde Docker...
docker cp sentinel-backend-prod:/app/data/saas_fiscal.db apps/backend/data/dev.db 2>nul

if %errorlevel% equ 0 (
    echo  [92m[EXITO] Base de datos extraida del contenedor correctamente. [0m
    goto :fin
)

REM Si falla Docker, buscar volumenes
docker run --rm -v app_auditor_backend_data:/source -v "%cd%\apps\backend\data":/dest alpine cp /source/saas_fiscal.db /dest/dev.db 2>nul
if %errorlevel% equ 0 goto :exito_volumen

docker run --rm -v backend_data:/source -v "%cd%\apps\backend\data":/dest alpine cp /source/saas_fiscal.db /dest/dev.db 2>nul
if %errorlevel% equ 0 goto :exito_volumen

echo.
echo  [33m[AVISO] [0m Docker no disponible o datos no encontrados en contenedores.
echo  [94m[3/3] [0m Buscando base de datos local (Fallback)...

if exist "saas_fiscal.db" (
    echo  [94m[INFO] [0m Encontrado saas_fiscal.db en el root.
    copy "saas_fiscal.db" "apps\backend\data\dev.db" /Y >nul
    echo  [92m[EXITO] Se uso el respaldo local 'saas_fiscal.db'. [0m
    goto :fin
)

if exist "apps\backend\data\dev_clean.db" (
    echo  [94m[INFO] [0m Usando base de datos sanitizada (dev_clean.db) como principal.
    copy "apps\backend\data\dev_clean.db" "apps\backend\data\dev.db" /Y >nul
    echo  [92m[EXITO] Se inicializo 'dev.db' desde 'dev_clean.db'. [0m
    goto :fin
)

echo.
echo  [91m[ERROR] [0m No se encontraron datos para recuperar.
echo Por favor, asegurese de tener el archivo saas_fiscal.db en el root
echo o que Docker este en ejecucion con sus volumenes originales.
pause
exit /b 1

:exito_volumen
echo  [92m[EXITO] Base de datos recuperada desde el Volumen de Docker. [0m

:fin
echo.
echo  [96m================================================== [0m
echo  [1m  PROCESO FINALIZADO. [0m
echo  [96m================================================== [0m
echo.
echo Los datos de Koppara y demas empresas estan ahora en 'dev.db'.
echo Asegurate de que el archivo .env tenga: DATABASE_PATH=./data/dev.db
echo.
pause
