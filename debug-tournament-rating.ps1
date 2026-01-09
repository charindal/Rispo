#!/usr/bin/env pwsh
# Debug Tournament Rating Issue

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Tournament Rating Issue Debugger" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$podmanPath = "C:\Program Files\RedHat\Podman\podman.exe"

Write-Host "1. Checking Running Containers..." -ForegroundColor Yellow
& $podmanPath ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""

Write-Host "2. Checking RabbitMQ Container..." -ForegroundColor Yellow
$rabbitmqStatus = & $podmanPath ps --filter "name=rispo-rabbitmq" --format "{{.Status}}"
if ($rabbitmqStatus) {
    Write-Host "✓ RabbitMQ is running: $rabbitmqStatus" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "3. Checking RabbitMQ Logs (last 50 lines)..." -ForegroundColor Yellow
    & $podmanPath logs --tail 50 rispo-rabbitmq
} else {
    Write-Host "✗ RabbitMQ container is NOT running!" -ForegroundColor Red
    Write-Host "This is the problem - rating calculations need RabbitMQ" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Checking Application Logs for Rating Issues..." -ForegroundColor Yellow
& $podmanPath logs --tail 100 rispo-app | Select-String -Pattern "rating|RabbitMQ|AMQP" -Context 1,1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Diagnosis Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $rabbitmqStatus) {
    Write-Host "ISSUE FOUND: RabbitMQ is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solution:" -ForegroundColor Yellow
    Write-Host "  1. Start all services with: " -NoNewline -ForegroundColor White
    Write-Host "podman compose -f docker-compose.yml up -d" -ForegroundColor Cyan
    Write-Host "  2. Or restart specifically: " -NoNewline -ForegroundColor White  
    Write-Host "podman compose -f docker-compose.yml restart rabbitmq" -ForegroundColor Cyan
} else {
    Write-Host "✓ All required services appear to be running" -ForegroundColor Green
    Write-Host ""
    Write-Host "To test rating manually, check the backend logs while submitting a match:" -ForegroundColor Yellow
    Write-Host "  podman logs -f rispo-app" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Additional Checks" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Check RabbitMQ Management UI:" -ForegroundColor Yellow
Write-Host "  http://localhost:15672" -ForegroundColor Cyan
Write-Host "  Username: rispo_admin" -ForegroundColor Gray
Write-Host "  Password: R!#po123##" -ForegroundColor Gray
Write-Host ""

Write-Host "Check application health:" -ForegroundColor Yellow
Write-Host "  http://localhost:8080/actuator/health" -ForegroundColor Cyan
Write-Host ""
