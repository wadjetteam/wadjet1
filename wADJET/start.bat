@echo off
set PORT=8080
set DB_DATA_DIR=%~dp0data
node "%~dp0artifacts\api-server\dist\index.mjs"
pause
