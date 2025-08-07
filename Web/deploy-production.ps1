# HiLCoE Production Deployment Script for Windows/IIS
# This script handles proper deployment with cache busting

param(
    [string]$DeployPath = "C:\inetpub\wwwroot",
    [string]$BackupPath = "C:\inetpub\backup"
)

Write-Host "🚀 Starting HiLCoE Production Deployment..." -ForegroundColor Green

# Set variables
$ProjectName = "hilco-web"
$BuildDir = "dist\$ProjectName"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

# Function to write colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Step 1: Clean previous builds
Write-Status "Cleaning previous builds..."
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
}
if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force
}

# Step 2: Install dependencies
Write-Status "Installing dependencies..."
npm install

# Step 3: Build for production
Write-Status "Building for production..."
ng build --configuration=production

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed! Exiting..."
    exit 1
}

Write-Status "Build completed successfully!"

# Step 4: Create backup of current deployment
Write-Status "Creating backup of current deployment..."
if (Test-Path $DeployPath) {
    if (-not (Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath -Force
    }
    $BackupDir = "$BackupPath\backup-$Timestamp"
    Copy-Item -Path $DeployPath -Destination $BackupDir -Recurse
    Write-Status "Backup created at: $BackupDir"
}

# Step 5: Deploy to production
Write-Status "Deploying to production..."
if (Test-Path $BuildDir) {
    # Stop IIS application pool temporarily (optional)
    # Import-Module WebAdministration
    # Stop-WebAppPool -Name "YourAppPoolName"
    
    # Copy new files to deployment directory
    if (Test-Path $DeployPath) {
        Remove-Item -Path "$DeployPath\*" -Recurse -Force
    }
    Copy-Item -Path "$BuildDir\*" -Destination $DeployPath -Recurse -Force
    
    # Set proper permissions (if running as administrator)
    try {
        $acl = Get-Acl $DeployPath
        $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
        $acl.SetAccessRule($accessRule)
        Set-Acl -Path $DeployPath -AclObject $acl
    }
    catch {
        Write-Warning "Could not set permissions. Run as administrator if needed."
    }
    
    Write-Status "Deployment completed!"
} else {
    Write-Error "Build directory not found!"
    exit 1
}

# Step 6: Verify deployment
Write-Status "Verifying deployment..."
if (Test-Path "$DeployPath\index.html") {
    Write-Status "✅ Deployment successful!"
    Write-Status "🌐 Application is now live at your domain"
} else {
    Write-Error "❌ Deployment verification failed!"
    exit 1
}

# Step 7: Clear IIS cache
Write-Status "Clearing IIS cache..."
try {
    # Restart IIS application pool
    Import-Module WebAdministration
    Restart-WebAppPool -Name "DefaultAppPool"
    Write-Status "IIS application pool restarted"
} catch {
    Write-Warning "Could not restart IIS. Manual restart may be required."
}

# Step 8: Clear browser cache instructions
Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "📝 Remember to clear browser cache or test in incognito mode" -ForegroundColor Yellow

Write-Host ""
Write-Host "🔍 Post-deployment checklist:" -ForegroundColor Cyan
Write-Host "  1. Clear browser cache (Ctrl+Shift+R)" -ForegroundColor White
Write-Host "  2. Test in incognito/private mode" -ForegroundColor White
Write-Host "  3. Verify login functionality" -ForegroundColor White
Write-Host "  4. Check console for any errors" -ForegroundColor White
Write-Host "  5. Test all major features" -ForegroundColor White
Write-Host ""
Write-Host "📞 If issues persist, check:" -ForegroundColor Cyan
Write-Host "  - Browser console (F12)" -ForegroundColor White
Write-Host "  - IIS logs (C:\inetpub\logs\LogFiles)" -ForegroundColor White
Write-Host "  - Application Event Logs" -ForegroundColor White
Write-Host "  - Network connectivity" -ForegroundColor White
Write-Host "  - SSL certificate validity" -ForegroundColor White

# Optional: Send notification
# $webhookUrl = "YOUR_SLACK_WEBHOOK_URL"
# $body = @{text="HiLCoE deployment completed successfully!"} | ConvertTo-Json
# Invoke-RestMethod -Uri $webhookUrl -Method Post -Body $body -ContentType "application/json" 