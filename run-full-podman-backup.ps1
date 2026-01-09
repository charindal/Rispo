#!/usr/bin/env pwsh
# Rispo - Full Deployment Script using Podman
# This script builds and runs the complete application using Podman

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Rispo - Podman Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set up paths
$podmanPath = "C:\Program Files\RedHat\Podman\podman.exe"

# Check if Podman is installed
if (-not (Test-Path $podmanPath)) {
    Write-Host "âœ— Podman is not installed!" -ForegroundColor Red
    Write-Host "Please install with: winget install RedHat.Podman-Desktop" -ForegroundColor Yellow
    Write-Host "Or see PODMAN_INSTALLATION.md for detailed instructions" -ForegroundColor Yellow
    exit 1
}

try {
    $podmanVersion = & $podmanPath --version
    Write-Host "âœ“ Podman detected: $podmanVersion" -ForegroundColor Green
} catch {
    Write-Host "âœ— Podman error!" -ForegroundColor Red
    exit 1
}

# Check if Podman machine is running
try {
    $machineStatus = & $podmanPath machine list --format json | ConvertFrom-Json
    if ($machineStatus.Running -ne $true) {
        Write-Host "âš  Podman machine is not running. Starting..." -ForegroundColor Yellow
        & $podmanPath machine start
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Host "âš  Podman machine not initialized. Initializing..." -ForegroundColor Yellow
    & $podmanPath machine init --cpus 4 --memory 4096 --disk-size 50
    & $podmanPath machine start
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "Stopping any existing containers..." -ForegroundColor Yellow
& $podmanPath compose -f docker-compose.yml down 2>$null

Write-Host ""
Write-Host "Building application..." -ForegroundColor Cyan
& $podmanPath compose -f docker-compose.yml build

if ($LASTEXITCODE -ne 0) {
    Write-Host "âœ— Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting containers..." -ForegroundColor Cyan
& $podmanPath compose -f docker-compose.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "âœ— Failed to start containers!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Application Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:   http://localhost:8080" -ForegroundColor White
Write-Host "  Database:  localhost:3306" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  View logs:         podman compose -f docker-compose.yml logs -f" -ForegroundColor Gray
Write-Host "  Stop application:  podman compose -f docker-compose.yml down" -ForegroundColor Gray
Write-Host "  Restart:           podman compose -f docker-compose.yml restart" -ForegroundColor Gray
Write-Host "  View containers:   podman ps" -ForegroundColor Gray
Write-Host ""

# Ask if user wants to view logs
$viewLogs = Read-Host "View live logs? (y/n)"
if ($viewLogs -eq "y" -or $viewLogs -eq "Y") {
    Write-Host ""
    Write-Host "Showing logs (Press Ctrl+C to exit)..." -ForegroundColor Cyan
    & $podmanPath compose -f docker-compose.yml logs -f
}

