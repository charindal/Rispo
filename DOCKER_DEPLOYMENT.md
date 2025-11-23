# Rispo - Docker Deployment Guide

This guide explains how to deploy the Rispo application on **any machine with only Docker installed**.

## Prerequisites

- **Docker Desktop** (Windows/Mac) or **Docker Engine** (Linux)
- **Docker Compose** (usually bundled with Docker Desktop)
- At least **4GB RAM** available for Docker
- At least **10GB** free disk space

## Quick Start

### Windows

```powershell
# Run the automated build script
.\build-and-deploy.ps1
```

### Linux/Mac

```bash
# Make the script executable
chmod +x build-and-deploy.sh

# Run the automated build script
./build-and-deploy.sh
```

### Manual Build (All Platforms)

```bash
# Build the application image
docker-compose build --no-cache app

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

## What Gets Built

The Docker build process will:

1. **Frontend Build**: 
   - Downloads Node.js dependencies from npm registry
   - Builds the React application
   - Creates optimized production bundle

2. **Backend Build**:
   - Downloads Maven dependencies from Maven Central
   - Compiles Java code with JDK 21
   - Creates Spring Boot executable JAR

3. **Runtime**:
   - Combines frontend and backend in a single container
   - Connects to PostgreSQL, Redis, and RabbitMQ
   - Exposes services on configured ports

## No Local Dependencies Required

The Dockerfile is designed to be **completely self-contained**:

- ✅ No need for Node.js installed locally
- ✅ No need for npm/yarn installed locally
- ✅ No need for Java/JDK installed locally
- ✅ No need for Maven installed locally
- ✅ No need for PostgreSQL/Redis/RabbitMQ installed locally

Everything runs inside Docker containers.

## Build Optimization

The Dockerfile uses **multi-stage builds** and **layer caching**:

- `npm ci` for reproducible React builds
- Maven dependency caching for faster rebuilds
- `.dockerignore` excludes unnecessary files
- Separate layers for dependencies and source code

## Troubleshooting

### Build Fails with "npm install" errors

**Cause**: Old `node_modules` or `package-lock.json` conflicts

**Solution**:
```bash
# Clean build (Windows)
docker-compose build --no-cache app

# Clean build (Linux/Mac)
docker-compose build --no-cache app
```

### Build Fails with Maven dependency errors

**Cause**: Network issues or corrupted Maven cache

**Solution**:
```bash
# Rebuild with fresh Maven cache
docker-compose build --no-cache app
```

### Container starts but app doesn't respond

**Cause**: Services starting in wrong order or ports already in use

**Solution**:
```bash
# Check if ports are available
docker-compose down
docker-compose up -d

# View startup logs
docker-compose logs -f app
```

### Out of disk space errors

**Cause**: Docker images/volumes consuming too much space

**Solution**:
```bash
# Clean up unused Docker resources
docker system prune -a --volumes
```

## Application URLs

Once deployed successfully:

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:8080 | - |
| Swagger UI | http://localhost:8080/swagger-ui.html | - |
| Grafana | http://localhost:3000 | admin/admin |
| Prometheus | http://localhost:9090 | - |
| RabbitMQ Management | http://localhost:15672 | rispo_admin/R!#po123## |

## Stopping the Application

```bash
# Stop services (keeps data)
docker-compose stop

# Stop and remove containers (keeps data volumes)
docker-compose down

# Stop, remove containers AND delete all data
docker-compose down -v
```

## Database Reset

If you need to reset the database:

```bash
# Stop services
docker-compose down

# Remove database volume
docker volume rm rispo_db-data

# Start fresh
docker-compose up -d
```

## Deployment on New Machine

1. Copy the entire project folder to the new machine
2. Install Docker Desktop (or Docker Engine)
3. Run the build script or `docker-compose build --no-cache app`
4. Run `docker-compose up -d`

That's it! No other dependencies needed.

## Architecture

```
┌─────────────────────────────────────────┐
│   Docker Compose Network (rispo-net)    │
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │  React   │  │  Spring  │           │
│  │  Build   │→ │  Boot    │           │
│  │ (Node)   │  │  App     │           │
│  └──────────┘  └──────────┘           │
│                     ↓                   │
│  ┌──────────┐  ┌──────────┐           │
│  │PostgreSQL│  │  Redis   │           │
│  │   DB     │  │  Cache   │           │
│  └──────────┘  └──────────┘           │
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │ RabbitMQ │  │ Grafana  │           │
│  │  Queue   │  │  Stack   │           │
│  └──────────┘  └──────────┘           │
└─────────────────────────────────────────┘
```

## Support

If you encounter issues not covered here, check:

1. Docker logs: `docker-compose logs app`
2. Container status: `docker-compose ps`
3. Docker resource usage: `docker stats`
