# Rebuild APK with proper production environment settings
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Rebuilding APK with Production Settings" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Navigate to app directory
Set-Location rispo-app

# Clear any existing build cache
Write-Host "Clearing build cache..." -ForegroundColor Yellow
Remove-Item -Recurse -Force build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Set environment explicitly
Write-Host "Setting production environment..." -ForegroundColor Yellow
$env:NODE_ENV = "production"
$env:REACT_APP_API_URL = "http://135.125.133.211/api"

# Show current environment
Write-Host "Environment settings:" -ForegroundColor Green
Write-Host "  NODE_ENV: $env:NODE_ENV" -ForegroundColor White
Write-Host "  REACT_APP_API_URL: $env:REACT_APP_API_URL" -ForegroundColor White

# Build React app
Write-Host "`nBuilding React app with production settings..." -ForegroundColor Green
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Verify the build contains the correct API URL
Write-Host "`nVerifying API URL in build..." -ForegroundColor Yellow
$buildFiles = Get-ChildItem -Recurse build\static\js\*.js
foreach ($file in $buildFiles) {
    if (Select-String -Path $file.FullName -Pattern "135.125.133.211" -Quiet) {
        Write-Host "✅ Found VPS URL in $($file.Name)" -ForegroundColor Green
    }
    if (Select-String -Path $file.FullName -Pattern "localhost:8080" -Quiet) {
        Write-Host "❌ WARNING: Found localhost URL in $($file.Name)" -ForegroundColor Red
    }
}

# Sync with Capacitor
Write-Host "`nSyncing with Capacitor..." -ForegroundColor Green
npx cap sync android

# Build APK
Write-Host "`nBuilding APK..." -ForegroundColor Green
Set-Location android
./gradlew clean assembleDebug

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: APK build failed!" -ForegroundColor Red
    Set-Location ..\..
    exit 1
}

Set-Location ..\..

# Copy APK
Write-Host "`nCopying APK..." -ForegroundColor Green
$sourcePath = "rispo-app\android\app\build\outputs\apk\debug\app-debug.apk"
$destPath = "rispo-app\android\app\build\outputs\apk\debug\Rispo-VPS.apk"
if (Test-Path $sourcePath) {
    Copy-Item -Path $sourcePath -Destination $destPath -Force
    Write-Host "✅ APK created: $destPath" -ForegroundColor Green
} else {
    Write-Host "❌ APK not found at: $sourcePath" -ForegroundColor Red
}

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "  APK Build Complete!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "APK Location: rispo-app\android\app\build\outputs\apk\debug\Rispo-VPS.apk" -ForegroundColor Yellow
Write-Host ""
Write-Host "This APK is configured to connect to: http://135.125.133.211/api" -ForegroundColor Green