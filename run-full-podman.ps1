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
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Rebuilding Frontend and Backend" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

# Clean up old build artifacts
Write-Host ""
Write-Host "Cleaning up old build artifacts..." -ForegroundColor Yellow
if (Test-Path "target") {
    Remove-Item -Recurse -Force "target"
    Write-Host "Removed Spring Boot target directory" -ForegroundColor Gray
}
if (Test-Path "rispo-app/build") {
    Remove-Item -Recurse -Force "rispo-app/build"
    Write-Host "Removed React build directory" -ForegroundColor Gray
}

# Build Spring Boot Backend
Write-Host ""
Write-Host "Building Spring Boot backend..." -ForegroundColor Cyan
try {
    ./mvnw.cmd clean package -DskipTests
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Backend build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Backend build successful!" -ForegroundColor Green
} catch {
    Write-Host "Backend build error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Build React Frontend
Write-Host ""
Write-Host "Building React frontend for local containers..." -ForegroundColor Cyan
try {
    Set-Location "rispo-app"
    
    # Check if node_modules exists, install only if missing
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing npm dependencies (node_modules not found)..." -ForegroundColor Yellow
        npm ci
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Frontend npm install failed!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Using existing node_modules..." -ForegroundColor Gray
    }
    
    # Set environment for local container deployment
    $env:REACT_APP_API_URL = "http://localhost:8080/api"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Frontend build failed!" -ForegroundColor Red
        exit 1
    }
    
    Set-Location ".."
    Write-Host "Frontend build successful with localhost API!" -ForegroundColor Green
} catch {
    Write-Host "Frontend build error: $($_.Exception.Message)" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Rebuilds Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Write-Host ""
Write-Host "Building Docker/Podman containers..." -ForegroundColor Cyan
$env:BUILDAH_FORMAT = "docker"
& $podmanPath compose -f docker-compose.yml build --no-cache

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
Write-Host "  Full Rebuild & Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Backend rebuilt successfully" -ForegroundColor Green
Write-Host "✅ Frontend rebuilt successfully" -ForegroundColor Green
Write-Host "✅ Containers built and deployed" -ForegroundColor Green
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
