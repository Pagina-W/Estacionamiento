@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo Instalando por primera vez, espera un momento...
  call npm install
)
call npm run build
echo.
echo Listo. Ahora recarga index.html en el navegador con F5.
pause
