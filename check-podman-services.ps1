#!/usr/bin/env pwsh
# Check status of Rispo Podman services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Rispo Podman Services Status" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Podman machine status
Write-Host "Podman Machine Status:" -ForegroundColor Yellow
podman machine list
Write-Host ""

# Check running containers
Write-Host "Running Containers:" -ForegroundColor Yellow
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""

# Check all containers (including stopped)
Write-Host "All Containers:" -ForegroundColor Yellow
podman ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
Write-Host ""

# Check images
Write-Host "Rispo Images:" -ForegroundColor Yellow
podman images | Select-String -Pattern "rispo|mysql|REPOSITORY"
Write-Host ""

# Check volumes
Write-Host "Volumes:" -ForegroundColor Yellow
podman volume ls
Write-Host ""

# Check resource usage
Write-Host "Resource Usage:" -ForegroundColor Yellow
podman stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
Write-Host ""

# Test backend connectivity
Write-Host "Testing Backend Connectivity:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "  ✓ Backend: " -NoNewline -ForegroundColor Green
    Write-Host "HEALTHY" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Backend: " -NoNewline -ForegroundColor Red
    Write-Host "NOT RESPONDING" -ForegroundColor Red
}

# Test frontend connectivity
Write-Host "Testing Frontend Connectivity:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "  ✓ Frontend: " -NoNewline -ForegroundColor Green
    Write-Host "HEALTHY" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Frontend: " -NoNewline -ForegroundColor Red
    Write-Host "NOT RESPONDING" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
