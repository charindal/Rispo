#!/usr/bin/env pwsh
# Stop all Rispo Podman containers and clean up

$podmanPath = "C:\Program Files\RedHat\Podman\podman.exe"

Write-Host "Stopping Rispo Podman containers..." -ForegroundColor Yellow

# Stop development environment
Write-Host "Stopping dev environment..." -ForegroundColor Gray
& $podmanPath compose -f docker-compose.dev.yml down 2>$null

# Stop production environment
Write-Host "Stopping production environment..." -ForegroundColor Gray
& $podmanPath compose -f docker-compose.yml down 2>$null

# Optional: Remove volumes
$removeVolumes = Read-Host "Remove volumes (database data will be deleted)? (y/N)"
if ($removeVolumes -eq "y" -or $removeVolumes -eq "Y") {
    Write-Host "Removing volumes..." -ForegroundColor Red
    & $podmanPath volume prune -f
} else {
    Write-Host "Volumes kept (database data preserved)" -ForegroundColor Green
}

# Optional: Remove images
$removeImages = Read-Host "Remove Rispo images? (y/N)"
if ($removeImages -eq "y" -or $removeImages -eq "Y") {
    Write-Host "Removing images..." -ForegroundColor Yellow
    & $podmanPath rmi rispo-backend rispo-frontend 2>$null
} else {
    Write-Host "Images kept" -ForegroundColor Green
}

Write-Host ""
Write-Host "Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Check remaining containers: podman ps -a" -ForegroundColor Gray
Write-Host "Check remaining images:     podman images" -ForegroundColor Gray
Write-Host "Check remaining volumes:    podman volume ls" -ForegroundColor Gray