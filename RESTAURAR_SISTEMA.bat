@echo off
echo.
echo  [91m================================================== [0m
echo  [1m  PROTOCOLO DE RESET TOTAL DE SENTINEL [0m
echo  [91m================================================== [0m
echo.
echo  [33mIMPORTANTE: DETEN "npm run dev" ANTES DE CONTINUAR. [0m
echo Si el servidor esta corriendo, este script fallara.
echo.
pause

echo.
echo  [94m[1/2] [0m Eliminando base de datos corrupta...
if exist "apps\backend\data\dev.db" (
    del "apps\backend\data\dev.db"
    if exist "apps\backend\data\dev.db" (
        echo  [91m[ERROR] No se pudo borrar el archivo. Asegurate de detener el servidor node. [0m
        pause
        exit /b 1
    ) else (
        echo  [92m[OK] Base de datos limpia. [0m
    )
) else (
    echo  [94m[INFO] No existia base de datos previa. [0m
)

echo.
echo  [94m[2/2] [0m Regenerando estructura de tablas (Schema)...
cd apps\backend
call npm run db:push
cd ..\..

if %errorlevel% equ 0 (
    echo.
    echo  [92m[EXITO] SISTEMA RESTAURADO CORRECTAMENTE. [0m
    echo Ahora puedes ejecutar: npm run dev
    echo Y registrar tus empresas nuevamente.
) else (
    echo.
    echo  [91m[ERROR] Fallo la regeneracion de tablas. Revisar logs. [0m
)

echo.
pause
