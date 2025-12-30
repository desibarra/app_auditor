@echo off
if not exist "apps\backend\data" mkdir "apps\backend\data"

echo INTENTO 1: DOCKER CP DESDE CONTENEDOR
docker cp sentinel-backend-prod:/app/data/saas_fiscal.db apps/backend/data/dev.db
if %errorlevel% equ 0 (
    echo [EXITO] Contenedor encontrado.
    exit /b 0
)

echo INTENTO 2: VOLUMEN app_auditor_backend_data
docker run --rm -v app_auditor_backend_data:/source -v "%cd%\apps\backend\data":/dest alpine cp /source/saas_fiscal.db /dest/dev.db
if %errorlevel% equ 0 (
    echo [EXITO] Volumen app_auditor_backend_data encontrado.
    exit /b 0
)

echo INTENTO 3: VOLUMEN backend_data
docker run --rm -v backend_data:/source -v "%cd%\apps\backend\data":/dest alpine cp /source/saas_fiscal.db /dest/dev.db
if %errorlevel% equ 0 (
    echo [EXITO] Volumen backend_data encontrado.
    exit /b 0
)

echo [FALLO] No se pudo recuperar de ninguna fuente.
exit /b 1
