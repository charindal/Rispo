# Rispo APK Build Script
# Run this after updating .env.production with your backend URL

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Rispo Mobile App - APK Build Script" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.production exists and show current API URL
$envFile = "rispo-app\.env.production"
if (Test-Path $envFile) {
    Write-Host "Current .env.production settings:" -ForegroundColor Yellow
    Get-Content $envFile | Write-Host
    Write-Host ""
    
    $apiUrl = (Get-Content $envFile | Select-String "REACT_APP_API_URL").Line
    if ($apiUrl -match "localhost") {
        Write-Host "WARNING: You're using localhost in .env.production!" -ForegroundColor Red
        Write-Host "This will NOT work on a mobile device." -ForegroundColor Red
        Write-Host "Please update with your server's IP address or domain." -ForegroundColor Red
        Write-Host ""
        $continue = Read-Host "Continue anyway? (y/n)"
        if ($continue -ne "y") {
            exit
        }
    }
} else {
    Write-Host "ERROR: .env.production file not found!" -ForegroundColor Red
    Write-Host "Please create rispo-app\.env.production with your backend URL" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Building React app..." -ForegroundColor Green
Set-Location rispo-app
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: React build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 2: Syncing with Capacitor..." -ForegroundColor Green
npx cap sync android

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Capacitor sync failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 3: Building Android APK..." -ForegroundColor Green
Set-Location android
./gradlew assembleDebug

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Android build failed!" -ForegroundColor Red
    exit 1
}

Set-Location ..\..

# Rename APK to Rispo
Write-Host "`nRenaming APK to Rispo.apk..." -ForegroundColor Green
$sourcePath = "rispo-app\android\app\build\outputs\apk\debug\app-debug.apk"
$destPath = "rispo-app\android\app\build\outputs\apk\debug\Rispo.apk"
if (Test-Path $sourcePath) {
    Copy-Item -Path $sourcePath -Destination $destPath -Force
    Write-Host "APK renamed successfully" -ForegroundColor Green
}

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "  Build Complete!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "APK Location:" -ForegroundColor Yellow
Write-Host "  rispo-app\android\app\build\outputs\apk\debug\Rispo.apk"
Write-Host ""
Write-Host "To install on device:" -ForegroundColor Yellow
Write-Host "  adb install -r rispo-app\android\app\build\outputs\apk\debug\Rispo.apk"
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "  adb logcat | Select-String 'AUTH SERVICE|Login'"
Write-Host ""
