# Mobile App Network Diagnostic Script
param(
    [string]$VpsIp = "135.125.133.211",
    [int]$Port = 8080
)

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Rispo Mobile Network Diagnostics" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check VPS connectivity
Write-Host "[1/5] Testing VPS connectivity from PC..." -ForegroundColor Yellow
$vpsTest = Test-NetConnection -ComputerName $VpsIp -Port $Port -WarningAction SilentlyContinue

if ($vpsTest.TcpTestSucceeded) {
    Write-Host "  PC can reach VPS at ${VpsIp}:${Port}" -ForegroundColor Green
} else {
    Write-Host "  PC cannot reach VPS at ${VpsIp}:${Port}" -ForegroundColor Red
}
Write-Host ""

# Test 2: Check backend health
Write-Host "[2/5] Testing backend health endpoint..." -ForegroundColor Yellow
try {
    $healthUrl = "http://${VpsIp}:${Port}/actuator/health"
    $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 5 -UseBasicParsing
    Write-Host "  Backend is responding (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "  Backend health check failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Get local IP
Write-Host "[3/5] Finding your PC local IP..." -ForegroundColor Yellow
$localIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.PrefixOrigin -eq "Dhcp" -and $_.IPAddress -notlike "169.254.*"
}).IPAddress | Select-Object -First 1

if ($localIp) {
    Write-Host "  Your PC IP: $localIp" -ForegroundColor Cyan
    Write-Host "  For same WiFi use: http://${localIp}:8080/api" -ForegroundColor Gray
} else {
    Write-Host "  Could not determine local IP" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Check local backend
Write-Host "[4/5] Checking if backend runs locally..." -ForegroundColor Yellow
$localTest = Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue

if ($localTest.TcpTestSucceeded) {
    Write-Host "  Backend is running on this PC" -ForegroundColor Green
} else {
    Write-Host "  Backend is not running locally" -ForegroundColor Gray
}
Write-Host ""

# Test 5: Check .env config
Write-Host "[5/5] Checking mobile app configuration..." -ForegroundColor Yellow
$envFile = "rispo-app\.env.production"

if (Test-Path $envFile) {
    $content = Get-Content $envFile | Out-String
    Write-Host "  Current config:" -ForegroundColor Cyan
    Write-Host $content -ForegroundColor Gray
} else {
    Write-Host "  .env.production file not found!" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  Recommendations" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

if ($vpsTest.TcpTestSucceeded) {
    Write-Host "VPS is reachable from PC" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next: Test from phone browser:" -ForegroundColor Yellow
    Write-Host "  http://${VpsIp}:${Port}/actuator/health" -ForegroundColor White
    Write-Host ""
    Write-Host "If phone can access VPS:" -ForegroundColor Yellow
    Write-Host "  1. Rebuild APK: .\build-apk.ps1" -ForegroundColor White
    Write-Host "  2. Install on phone" -ForegroundColor White
} else {
    Write-Host "VPS is NOT reachable from PC" -ForegroundColor Red
    Write-Host ""
    Write-Host "Option 1: Use local backend" -ForegroundColor Cyan
    Write-Host "  1. Connect phone and PC to same WiFi" -ForegroundColor White
    Write-Host "  2. Start backend: docker-compose up" -ForegroundColor White
    if ($localIp) {
        Write-Host "  3. Update .env.production to: http://${localIp}:8080/api" -ForegroundColor White
    }
    Write-Host "  4. Rebuild: .\build-apk.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Fix VPS access" -ForegroundColor Cyan
    Write-Host "  1. Check VPS firewall" -ForegroundColor White
    Write-Host "  2. Ensure backend is running" -ForegroundColor White
}
Write-Host ""
Write-Host "See MOBILE_NETWORK_TROUBLESHOOTING.md for details" -ForegroundColor Gray
Write-Host ""
