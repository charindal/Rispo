#!/usr/bin/env pwsh
# Rispo - Full Deployment Script using Podman

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Rispo - Podman Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$podmanPath = "C:\Program Files\RedHat\Podman\podman.exe"

if (-not (Test-Path $podmanPath)) {
    Write-Host "Podman is not installed!" -ForegroundColor Red
    Write-Host "Please install with: winget install RedHat.Podman-Desktop" -ForegroundColor Yellow
    exit 1
}

try {
    $podmanVersion = & $podmanPath --version
    Write-Host "Podman detected: $podmanVersion" -ForegroundColor Green
} catch {
    Write-Host "Podman error!" -ForegroundColor Red
    exit 1
}

try {
    $machineStatus = & $podmanPath machine list --format json | ConvertFrom-Json
    if ($machineStatus.Running -ne $true) {
        Write-Host "Podman machine is not running. Starting..." -ForegroundColor Yellow
        & $podmanPath machine start
        Start-Sleep -Seconds 5
    }
} catch {
    Write-Host "Podman machine not initialized. Initializing..." -ForegroundColor Yellow
    & $podmanPath machine init --cpus 4 --memory 4096 --disk-size 50
    & $podmanPath machine start
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "Stopping any existing containers..." -ForegroundColor Yellow
& $podmanPath compose -f docker-compose.yml down 2>$null

Write-Host ""
Write-Host "Building application..." -ForegroundColor Cyan
$env:BUILDAH_FORMAT = "docker"
& $podmanPath compose -f docker-compose.yml build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting containers..." -ForegroundColor Cyan
& $podmanPath compose -f docker-compose.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to start containers!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Application Started Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:   http://localhost:8080" -ForegroundColor Cyan
Write-Host ""

$viewLogs = Read-Host "View live logs? (y/n)"
if ($viewLogs -eq "y" -or $viewLogs -eq "Y") {
    Write-Host ""
    Write-Host "Showing logs (Press Ctrl+C to exit)..." -ForegroundColor Cyan
    & $podmanPath compose -f docker-compose.yml logs -f
}
