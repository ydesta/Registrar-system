# PowerShell Deployment Script for SecureAuth API
# Fixes 504 Gateway Timeout Issues

param(
    [string]$Environment = "Production",
    [string]$ApiPath = "C:\inetpub\wwwroot\SecureAuth.API",
    [string]$BuildPath = ".\SecureAuth.API\publish"
)

Write-Host "🚀 Starting SecureAuth API Deployment..." -ForegroundColor Green
Write-Host "Environment: $Environment" -ForegroundColor Yellow
Write-Host "API Path: $ApiPath" -ForegroundColor Yellow

# Stop the application pool if it exists
try {
    Import-Module WebAdministration
    $appPoolName = "SecureAuthAPI"
    
    if (Get-IISAppPool -Name $appPoolName -ErrorAction SilentlyContinue) {
        Write-Host "🛑 Stopping application pool: $appPoolName" -ForegroundColor Yellow
        Stop-IISAppPool -Name $appPoolName
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Host "⚠️  Could not stop application pool: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Build the API
Write-Host "🔨 Building API..." -ForegroundColor Green
Set-Location ".\SecureAuth.API"

try {
    dotnet clean
    dotnet restore
    dotnet build -c Release
    dotnet publish -c Release -o ./publish --self-contained false
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code: $LASTEXITCODE"
    }
    
    Write-Host "✅ Build completed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create backup of existing deployment
if (Test-Path $ApiPath) {
    $backupPath = "$ApiPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Write-Host "📦 Creating backup: $backupPath" -ForegroundColor Yellow
    Copy-Item -Path $ApiPath -Destination $backupPath -Recurse
}

# Deploy the API
Write-Host "📤 Deploying API to: $ApiPath" -ForegroundColor Green

try {
    # Create directory if it doesn't exist
    if (!(Test-Path $ApiPath)) {
        New-Item -ItemType Directory -Path $ApiPath -Force
    }
    
    # Copy files
    Copy-Item -Path "$BuildPath\*" -Destination $ApiPath -Recurse -Force
    
    # Create web.config if it doesn't exist
    $webConfigPath = "$ApiPath\web.config"
    if (!(Test-Path $webConfigPath)) {
        $webConfig = @"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
    </handlers>
    <aspNetCore processPath="dotnet" arguments=".\SecureAuth.API.dll" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess">
      <environmentVariables>
        <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="$Environment" />
        <environmentVariable name="ASPNETCORE_URLS" value="http://localhost:7123" />
      </environmentVariables>
    </aspNetCore>
    <httpProtocol>
      <customHeaders>
        <add name="X-Frame-Options" value="DENY" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-XSS-Protection" value="1; mode=block" />
        <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
        <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
      </customHeaders>
    </httpProtocol>
    <httpErrors errorMode="Custom">
      <remove statusCode="504" />
      <error statusCode="504" path="/error/504.html" responseMode="ExecuteURL" />
    </httpErrors>
    <requestFiltering>
      <requestLimits maxAllowedContentLength="10485760" />
    </requestFiltering>
    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="10485760" />
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
"@
        Set-Content -Path $webConfigPath -Value $webConfig
        Write-Host "✅ Created web.config" -ForegroundColor Green
    }
    
    # Create logs directory
    $logsPath = "$ApiPath\logs"
    if (!(Test-Path $logsPath)) {
        New-Item -ItemType Directory -Path $logsPath -Force
    }
    
    Write-Host "✅ Deployment completed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Deployment failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Start the application pool
try {
    if (Get-IISAppPool -Name $appPoolName -ErrorAction SilentlyContinue) {
        Write-Host "▶️  Starting application pool: $appPoolName" -ForegroundColor Green
        Start-IISAppPool -Name $appPoolName
        Start-Sleep -Seconds 10
    } else {
        Write-Host "⚠️  Application pool '$appPoolName' not found. Please create it manually." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not start application pool: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test the API
Write-Host "🧪 Testing API health..." -ForegroundColor Green
Start-Sleep -Seconds 15

try {
    $healthUrl = "https://hilcoe.edu.et:7123/api/health"
    $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 30
    
    if ($response.status -eq "healthy") {
        Write-Host "✅ API health check passed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  API health check returned: $($response.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ API health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test database connectivity
Write-Host "🧪 Testing database connectivity..." -ForegroundColor Green

try {
    $dbUrl = "https://hilcoe.edu.et:7123/api/health/database"
    $dbResponse = Invoke-RestMethod -Uri $dbUrl -Method Get -TimeoutSec 30
    
    if ($dbResponse.status -eq "healthy") {
        Write-Host "✅ Database connectivity test passed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database connectivity test returned: $($dbResponse.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Database connectivity test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "🎉 Deployment completed!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Test login functionality" -ForegroundColor White
Write-Host "   2. Monitor application logs" -ForegroundColor White
Write-Host "   3. Check for 504 errors" -ForegroundColor White
Write-Host "   4. Verify CORS headers" -ForegroundColor White

# Return to original directory
Set-Location ".." 