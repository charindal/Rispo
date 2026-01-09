#!/usr/bin/env pwsh
# Rispo - Development Environment using Podman
# Runs backend in Podman, frontend locally with npm

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Rispo - Podman Dev Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Podman is installed
try {
    $podmanVersion = podman --version
    Write-Host "✓ Podman detected: $podmanVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Podman is not installed!" -ForegroundColor Red
    Write-Host "Please see PODMAN_INSTALLATION.md for installation instructions" -ForegroundColor Yellow
    exit 1
}

# Check if Podman machine is running
$machineStatus = podman machine list --format json | ConvertFrom-Json
if ($machineStatus.Running -ne $true) {
    Write-Host "⚠ Podman machine is not running. Starting..." -ForegroundColor Yellow
    podman machine start
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "Stopping any existing containers..." -ForegroundColor Yellow
podman-compose -f docker-compose.dev.yml down 2>$null

Write-Host ""
Write-Host "Starting backend services with Podman..." -ForegroundColor Cyan
podman-compose -f docker-compose.dev.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start backend services!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Waiting for backend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Dev Environment Started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend services running in Podman:" -ForegroundColor Cyan
Write-Host "  Backend API: http://localhost:8080" -ForegroundColor White
Write-Host "  Database:    localhost:3306" -ForegroundColor White
Write-Host ""
Write-Host "To start the frontend:" -ForegroundColor Yellow
Write-Host "  cd rispo-app" -ForegroundColor Gray
Write-Host "  npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View backend logs: podman-compose -f docker-compose.dev.yml logs -f backend" -ForegroundColor Gray
Write-Host "  View DB logs:      podman-compose -f docker-compose.dev.yml logs -f db" -ForegroundColor Gray
Write-Host "  Stop services:     podman-compose -f docker-compose.dev.yml down" -ForegroundColor Gray
Write-Host "  View containers:   podman ps" -ForegroundColor Gray
Write-Host ""
