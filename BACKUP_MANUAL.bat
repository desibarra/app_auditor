@echo off
setlocal enabledelayedexpansion

REM CONFIGURACIÓN
set SOURCE=apps\backend\data\dev_clean.db
set BACKUP_ROOT=apps\backend\backups
set TIMESTAMP=%date:~6,4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=!TIMESTAMP: =0!
set DEST=%BACKUP_ROOT%\backup_!TIMESTAMP!.db

echo.
echo  [96m================================================== [0m
echo  [1m  SENTINEL FISCAL - RESPALDO DE BASE DE DATOS [0m
echo  [96m================================================== [0m
echo.

REM 1. Verificar Fuente
if not exist "%SOURCE%" (
    echo  [91m[ERROR] No se encuentra la base de datos activa: %SOURCE% [0m
    echo Asegurate de que la aplicacion haya sido iniciada al menos una vez.
    pause
    exit /b 1
)

REM 2. Crear Directorio
if not exist "%BACKUP_ROOT%" mkdir "%BACKUP_ROOT%"

REM 3. Ejecutar Copia
echo  [94m[INFO] [0m Generando snapshot en caliente...
copy "%SOURCE%" "%DEST%" >nul

if %errorlevel% equ 0 (
    echo.
    echo  [92m[EXITO] Respaldo creado correctamente: [0m
    echo Archivo: %DEST%
    echo.
    echo Ya puedes realizar operaciones criticas con seguridad.
) else (
    echo.
    echo  [91m[ERROR] Fallo la copia de seguridad. [0m
    echo El archivo podria estar bloqueado. Intenta detener npm run dev primero.
)

echo.
pause
