# VPS Test Deployment Guide (Without Domain)

Quick guide to deploy Rispo to your VPS for testing without a domain name.

## VPS Details
- **IP**: 135.125.133.211
- **IPv6**: 2001:41d0:701:1100::7a56
- **Hostname**: vps-6cb863de.vps.ovh.net
- **Username**: ubuntu

---

## Step 1: Connect to VPS

```powershell
# From Windows (using PowerShell)
ssh ubuntu@135.125.133.211
```

---

## Step 2: Run Setup Script

```bash
# Download setup script
curl -fsSL https://raw.githubusercontent.com/your-username/rispo/main/scripts/setup-vps-test.sh -o setup.sh
chmod +x setup.sh
./setup.sh
```

Or manually:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install -y docker-compose-plugin git

# Create app directory
sudo mkdir -p /opt/rispo
sudo chown ubuntu:ubuntu /opt/rispo

# Setup firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw --force enable

# Logout and login again for Docker group to take effect
exit
```

---

## Step 3: Deploy Application

### Option A: Build on VPS (Slower but Simple)

```bash
# SSH back in
ssh ubuntu@135.125.133.211

# Clone repository
cd /opt/rispo
git clone https://github.com/your-username/rispo.git .

# Build Docker image locally
docker build -t rispo-local:latest .

# Start services
docker compose -f docker-compose.test.yml up -d

# Check status
docker compose -f docker-compose.test.yml ps

# View logs
docker compose -f docker-compose.test.yml logs -f
```

### Option B: Push from Your Local Machine (Faster)

```powershell
# On your Windows machine
cd C:\DevCode\Rispo

# Build image
docker build -t rispo-local:latest .

# Save image to file
docker save rispo-local:latest | gzip > rispo-image.tar.gz

# Copy to VPS (using SCP)
scp rispo-image.tar.gz ubuntu@135.125.133.211:/tmp/

# SSH to VPS
ssh ubuntu@135.125.133.211

# Load image
docker load < /tmp/rispo-image.tar.gz
rm /tmp/rispo-image.tar.gz

# Clone config files only
cd /opt/rispo
git clone https://github.com/your-username/rispo.git .

# Start services
docker compose -f docker-compose.test.yml up -d
```

### Option C: Use GitHub Container Registry

```powershell
# On your Windows machine - build and push
cd C:\DevCode\Rispo

# Login to GitHub Container Registry
$env:CR_PAT="your_github_token"
echo $env:CR_PAT | docker login ghcr.io -u your-username --password-stdin

# Build and tag
docker build -t ghcr.io/your-username/rispo:test .

# Push
docker push ghcr.io/your-username/rispo:test
```

```bash
# On VPS - pull and run
ssh ubuntu@135.125.133.211
cd /opt/rispo

# Clone repo
git clone https://github.com/your-username/rispo.git .

# Create .env file
cat > .env << EOF
DOCKER_IMAGE=ghcr.io/your-username/rispo
IMAGE_TAG=test
DB_NAME=rispo
DB_USER=rispo_admin
DB_PASSWORD=RispoTest123
RABBITMQ_USER=rispo_admin
RABBITMQ_PASSWORD=RispoTest123
JWT_SECRET=test_jwt_secret_key_for_testing_only
EOF

# Pull and start
docker compose -f docker-compose.test.yml pull
docker compose -f docker-compose.test.yml up -d
```

---

## Step 4: Access Your Application

After deployment (wait 2-3 minutes for startup):

- **Main Application**: http://135.125.133.211
- **Traefik Dashboard**: http://135.125.133.211:8080
- **Grafana**: http://135.125.133.211/grafana (admin/admin)
- **RabbitMQ**: http://135.125.133.211/rabbitmq (rispo_admin/RispoTest123)

---

## Useful Commands

```bash
# Check running containers
docker compose -f docker-compose.test.yml ps

# View logs
docker compose -f docker-compose.test.yml logs -f app

# Restart application
docker compose -f docker-compose.test.yml restart app

# Stop all services
docker compose -f docker-compose.test.yml down

# Start all services
docker compose -f docker-compose.test.yml up -d

# Check health
docker compose -f docker-compose.test.yml exec app wget -qO- http://localhost:8080/actuator/health

# Access database
docker compose -f docker-compose.test.yml exec db psql -U rispo_admin -d rispo

# View disk usage
df -h
docker system df
```

---

## Troubleshooting

### Application won't start

```bash
# Check logs
docker compose -f docker-compose.test.yml logs app

# Check health
docker compose -f docker-compose.test.yml ps
```

### Port 80 already in use

```bash
# Check what's using port 80
sudo lsof -i :80
sudo netstat -tulpn | grep :80

# Stop conflicting service
sudo systemctl stop apache2  # or nginx
```

### Out of disk space

```bash
# Clean up Docker
docker system prune -af

# Check space
df -h
```

### Can't connect from browser

```bash
# Check firewall
sudo ufw status

# Check if app is listening
sudo netstat -tulpn | grep :80

# Test locally on VPS
curl http://localhost
curl http://localhost:8080/actuator/health
```

---

## When Domain is Ready

Once you have `rispo.co.zw` ready:

1. Point DNS to `135.125.133.211`
2. Wait for DNS propagation
3. Stop test deployment:
   ```bash
   docker compose -f docker-compose.test.yml down
   ```
4. Switch to production deployment:
   ```bash
   # Create .env.prod from .env.prod.example
   cp .env.prod.example .env.prod
   nano .env.prod  # Update with real values
   
   # Start with SSL
   docker compose -f docker-compose.prod.yml up -d
   ```

---

## Quick Deployment Summary

```bash
# One-liner deployment
ssh ubuntu@135.125.133.211 "sudo apt update && \
  curl -fsSL https://get.docker.com | sudo sh && \
  sudo apt install -y docker-compose-plugin git && \
  sudo mkdir -p /opt/rispo && \
  sudo chown ubuntu:ubuntu /opt/rispo && \
  sudo ufw allow 80/tcp && sudo ufw --force enable"

# Then deploy
ssh ubuntu@135.125.133.211
cd /opt/rispo
git clone https://github.com/your-username/rispo.git .
docker build -t rispo-local:latest .
docker compose -f docker-compose.test.yml up -d
```

Access at: http://135.125.133.211
