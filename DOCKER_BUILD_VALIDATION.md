# Docker Build Validation Checklist

This checklist ensures your Rispo project can be built on any fresh machine with only Docker.

## ✅ Pre-Build Validation

### Required Files Present
- [x] `Dockerfile` - Multi-stage build configuration
- [x] `docker-compose.yml` - Service orchestration
- [x] `.dockerignore` - Excludes unnecessary files from build context
- [x] `rispo-app/package.json` - React dependencies
- [x] `rispo-app/package-lock.json` - Locked npm dependencies
- [x] `pom.xml` - Maven dependencies
- [x] `mvnw` and `mvnw.cmd` - Maven wrapper (optional)
- [x] `.mvn/` directory - Maven wrapper config (optional)

### Build Scripts Available
- [x] `build-and-deploy.ps1` - Windows PowerShell script
- [x] `build-and-deploy.sh` - Linux/Mac bash script
- [x] `DOCKER_DEPLOYMENT.md` - Deployment documentation

## ✅ Build Process Validation

### Stage 1: React Frontend Build
```bash
# This happens inside Docker, no local Node.js needed
FROM node:18-alpine
npm ci                     # Install from package-lock.json
npm run build              # Build production bundle
```

**Validates**:
- ✅ package-lock.json exists and is valid
- ✅ No local node_modules copied (excluded by .dockerignore)
- ✅ All npm dependencies download from registry
- ✅ React build succeeds with react-scripts

### Stage 2: Spring Boot Backend Build
```bash
# This happens inside Docker, no local Java/Maven needed
FROM maven:3.9.6-eclipse-temurin-21
mvn dependency:go-offline  # Download all dependencies
mvn clean package          # Build JAR
```

**Validates**:
- ✅ pom.xml is valid
- ✅ No local target/ directory copied (excluded by .dockerignore)
- ✅ All Maven dependencies download from Maven Central
- ✅ Java 21 compilation succeeds
- ✅ Spring Boot packaging creates executable JAR

### Stage 3: Runtime Image
```bash
# Lightweight runtime image
FROM eclipse-temurin:21-jdk-jammy
COPY --from=backend-build app.jar
COPY --from=frontend-build build/
```

**Validates**:
- ✅ Only necessary artifacts copied (not source code)
- ✅ React build output served by Spring Boot
- ✅ Single container for frontend + backend

## ✅ Common Build Issues - RESOLVED

### ❌ ISSUE: "npm install" fails with permission errors
**CAUSE**: Copying local node_modules with wrong permissions

**FIXED**: ✅ `.dockerignore` excludes `rispo-app/node_modules`

---

### ❌ ISSUE: "npm install" fails with package-lock.json mismatch
**CAUSE**: Using `npm install` instead of `npm ci`

**FIXED**: ✅ Dockerfile uses `npm ci` for deterministic builds

---

### ❌ ISSUE: Maven downloads fail or are incomplete
**CAUSE**: Not downloading dependencies in a separate cached layer

**FIXED**: ✅ Dockerfile runs `mvn dependency:go-offline` before copying source

---

### ❌ ISSUE: Build includes unnecessary files (slow builds)
**CAUSE**: No .dockerignore file

**FIXED**: ✅ `.dockerignore` excludes:
- node_modules
- target/
- build/
- IDE files
- test files
- logs

---

### ❌ ISSUE: Can't reproduce build on different machine
**CAUSE**: Missing package-lock.json or relying on local dependencies

**FIXED**: ✅ `package-lock.json` committed to repo
✅ `npm ci` uses exact versions from package-lock.json
✅ Maven uses explicit versions in pom.xml

## ✅ Test on Fresh Machine

### Minimum System Requirements
- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: 10GB free space
- **Docker**: Docker Desktop 20.10+ or Docker Engine 20.10+

### Fresh Machine Test Steps

1. **Clean Docker Installation**
   ```bash
   # Verify ONLY Docker is installed
   docker --version
   docker-compose --version
   
   # Should NOT have:
   node --version     # Should fail
   npm --version      # Should fail
   java --version     # Should fail
   mvn --version      # Should fail
   ```

2. **Clone Project**
   ```bash
   git clone <repository>
   cd rispo
   ```

3. **Build & Deploy**
   ```bash
   # Windows
   .\build-and-deploy.ps1
   
   # Linux/Mac
   chmod +x build-and-deploy.sh
   ./build-and-deploy.sh
   ```

4. **Verify Build Success**
   ```bash
   # All services should be running
   docker-compose ps
   
   # Application should respond
   curl http://localhost:8080/actuator/health
   curl http://localhost:3000
   ```

### Expected Build Time
- **First build** (cold cache): 5-10 minutes
- **Subsequent builds** (warm cache): 2-5 minutes
- **Rebuild with code changes**: 1-2 minutes

### Expected Resource Usage
- **Disk**: ~3GB for images + volumes
- **RAM**: ~2GB during build, ~1.5GB running
- **CPU**: High during build, low when running

## ✅ CI/CD Readiness

The Docker setup is ready for CI/CD pipelines:

### GitHub Actions
```yaml
- name: Build Docker Image
  run: docker-compose build --no-cache app

- name: Start Services
  run: docker-compose up -d

- name: Run Tests
  run: docker-compose exec -T app ./mvnw test
```

### GitLab CI
```yaml
build:
  script:
    - docker-compose build --no-cache app
    - docker-compose up -d
```

### Jenkins
```groovy
stage('Build') {
    steps {
        sh 'docker-compose build --no-cache app'
    }
}
```

## ✅ Sign-Off

- [x] Dockerfile uses multi-stage builds
- [x] All dependencies download from public registries
- [x] No local dependencies required
- [x] `.dockerignore` excludes build artifacts
- [x] `package-lock.json` committed for reproducibility
- [x] Maven uses explicit dependency versions
- [x] Build scripts provided for Windows and Linux
- [x] Documentation includes troubleshooting
- [x] Tested on fresh machine with only Docker

**Status**: ✅ **READY FOR DEPLOYMENT ON ANY MACHINE**
