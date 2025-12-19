@echo off
REM ========================================
REM Script de Verificacion - App Auditor
REM Verifica el estado del proyecto
REM ========================================

echo.
echo ========================================
echo   Verificacion del Proyecto
echo ========================================
echo.

set ERRORS=0
set WARNINGS=0

REM Verificar Node.js
echo [CHECK] Node.js instalado...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js no esta instalado
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [OK] Node.js %NODE_VERSION%
)

REM Verificar npm
echo [CHECK] npm instalado...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm no esta instalado
    set /a ERRORS+=1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo [OK] npm %NPM_VERSION%
)

echo.
echo ----------------------------------------
echo   Estructura de Directorios
echo ----------------------------------------
echo.

REM Verificar estructura de directorios
echo [CHECK] Directorio apps/backend...
if exist "apps\backend" (
    echo [OK] apps/backend existe
) else (
    echo [ERROR] apps/backend no existe
    set /a ERRORS+=1
)

echo [CHECK] Directorio apps/frontend...
if exist "apps\frontend" (
    echo [OK] apps/frontend existe
) else (
    echo [ERROR] apps/frontend no existe
    set /a ERRORS+=1
)

echo.
echo ----------------------------------------
echo   Backend
echo ----------------------------------------
echo.

REM Verificar backend
echo [CHECK] Backend package.json...
if exist "apps\backend\package.json" (
    echo [OK] package.json existe
) else (
    echo [ERROR] package.json no existe
    set /a ERRORS+=1
)

echo [CHECK] Backend node_modules...
if exist "apps\backend\node_modules" (
    echo [OK] node_modules instalado
) else (
    echo [WARN] node_modules no instalado - ejecuta: npm install
    set /a WARNINGS+=1
)

echo [CHECK] Backend .env...
if exist "apps\backend\.env" (
    echo [OK] .env configurado
) else (
    echo [WARN] .env no existe - copia .env.example a .env
    set /a WARNINGS+=1
)

echo [CHECK] Backend directorio data...
if exist "apps\backend\data" (
    echo [OK] directorio data existe
) else (
    echo [WARN] directorio data no existe - se creara automaticamente
    set /a WARNINGS+=1
)

echo [CHECK] Base de datos SQLite...
if exist "apps\backend\data\dev.db" (
    echo [OK] dev.db existe
) else if exist "apps\backend\sqlite\dev.db" (
    echo [OK] dev.db existe (en sqlite/)
) else (
    echo [WARN] dev.db no existe - ejecuta: npm run db:push
    set /a WARNINGS+=1
)

echo.
echo ----------------------------------------
echo   Frontend
echo ----------------------------------------
echo.

REM Verificar frontend
echo [CHECK] Frontend package.json...
if exist "apps\frontend\package.json" (
    echo [OK] package.json existe
) else (
    echo [ERROR] package.json no existe
    set /a ERRORS+=1
)

echo [CHECK] Frontend node_modules...
if exist "apps\frontend\node_modules" (
    echo [OK] node_modules instalado
) else (
    echo [WARN] node_modules no instalado - ejecuta: npm install
    set /a WARNINGS+=1
)

echo [CHECK] Frontend .env...
if exist "apps\frontend\.env" (
    echo [OK] .env configurado
) else (
    echo [WARN] .env no existe - copia .env.example a .env
    set /a WARNINGS+=1
)

echo.
echo ----------------------------------------
echo   Archivos de Configuracion
echo ----------------------------------------
echo.

echo [CHECK] Backend drizzle.config.ts...
if exist "apps\backend\drizzle.config.ts" (
    echo [OK] drizzle.config.ts existe
) else (
    echo [ERROR] drizzle.config.ts no existe
    set /a ERRORS+=1
)

echo [CHECK] Backend tsconfig.json...
if exist "apps\backend\tsconfig.json" (
    echo [OK] tsconfig.json existe
) else (
    echo [ERROR] tsconfig.json no existe
    set /a ERRORS+=1
)

echo [CHECK] Frontend vite.config.ts...
if exist "apps\frontend\vite.config.ts" (
    echo [OK] vite.config.ts existe
) else (
    echo [ERROR] vite.config.ts no existe
    set /a ERRORS+=1
)

echo [CHECK] Frontend tsconfig.json...
if exist "apps\frontend\tsconfig.json" (
    echo [OK] tsconfig.json existe
) else (
    echo [ERROR] tsconfig.json no existe
    set /a ERRORS+=1
)

echo.
echo ========================================
echo   RESUMEN
echo ========================================
echo.

if %ERRORS% EQU 0 (
    if %WARNINGS% EQU 0 (
        echo [SUCCESS] El proyecto esta listo para compilar
        echo.
        echo Ejecuta: QUICK_START_MEJORADO.bat
    ) else (
        echo [ATENCION] %WARNINGS% advertencia(s) encontrada(s)
        echo El proyecto puede funcionar, pero revisa las advertencias
        echo.
        echo Ejecuta: QUICK_START_MEJORADO.bat
    )
) else (
    echo [ERROR] %ERRORS% error(es) critico(s) encontrado(s)
    echo [WARN] %WARNINGS% advertencia(s) encontrada(s)
    echo.
    echo Por favor, corrige los errores antes de continuar
)

echo.
pause
