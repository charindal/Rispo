# ========================
# Check Rispo Services Status
# ========================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Rispo Services Status Check" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
    
    Write-Host "`nDocker Containers:" -ForegroundColor Cyan
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=rispo"
    
} catch {
    Write-Host "✗ Docker is not running" -ForegroundColor Red
}

Write-Host "`n"

# Check if Spring Boot is running (port 8080)
Write-Host "Checking Spring Boot Backend (port 8080)..." -ForegroundColor Yellow
$backend = netstat -ano | Select-String ":8080" | Select-Object -First 1
if ($backend) {
    Write-Host "✓ Backend is running on port 8080" -ForegroundColor Green
} else {
    Write-Host "✗ Backend is NOT running on port 8080" -ForegroundColor Red
    Write-Host "   Start with: .\run-dev-local.ps1" -ForegroundColor Yellow
}

Write-Host ""

# Check if React is running (port 3000)
Write-Host "Checking React Frontend (port 3000)..." -ForegroundColor Yellow
$frontend = netstat -ano | Select-String ":3000" | Select-Object -First 1
if ($frontend) {
    Write-Host "✓ Frontend is running on port 3000" -ForegroundColor Green
} else {
    Write-Host "✗ Frontend is NOT running on port 3000" -ForegroundColor Red
    Write-Host "   Start with: cd rispo-app; npm start" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Status Check Complete" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
