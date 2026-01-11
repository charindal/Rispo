#!/bin/bash
set -e

# ========================
# VPS Initial Setup Script
# ========================

echo "🚀 Starting VPS setup for Rispo..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    htop \
    vim

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
if ! command -v docker compose &> /dev/null; then
    sudo apt install -y docker-compose-plugin
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/rispo
sudo chown $USER:$USER /opt/rispo
cd /opt/rispo

# Clone repository (you'll need to set this up)
echo "📥 Cloning repository..."
read -p "Enter your GitHub repository URL: " REPO_URL
git clone $REPO_URL .

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p traefik/letsencrypt
mkdir -p traefik/logs
mkdir -p backups
mkdir -p telemetry

# Set permissions for Traefik
chmod 600 traefik/letsencrypt

# Copy environment file
echo "⚙️ Setting up environment..."
if [ -f .env.prod.example ]; then
    cp .env.prod.example .env.prod
    echo "✅ Created .env.prod file"
    echo "⚠️  IMPORTANT: Edit .env.prod and update all passwords and secrets!"
fi

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create systemd service for auto-start (optional)
echo "⚙️ Creating systemd service..."
cat <<EOF | sudo tee /etc/systemd/system/rispo.service
[Unit]
Description=Rispo Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/rispo
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable rispo.service

echo ""
echo "✅ VPS setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Edit /opt/rispo/.env.prod with your actual credentials"
echo "2. Update DOMAIN in .env.prod with your domain name"
echo "3. Configure GitHub secrets for CI/CD"
echo "4. Point your domain's DNS to this server's IP"
echo "5. Generate authentication passwords:"
echo "   docker run --rm httpd:2.4-alpine htpasswd -nbB admin yourpassword"
echo "6. Start the application:"
echo "   cd /opt/rispo"
echo "   docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "🔐 SSH key for GitHub Actions is at: ~/.ssh/id_rsa (generate if needed)"
