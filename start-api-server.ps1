Write-Host "Starting SecureAuth API Server..." -ForegroundColor Green
Write-Host ""
Write-Host "Server will be available at:" -ForegroundColor Yellow
Write-Host "- HTTPS: https://localhost:7123" -ForegroundColor Cyan
Write-Host "- HTTP:  http://localhost:5074" -ForegroundColor Cyan
Write-Host "- Swagger: https://localhost:7123/swagger" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

Set-Location "D:\Personal\Registrar-system\SecureAuth.API"
dotnet run --launch-profile https

Read-Host "Press Enter to exit"
