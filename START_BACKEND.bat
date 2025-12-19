@echo off
echo ========================================
echo   Iniciando BACKEND - Puerto 4000
echo ========================================
echo.

cd apps\backend

echo Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

echo.
echo Iniciando servidor backend...
echo Backend estara disponible en: http://localhost:4000
echo Health check: http://localhost:4000/api/health
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

call npm run start:dev
