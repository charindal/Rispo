# Installing Podman Desktop on Windows

## Why Podman Desktop?
- Uses 50-70% less memory than Docker Desktop
- No background daemon consuming resources
- Compatible with your existing docker-compose files
- Free and open source (no licensing concerns)

## Installation Steps

### Step 1: Install Podman Desktop

1. **Download Podman Desktop:**
   - Visit: https://podman-desktop.io/downloads
   - Download the Windows installer (.exe)

2. **Run the installer:**
   - Double-click the downloaded .exe file
   - Follow the installation wizard
   - It will automatically install:
     - Podman Desktop (GUI)
     - Podman CLI
     - Podman Machine (Windows VM)

3. **Initialize Podman Machine:**
   ```powershell
   # After installation, initialize the Podman machine
   podman machine init
   podman machine start
   ```

### Step 2: Install Podman Compose

```powershell
# Install podman-compose (Python-based)
pip install podman-compose

# OR use docker-compose (works with Podman too)
# Download from: https://github.com/docker/compose/releases
```

### Step 3: Verify Installation

```powershell
# Check Podman version
podman --version

# Check if machine is running
podman machine list

# Test with a simple container
podman run hello-world
```

## Using Podman with Your Rispo Project

### Option 1: Use podman-compose (Direct replacement)

```powershell
# Navigate to your project
cd C:\DevCode\Rispo

# Use podman-compose instead of docker-compose
podman-compose -f docker-compose.yml up -d

# Or for development
podman-compose -f docker-compose.dev.yml up -d
```

### Option 2: Create Podman-specific scripts

Create these scripts in your project root:

#### run-full-podman.ps1
```powershell
Write-Host "Starting Rispo with Podman..." -ForegroundColor Green

# Stop any existing containers
podman-compose -f docker-compose.yml down

# Build and start
podman-compose -f docker-compose.yml up --build -d

Write-Host "Application started!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8080" -ForegroundColor Cyan

# Show logs
podman-compose -f docker-compose.yml logs -f
```

### Option 3: Alias docker to podman

```powershell
# Add to your PowerShell profile
# Open profile: notepad $PROFILE

# Add these lines:
function docker { podman @args }
function docker-compose { podman-compose @args }
```

## Key Differences & Commands

| Docker Command | Podman Equivalent |
|----------------|-------------------|
| `docker ps` | `podman ps` |
| `docker-compose up` | `podman-compose up` |
| `docker build` | `podman build` |
| `docker run` | `podman run` |
| `docker images` | `podman images` |
| `docker stop` | `podman stop` |

## Resource Configuration

### Configure Podman Machine Resources:

```powershell
# Stop the machine first
podman machine stop

# Recreate with custom resources
podman machine rm
podman machine init --cpus 4 --memory 4096 --disk-size 50

# Start the machine
podman machine start
```

## Troubleshooting

### Issue: Permission errors
```powershell
# Run PowerShell as Administrator
podman machine set --rootful
```

### Issue: Ports already in use
```powershell
# Check what's using the port
netstat -ano | findstr :8080

# Stop Docker Desktop if still running
Stop-Service -Name "com.docker.service" -Force
```

### Issue: Slow performance
```powershell
# Increase Podman machine resources
podman machine stop
podman machine set --cpus 6 --memory 8192
podman machine start
```

## Migration Checklist

- [ ] Install Podman Desktop
- [ ] Initialize Podman machine
- [ ] Install podman-compose
- [ ] Stop Docker Desktop
- [ ] Test with: `podman run hello-world`
- [ ] Build your project: `podman-compose build`
- [ ] Run your project: `podman-compose up -d`
- [ ] Verify frontend (http://localhost:3000)
- [ ] Verify backend (http://localhost:8080)
- [ ] Optional: Uninstall Docker Desktop

## Alternative: Rancher Desktop

If Podman doesn't work for you, try Rancher Desktop:

1. Download from: https://rancherdesktop.io/
2. Install and choose "dockerd (moby)" as container runtime
3. Use regular docker/docker-compose commands
4. Configure resources in Settings > Virtual Machine

## Resource Comparison

Typical resource usage:

| Tool | Memory (Idle) | Memory (Running App) |
|------|---------------|---------------------|
| Docker Desktop | 2-3 GB | 4-6 GB |
| Podman Desktop | 500 MB - 1 GB | 2-3 GB |
| Rancher Desktop | 1-2 GB | 3-4 GB |

## Benefits Summary

### Podman Benefits:
✅ 50-70% less memory usage
✅ Faster startup times
✅ No daemon (daemonless architecture)
✅ Better security (rootless)
✅ Compatible with Docker images
✅ Free for commercial use

### Your Project Compatibility:
✅ Your docker-compose.yml will work as-is
✅ Your Dockerfile will work unchanged
✅ All Docker images from Docker Hub work
✅ Minimal changes to your scripts needed

## Next Steps

1. Install Podman Desktop
2. Create the Podman-specific scripts
3. Test with your dev environment first
4. Once stable, use for production builds
5. Monitor resource usage improvement

Would you like me to create the Podman-specific scripts for your Rispo project?
