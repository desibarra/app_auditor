@echo off
echo  [93m[!] DETENIENDO PROCESOS ANTERIORES... [0m
taskkill /F /IM node.exe >nul 2>&1
echo  [92m[OK] Procesos limpios. [0m
echo.
echo  [96m[INFO] Iniciando Sentinel Fiscal (Backend + Frontend)... [0m
echo  [90m(Por favor espera a que aparezca 'Nest application successfully started' y 'VITE v4...') [0m
echo.
npm run dev
