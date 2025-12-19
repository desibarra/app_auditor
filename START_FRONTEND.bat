@echo off
echo ========================================
echo   Iniciando FRONTEND - Puerto 3000
echo ========================================
echo.

cd apps\frontend

echo Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
)

echo.
echo Iniciando servidor frontend...
echo Frontend estara disponible en: http://localhost:3000
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

call npm run dev
