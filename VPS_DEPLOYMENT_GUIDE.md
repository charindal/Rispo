# VPS Deployment Guide for Rispo

Complete guide for deploying Rispo to a VPS with Traefik, load balancing, and GitHub Actions CI/CD.

## Table of Contents
- [VPS Requirements](#vps-requirements)
- [Initial VPS Setup](#initial-vps-setup)
- [GitHub Configuration](#github-configuration)
- [Domain Configuration](#domain-configuration)
- [Deployment](#deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## VPS Requirements

### Minimum Specifications
- **OS**: Ubuntu 22.04 LTS (recommended)
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 80 GB SSD
- **Network**: Public IP address

### Recommended Specifications (for production)
- **CPU**: 8 cores
- **RAM**: 16 GB
- **Storage**: 160 GB SSD
- **Bandwidth**: Unmetered or 5TB+

### Recommended Providers
- DigitalOcean (Droplets)
- Linode (Compute Instances)
- Vultr (Cloud Compute)
- Hetzner (Cloud Servers)
- AWS EC2 (t3.xlarge or larger)

---

## Initial VPS Setup

### 1. Connect to Your VPS

```bash
ssh root@your-vps-ip
```

### 2. Create Non-Root User

```bash
adduser deployer
usermod -aG sudo deployer
su - deployer
```

### 3. Run Setup Script

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/your-username/rispo/main/scripts/setup-vps.sh -o setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

Or manually:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Create app directory
sudo mkdir -p /opt/rispo
sudo chown $USER:$USER /opt/rispo

# Clone repository
cd /opt/rispo
git clone https://github.com/your-username/rispo.git .
```

### 4. Configure Environment

```bash
cd /opt/rispo
cp .env.prod.example .env.prod
nano .env.prod
```

**Important settings to update:**

```env
# Your domain
DOMAIN=rispo.com

# Strong passwords (use password generator)
DB_PASSWORD=your_secure_db_password_here
REDIS_PASSWORD=your_secure_redis_password_here
RABBITMQ_PASSWORD=your_secure_rabbitmq_password_here

# JWT secret (at least 64 characters)
JWT_SECRET=your_very_long_random_string_here

# Your email for Let's Encrypt
ACME_EMAIL=admin@rispo.com

# Docker image (update with your GitHub username)
DOCKER_IMAGE=ghcr.io/your-username/rispo

# Grafana credentials
GRAFANA_USER=admin
GRAFANA_PASSWORD=your_grafana_password
```

### 5. Generate Authentication Passwords

For Traefik dashboard and Prometheus:

```bash
# Install apache2-utils
sudo apt install -y apache2-utils

# Generate password hash
htpasswd -nbB admin yourpassword

# Copy the output to .env.prod (escape $ with $$)
# Example: admin:$apr1$xyz123$abcdef becomes admin:$$apr1$$xyz123$$abcdef
```

### 6. Setup Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## GitHub Configuration

### 1. Enable GitHub Packages

1. Go to your repository → Settings → Actions → General
2. Enable "Read and write permissions" for workflows

### 2. Configure GitHub Secrets

Go to repository → Settings → Secrets and variables → Actions

Add the following secrets:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `VPS_HOST` | Your VPS IP address | `123.45.67.89` |
| `VPS_USERNAME` | SSH username | `deployer` |
| `VPS_SSH_KEY` | Private SSH key | Contents of `~/.ssh/id_rsa` |
| `VPS_PORT` | SSH port (optional) | `22` |
| `SLACK_WEBHOOK` | Slack webhook URL (optional) | `https://hooks.slack.com/...` |

### 3. Generate SSH Key for GitHub Actions

On your VPS:

```bash
# Generate SSH key (if not exists)
ssh-keygen -t ed25519 -C "github-actions"

# Add public key to authorized_keys
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys

# Display private key (copy this to GitHub secret VPS_SSH_KEY)
cat ~/.ssh/id_ed25519
```

### 4. Test GitHub Actions

Push a commit to the `main` branch:

```bash
git add .
git commit -m "Initial deployment setup"
git push origin main
```

Check Actions tab in GitHub to see the deployment progress.

---

## Domain Configuration

### 1. DNS Records

Add the following DNS records for your domain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `your-vps-ip` | 300 |
| A | www | `your-vps-ip` | 300 |
| A | traefik | `your-vps-ip` | 300 |
| A | grafana | `your-vps-ip` | 300 |
| A | prometheus | `your-vps-ip` | 300 |
| A | rabbitmq | `your-vps-ip` | 300 |

### 2. Wait for DNS Propagation

```bash
# Check DNS propagation
nslookup rispo.com
dig rispo.com
```

DNS propagation can take 5 minutes to 48 hours.

---

## Deployment

### 1. First Deployment (Manual)

```bash
cd /opt/rispo

# Pull the Docker image (or build locally)
docker pull ghcr.io/your-username/rispo:latest

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

### 2. Verify Deployment

Check the following URLs:
- https://your-domain.com - Main application
- https://traefik.your-domain.com - Traefik dashboard
- https://grafana.your-domain.com - Grafana monitoring
- https://prometheus.your-domain.com - Prometheus metrics
- https://rabbitmq.your-domain.com - RabbitMQ management

### 3. Automated Deployments

After GitHub Actions is configured, every push to `main` will:
1. Build a new Docker image
2. Push to GitHub Container Registry
3. Deploy to your VPS
4. Perform health checks
5. Create a database backup

---

## Monitoring & Maintenance

### View Logs

```bash
# Application logs
docker compose -f docker-compose.prod.yml logs -f app-1 app-2

# Traefik logs
docker compose -f docker-compose.prod.yml logs -f traefik

# All logs
docker compose -f docker-compose.prod.yml logs -f
```

### Health Check

```bash
cd /opt/rispo
./scripts/health-check.sh
```

### Manual Backup

```bash
cd /opt/rispo
docker compose -f docker-compose.prod.yml run --rm backup
```

### Scale Application

```bash
# Scale to 3 instances
docker compose -f docker-compose.prod.yml up -d --scale app-1=3 --no-recreate

# Scale to 1 instance
docker compose -f docker-compose.prod.yml up -d --scale app-1=1 --no-recreate
```

### Update Application

```bash
cd /opt/rispo
./scripts/deploy.sh
```

### Disk Space Cleanup

```bash
# Remove unused Docker images
docker image prune -af

# Remove old backups (keeps last 7 days)
find /opt/rispo/backups -name "*.sql.gz" -mtime +7 -delete

# Full cleanup
docker system prune -af --volumes
```

---

## Troubleshooting

### Application Not Starting

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs app-1 app-2

# Check health
docker inspect rispo-app-1 | grep -A 10 Health
```

### SSL Certificate Issues

```bash
# Check Traefik logs
docker compose -f docker-compose.prod.yml logs traefik

# Check certificate file
ls -l /opt/rispo/traefik/letsencrypt/acme.json

# Permissions should be 600
chmod 600 /opt/rispo/traefik/letsencrypt/acme.json

# Delete and regenerate certificates
rm /opt/rispo/traefik/letsencrypt/acme.json
docker compose -f docker-compose.prod.yml restart traefik
```

### Database Connection Issues

```bash
# Check database status
docker compose -f docker-compose.prod.yml ps db

# Access database
docker compose -f docker-compose.prod.yml exec db psql -U rispo_admin -d rispo

# Check connection from app
docker compose -f docker-compose.prod.yml exec app-1 ping db
```

### High Memory Usage

```bash
# Check memory usage
docker stats

# Restart services
docker compose -f docker-compose.prod.yml restart

# Limit memory for services (edit docker-compose.prod.yml)
services:
  app-1:
    deploy:
      resources:
        limits:
          memory: 1G
```

### Load Balancer Not Working

```bash
# Check Traefik configuration
docker compose -f docker-compose.prod.yml exec traefik cat /etc/traefik/traefik.yml

# Check service discovery
curl http://localhost:8081/api/http/services

# Restart Traefik
docker compose -f docker-compose.prod.yml restart traefik
```

### GitHub Actions Deployment Fails

1. Check GitHub Actions logs
2. Verify SSH connection: `ssh deployer@your-vps-ip`
3. Check VPS_SSH_KEY secret is correct
4. Ensure /opt/rispo directory exists on VPS
5. Verify GitHub token has packages:write permission

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -af --volumes

# Clean old backups
cd /opt/rispo/backups
ls -lh
rm old_backup_files
```

---

## Security Best Practices

1. **Change default passwords** in `.env.prod`
2. **Use strong JWT secret** (at least 64 random characters)
3. **Enable firewall** (UFW)
4. **Keep system updated**: `sudo apt update && sudo apt upgrade`
5. **Use SSH keys** instead of passwords
6. **Disable root login**: Edit `/etc/ssh/sshd_config`
7. **Enable automatic security updates**:
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure --priority=low unattended-upgrades
   ```
8. **Monitor logs** regularly
9. **Set up automated backups**
10. **Use private Docker registry** for sensitive images

---

## Performance Tuning

### Database Optimization

Edit `docker-compose.prod.yml` to add PostgreSQL tuning:

```yaml
db:
  command: 
    - "postgres"
    - "-c"
    - "max_connections=200"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "effective_cache_size=1GB"
```

### Redis Optimization

```yaml
redis:
  command: redis-server --maxmemory 1gb --maxmemory-policy allkeys-lru
```

### Application Scaling

Monitor metrics in Grafana and scale based on:
- CPU usage > 70% → Add more instances
- Memory usage > 80% → Increase memory limits
- Response time > 500ms → Add more instances

---

## Support & Resources

- **Traefik Documentation**: https://doc.traefik.io/traefik/
- **Docker Documentation**: https://docs.docker.com/
- **GitHub Actions**: https://docs.github.com/actions
- **Let's Encrypt**: https://letsencrypt.org/docs/

---

## Quick Reference Commands

```bash
# Start services
docker compose -f docker-compose.prod.yml up -d

# Stop services
docker compose -f docker-compose.prod.yml down

# View status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart
docker compose -f docker-compose.prod.yml restart

# Scale
docker compose -f docker-compose.prod.yml up -d --scale app-1=3

# Backup
docker compose -f docker-compose.prod.yml run --rm backup

# Health check
./scripts/health-check.sh

# Deploy
./scripts/deploy.sh
```
