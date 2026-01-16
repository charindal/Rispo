$ErrorActionPreference = 'Stop'
$RootDir = 'C:\DevCode\Rispo'

Write-Host 'Rispo App Rebuild (Backend + Frontend)' -ForegroundColor Green
Write-Host ''

# Step 0: Stop existing container (if running)
Write-Host 'Step 0: Stopping existing container (if running)' -ForegroundColor Cyan
Push-Location $RootDir
try {
    podman-compose -f docker-compose.yml down 2>&1 | Out-Null
} catch {
    # Container might not exist, that's okay
}
Start-Sleep -Seconds 2
Pop-Location
Write-Host 'Container stopped' -ForegroundColor Green
Write-Host ''

# Step 1: Build React
Write-Host 'Step 1: Building React Frontend' -ForegroundColor Cyan
Push-Location "$RootDir\rispo-app"

# Clear npm cache and node_modules for clean build
Write-Host 'Clearing npm cache...' -ForegroundColor Yellow
npm cache clean --force

if (Test-Path "node_modules") {
    Write-Host 'Removing node_modules (this may take a moment)...' -ForegroundColor Yellow
    # Use cmd.exe for more robust directory removal on Windows
    cmd /c "rmdir /s /q node_modules 2>nul" | Out-Null
    Start-Sleep -Seconds 2
}

if (Test-Path "build") {
    Write-Host 'Removing old build directory...' -ForegroundColor Yellow
    Remove-Item -Path "build" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host 'Installing npm dependencies...' -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host 'npm install failed' -ForegroundColor Red
    exit 1
}

Write-Host 'Building React app...' -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host 'React build failed' -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host 'React build completed' -ForegroundColor Green
Write-Host ''

# Verify build output exists
if (-not (Test-Path "$RootDir\rispo-app\build\index.html")) {
    Write-Host 'ERROR: Build output not found at rispo-app/build' -ForegroundColor Red
    exit 1
}

# Step 2: Copy to Spring Boot
Write-Host 'Step 2: Copying to Spring Boot' -ForegroundColor Cyan
$StaticPath = "$RootDir\src\main\resources\static"
if (Test-Path $StaticPath) {
    Write-Host 'Removing old static files...' -ForegroundColor Yellow
    Remove-Item -Path "$StaticPath\*" -Recurse -Force -ErrorAction SilentlyContinue
} else {
    Write-Host 'Creating static directory...' -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $StaticPath -Force | Out-Null
}

Write-Host 'Copying build files to static directory...' -ForegroundColor Yellow
Copy-Item -Path "$RootDir\rispo-app\build\*" -Destination $StaticPath -Recurse -Force
Write-Host 'Frontend files copied' -ForegroundColor Green

# Verify files were copied
$FileCount = (Get-ChildItem -Path $StaticPath -Recurse).Count
Write-Host "Verified: $FileCount files copied to static directory" -ForegroundColor Green
Write-Host ''

# Step 3: Build Spring Boot
Write-Host 'Step 3: Building Spring Boot Backend' -ForegroundColor Cyan
Push-Location $RootDir
Write-Host 'Running Maven clean package...' -ForegroundColor Yellow
mvn clean package -DskipTests
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host 'Maven build failed' -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host 'Spring Boot JAR built' -ForegroundColor Green

# Verify JAR was built
if (-not (Test-Path "$RootDir\target\rispo-0.0.1-SNAPSHOT.jar")) {
    Write-Host 'WARNING: JAR file not found at expected location' -ForegroundColor Yellow
}
Write-Host ''

# Step 4: Rebuild container
Write-Host 'Step 4: Building and Starting App Container' -ForegroundColor Cyan
Push-Location $RootDir
Write-Host 'Building and starting new container...' -ForegroundColor Yellow
podman-compose -f docker-compose.yml up -d --build app
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    Write-Host 'Container build failed' -ForegroundColor Red
    exit 1
}
Pop-Location
Write-Host 'App container started' -ForegroundColor Green
Write-Host ''

# Wait and check
Write-Host 'Waiting for container to be ready...' -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host 'Container status:' -ForegroundColor Cyan
podman ps --filter 'name=rispo-app' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

Write-Host ''
Write-Host 'Rebuild Complete!' -ForegroundColor Green
Write-Host 'App available at: http://localhost:8080' -ForegroundColor Yellow
Write-Host 'View logs: podman logs -f rispo-app-1' -ForegroundColor Yellow
