@echo off
setlocal enabledelayedexpansion

REM =========================================================
REM  SENTINEL FISCAL - Backup System v1.0
REM  Garantiza snapshots antes de operaciones críticas
REM =========================================================

REM Configuración de rutas
set "SOURCE=apps\backend\data\dev_clean.db"
set "BACKUP_DIR=apps\backend\backups"

REM Crear directorio si no existe
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Generar Timestamp ISO-like (Asumiendo formato DD/MM/YYYY o MM/DD/YYYY, se intenta normalizar)
REM Método robusto usando Powershell para evitar problemas de locale regional
for /f "tokens=*" %%a in ('powershell -Command "Get-Date -format 'yyyyMMdd_HHmmss'"') do set TIMESTAMP=%%a

set "DEST=%BACKUP_DIR%\backup_%TIMESTAMP%.db"

echo.
echo  [96m[BACKUP START] [0m Iniciando respaldo de seguridad...
echo  Base de datos: %SOURCE%
echo  Destino:       %DEST%
echo.

if not exist "%SOURCE%" (
    echo  [91m[ERROR] [0m No se encontro la base de datos fuente.
    echo  Verifica que el sistema se haya iniciado al menos una vez.
    pause
    exit /b 1
)

REM Copia en caliente (SQLite lo permite, pero mejor si no hay escrituras masivas)
copy "%SOURCE%" "%DEST%" >nul

if %errorlevel% equ 0 (
    echo  [92m[SUCCESS] [0m Respaldo completado correctamente.
    
    REM Registrar en LOG
    echo | set /p="| %TIMESTAMP% | AUTO | SYSTEM | Respaldo automatico por script |" >> BACKUPS_LOG.md
    echo. >> BACKUPS_LOG.md
    
    echo  [90m[LOG] [0m Registrado en BACKUPS_LOG.md
) else (
    echo  [91m[FAIL] [0m Error al copiar el archivo. Puede estar bloqueado.
)

echo.
echo  Presiona una tecla para continuar...
timeout /t 5 >nul
