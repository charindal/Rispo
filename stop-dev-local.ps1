# ========================
# Stop Local Development Environment
# Stops all Docker containers (DB, Redis, RabbitMQ)
# ========================

Write-Host '=====================================' -ForegroundColor Cyan
Write-Host '  Rispo - Stop Development Services' -ForegroundColor Cyan
Write-Host '=====================================' -ForegroundColor Cyan
Write-Host ''

# Check if Docker is running
Write-Host 'Checking Docker status...' -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host '✓ Docker is running' -ForegroundColor Green
} catch {
    Write-Host '✗ Docker is not running' -ForegroundColor Red
    exit 1
}

# Check if docker-compose.dev.yml exists
if (-not (Test-Path 'docker-compose.dev.yml')) {
    Write-Host '✗ docker-compose.dev.yml not found in current directory' -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host 'Stopping Docker containers...' -ForegroundColor Yellow

# Stop containers
docker-compose -f docker-compose.dev.yml down

if ($LASTEXITCODE -eq 0) {
    Write-Host '✓ Docker containers stopped successfully' -ForegroundColor Green
} else {
    Write-Host '✗ Failed to stop Docker containers' -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host '=====================================' -ForegroundColor Green
Write-Host '  ✓ All services stopped!' -ForegroundColor Green
Write-Host '=====================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Note: If you have Spring Boot or React still running,' -ForegroundColor Yellow
Write-Host 'please stop them manually (Ctrl+C in their terminals)' -ForegroundColor Yellow
Write-Host ''
