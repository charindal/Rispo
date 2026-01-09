# ========================
# Full Docker Setup Script
# Runs ALL services in Docker (11 containers)
# Includes: App, DB, Redis, RabbitMQ, Observability Stack
# ========================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Rispo - Full Docker Setup" -ForegroundColor Cyan
Write-Host "  Running ALL 11 containers" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker status..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if docker-compose.yml exists
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "✗ docker-compose.yml not found in current directory" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Building and starting all containers..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Gray
Write-Host ""

# Build and start all services
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "  ✓ All containers started!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Services running:" -ForegroundColor Cyan
    Write-Host "  • Application:      http://localhost:8080" -ForegroundColor White
    Write-Host "  • PostgreSQL:       localhost:5433" -ForegroundColor White
    Write-Host "  • Redis:            localhost:6379" -ForegroundColor White
    Write-Host "  • RabbitMQ UI:      http://localhost:15672" -ForegroundColor White
    Write-Host "  • Grafana:          http://localhost:3000" -ForegroundColor White
    Write-Host "  • Prometheus:       http://localhost:9090" -ForegroundColor White
    Write-Host ""
    Write-Host "Checking container status..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    docker-compose ps
    Write-Host ""
    Write-Host "View logs: docker-compose logs -f [service-name]" -ForegroundColor Gray
    Write-Host "Stop all:  docker-compose down" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "✗ Failed to start containers. Check errors above." -ForegroundColor Red
    Write-Host "View logs: docker-compose logs" -ForegroundColor Gray
    exit 1
}
