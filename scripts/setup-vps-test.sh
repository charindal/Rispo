#!/bin/bash
set -e

echo "🚀 Setting up Rispo on VPS for testing (no domain)..."

# Update system
echo "📦 Updating system..."
sudo apt update && sudo apt upgrade -y

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

# Install Git
echo "📦 Installing Git..."
sudo apt install -y git

# Create application directory
echo "📁 Creating application directory..."
sudo mkdir -p /opt/rispo
sudo chown $USER:$USER /opt/rispo

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw --force enable

echo ""
echo "✅ VPS setup completed!"
echo ""
echo "📝 Next steps:"
echo "1. Clone your repository to /opt/rispo"
echo "2. Build Docker image or pull from registry"
echo "3. Run: cd /opt/rispo && docker compose -f docker-compose.test.yml up -d"
echo ""
echo "🌐 Access your app at: http://135.125.133.211"
echo "📊 Traefik dashboard: http://135.125.133.211:8080"
echo ""
