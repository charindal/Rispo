# Deployment Workflow Guide

## Branch Strategy

### Development Branch → Test VPS
- **Branch**: `development` or `dev`
- **VPS**: 135.125.133.211 (Test environment)
- **Docker Compose**: `docker-compose.test.yml`
- **Access**: http://135.125.133.211
- **Purpose**: Testing and development

### Main Branch → Production VPS
- **Branch**: `main` or `production`
- **VPS**: Production VPS (when domain is ready)
- **Docker Compose**: `docker-compose.prod.yml`
- **Access**: https://rispo.co.zw (when ready)
- **Purpose**: Production deployment

---

## Automatic Deployment

### Development (Test VPS)

```bash
# Work on development branch
git checkout development

# Make changes
git add .
git commit -m "Your changes"

# Push to trigger auto-deployment to test VPS
git push origin development
```

**What happens:**
1. ✅ Builds Docker image
2. ✅ Pushes to GitHub Container Registry (tagged as `development`)
3. ✅ Deploys to test VPS at 135.125.133.211
4. ✅ Uses `docker-compose.test.yml` (HTTP, no SSL)
5. ✅ Access at http://135.125.133.211

### Production (Production VPS)

```bash
# Merge to main when ready for production
git checkout main
git merge development
git push origin main
```

**What happens:**
1. ✅ Builds Docker image
2. ✅ Pushes to GitHub Container Registry (tagged as `latest`)
3. ✅ Deploys to production VPS
4. ✅ Uses `docker-compose.prod.yml` (HTTPS with SSL)
5. ✅ Zero-downtime deployment
6. ✅ Automatic database backup
7. ✅ Access at https://rispo.co.zw

---

## Manual Deployment

### Deploy from Development Branch (Current Setup)

```bash
# On VPS
ssh ubuntu@135.125.133.211
cd /opt/rispo

# Checkout development branch
git fetch origin
git checkout development
git pull origin development

# Build and deploy
docker build -t rispo-local:latest .
docker compose -f docker-compose.test.yml up -d

# Or pull from GitHub registry
docker pull ghcr.io/your-username/rispo:development
docker compose -f docker-compose.test.yml up -d
```

### Update Running Application

```bash
# Pull latest changes
cd /opt/rispo
git pull origin development

# Rebuild and restart
docker compose -f docker-compose.test.yml down app
docker compose -f docker-compose.test.yml up -d --build app

# Or just restart
docker compose -f docker-compose.test.yml restart app
```

---

## GitHub Secrets Setup

For automatic deployment, configure these secrets in GitHub:

### Test VPS (Development)
| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VPS_HOST` | `135.125.133.211` | Test VPS IP |
| `VPS_USERNAME` | `ubuntu` | SSH username |
| `VPS_SSH_KEY` | SSH private key | For authentication |
| `VPS_PORT` | `22` | SSH port (optional) |

### Production VPS (When Ready)
| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VPS_PROD_HOST` | Production IP | Production VPS IP |
| `VPS_PROD_USERNAME` | `ubuntu` | SSH username |
| `VPS_PROD_SSH_KEY` | SSH private key | For authentication |
| `VPS_PROD_PORT` | `22` | SSH port (optional) |

If production secrets aren't set, it falls back to test VPS secrets.

---

## Workflow Visualization

```
development branch
    ↓
  Push to GitHub
    ↓
  GitHub Actions
    ↓
  Build Docker Image
    ↓
  Push to ghcr.io (tag: development)
    ↓
  Deploy to Test VPS (135.125.133.211)
    ↓
  http://135.125.133.211


main branch
    ↓
  Push to GitHub
    ↓
  GitHub Actions
    ↓
  Build Docker Image
    ↓
  Push to ghcr.io (tag: latest)
    ↓
  Deploy to Production VPS
    ↓
  https://rispo.co.zw
    ↓
  Database Backup
```

---

## Quick Commands

### Check Deployment Status

```bash
# On VPS
docker compose -f docker-compose.test.yml ps
docker compose -f docker-compose.test.yml logs -f app
```

### View GitHub Actions

```bash
# Go to your repository on GitHub
# Click "Actions" tab
# See all deployments and their status
```

### Rollback

```bash
# On VPS - rollback to previous commit
cd /opt/rispo
git log --oneline  # Find previous commit
git checkout <commit-hash>
docker compose -f docker-compose.test.yml up -d --force-recreate app
```

### View Application Logs

```bash
# On VPS
docker compose -f docker-compose.test.yml logs -f app

# Last 100 lines
docker compose -f docker-compose.test.yml logs --tail=100 app
```

---

## Best Practices

1. **Always work on development branch** for new features
2. **Test on test VPS** (http://135.125.133.211) before merging to main
3. **Merge to main only** when features are tested and stable
4. **Monitor GitHub Actions** to ensure deployments succeed
5. **Check VPS logs** if deployment fails

---

## Current Setup

Right now you have:
- ✅ Development branch for active development
- ✅ Test VPS at 135.125.133.211
- ✅ Automatic deployment from development branch
- ⏳ Domain (rispo.co.zw) being configured
- ⏳ Production deployment (ready when domain is set)

---

## Next Steps

1. **Push development branch to GitHub**
   ```bash
   git checkout development
   git add .
   git commit -m "Setup deployment pipeline"
   git push origin development
   ```

2. **Configure GitHub secrets** (VPS_HOST, VPS_USERNAME, VPS_SSH_KEY)

3. **Watch automatic deployment** in GitHub Actions

4. **Access your app** at http://135.125.133.211

5. **When domain is ready**, merge to main for production deployment
