# Docker Build and Deploy Script for Rispo Application (Windows)
# This script ensures the application can be built on any Windows machine with only Docker installed

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Rispo Docker Build & Deploy Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker daemon is running
try {
    docker info | Out-Null
    Write-Host "✓ Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker daemon is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Clean up old containers and images (optional)
$cleanup = Read-Host "Do you want to clean up old containers and images? (y/N)"
if ($cleanup -eq "y" -or $cleanup -eq "Y") {
    Write-Host "→ Stopping and removing old containers..." -ForegroundColor Yellow
    docker-compose down -v 2>$null
    
    Write-Host "→ Removing old images..." -ForegroundColor Yellow
    docker rmi rispo-app 2>$null
    
    Write-Host "✓ Cleanup complete" -ForegroundColor Green
}

# Build the application
Write-Host "→ Building Docker images (this may take several minutes)..." -ForegroundColor Yellow
docker-compose build --no-cache app

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker image built successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Docker build failed" -ForegroundColor Red
    exit 1
}

# Start the services
Write-Host "→ Starting services..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Services started successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to start services" -ForegroundColor Red
    exit 1
}

# Wait for application to be ready
Write-Host "→ Waiting for application to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if application is running
$appRunning = docker ps | Select-String "rispo-app"
if ($appRunning) {
    Write-Host "✓ Application is running" -ForegroundColor Green
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "  Application URLs:" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "  Frontend:     http://localhost:3000"
    Write-Host "  Backend API:  http://localhost:8080"
    Write-Host "  Grafana:      http://localhost:3000 (admin/admin)"
    Write-Host "  Prometheus:   http://localhost:9090"
    Write-Host "  RabbitMQ:     http://localhost:15672 (rispo_admin/R!#po123##)"
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "→ To view logs: docker-compose logs -f app" -ForegroundColor Yellow
    Write-Host "→ To stop: docker-compose down" -ForegroundColor Yellow
} else {
    Write-Host "✗ Application failed to start" -ForegroundColor Red
    Write-Host "→ Check logs with: docker-compose logs app" -ForegroundColor Yellow
    exit 1
}
