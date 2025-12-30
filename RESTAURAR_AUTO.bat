@echo off
echo  [94m[1/2] [0m Asegurando entorno limpio...
if not exist "apps\backend\data" mkdir "apps\backend\data"
if exist "apps\backend\data\dev.db" del /F "apps\backend\data\dev.db"

echo.
echo  [94m[2/2] [0m Regenerando tablas (Schema)...
cd apps\backend
call npx drizzle-kit push:sqlite
if %errorlevel% equ 0 (
    echo  [92m[EXITO] Base de datos nueva creada y lista. [0m
) else (
    echo  [91m[ERROR] Fallo al crear tablas. [0m
    exit /b 1
)
exit /b 0
