# ========================
# Local Development Setup Script
# Only runs DB, Redis, RabbitMQ in Docker (3 containers)
# Spring Boot app and React dev server run natively
# ========================

Write-Host '=====================================' -ForegroundColor Cyan
Write-Host '  Rispo - Local Development Setup' -ForegroundColor Cyan
Write-Host '  Docker: DB + Redis + RabbitMQ' -ForegroundColor Cyan
Write-Host '  Native: Spring Boot + React' -ForegroundColor Cyan
Write-Host '=====================================' -ForegroundColor Cyan
Write-Host ''

# Check if Docker is running
Write-Host 'Checking Docker status...' -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host '✓ Docker is running' -ForegroundColor Green
} catch {
    Write-Host '✗ Docker is not running. Please start Docker Desktop.' -ForegroundColor Red
    exit 1
}

# Check if docker-compose.dev.yml exists
if (-not (Test-Path 'docker-compose.dev.yml')) {
    Write-Host ' docker-compose.dev.yml not found in current directory' -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host 'Starting Docker containers (DB, Redis, RabbitMQ)...' -ForegroundColor Yellow

# Start only essential services
docker-compose -f docker-compose.dev.yml up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host ' Failed to start Docker containers' -ForegroundColor Red
    exit 1
}

Write-Host ' Docker containers started' -ForegroundColor Green
Write-Host ''

# Wait for services to be ready
Write-Host 'Waiting for services to be ready...' -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check container status
Write-Host 'Container status:' -ForegroundColor Cyan
docker-compose -f docker-compose.dev.yml ps
Write-Host ''

Write-Host '=====================================' -ForegroundColor Green
Write-Host '   Docker services ready!' -ForegroundColor Green
Write-Host '=====================================' -ForegroundColor Green
Write-Host ''
Write-Host 'Services running in Docker:' -ForegroundColor Cyan
Write-Host '   PostgreSQL:       localhost:5433' -ForegroundColor White
Write-Host '   Redis:            localhost:6379' -ForegroundColor White
Write-Host '   RabbitMQ:         localhost:5672' -ForegroundColor White
Write-Host '   RabbitMQ UI:      http://localhost:15672 (rispo_admin / R!#po123##)' -ForegroundColor White
Write-Host ''

# Ask user what to start
Write-Host 'What would you like to start?' -ForegroundColor Yellow
Write-Host '  [1] Spring Boot backend only' -ForegroundColor White
Write-Host '  [2] React frontend only' -ForegroundColor White
Write-Host '  [3] Both backend and frontend' -ForegroundColor White
Write-Host '  [4] Nothing (containers only)' -ForegroundColor White
Write-Host ''
$choice = Read-Host 'Enter choice (1-4)'

switch ($choice) {
    '1' {
        Write-Host ''
        Write-Host 'Starting Spring Boot backend...' -ForegroundColor Yellow
        Write-Host 'Access at: http://localhost:8080' -ForegroundColor Cyan
        Write-Host ''
        .\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=dev'
    }
    '2' {
        Write-Host ''
        Write-Host 'Starting React frontend...' -ForegroundColor Yellow
        Write-Host 'Access at: http://localhost:3000' -ForegroundColor Cyan
        Write-Host ''
        Set-Location rispo-app
        npm start
    }
    '3' {
        Write-Host ''
        Write-Host 'Starting both backend and frontend...' -ForegroundColor Yellow
        Write-Host ''
        Write-Host 'Backend will start in this window...' -ForegroundColor Cyan
        Write-Host 'Frontend will open in a new window...' -ForegroundColor Cyan
        Write-Host ''
        
        # Start frontend in new terminal
        Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$PWD\rispo-app'; npm start"
        
        # Start backend in current terminal
        Write-Host 'Starting Spring Boot backend...' -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        .\mvnw.cmd spring-boot:run '-Dspring-boot.run.profiles=dev'
    }
    '4' {
        Write-Host ''
        Write-Host 'Docker containers are running.' -ForegroundColor Green
        Write-Host ''
        Write-Host 'To start backend:  .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev' -ForegroundColor Gray
        Write-Host 'To start frontend: cd rispo-app; npm start' -ForegroundColor Gray
        Write-Host ''
        Write-Host 'To stop Docker:    docker-compose -f docker-compose.dev.yml down' -ForegroundColor Gray
        Write-Host ''
    }
    default {
        Write-Host 'Invalid choice. Containers are running.' -ForegroundColor Yellow
        Write-Host ''
        Write-Host 'To start backend:  .\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev' -ForegroundColor Gray
        Write-Host 'To start frontend: cd rispo-app; npm start' -ForegroundColor Gray
        Write-Host ''
    }
}
