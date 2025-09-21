@echo off
echo Starting SecureAuth API Server...
echo.
echo Server will be available at:
echo - HTTPS: https://localhost:7123
echo - HTTP:  http://localhost:5074
echo - Swagger: https://localhost:7123/swagger
echo.
echo Press Ctrl+C to stop the server
echo.

cd /d "D:\Personal\Registrar-system\SecureAuth.API"
dotnet run --launch-profile https

pause
