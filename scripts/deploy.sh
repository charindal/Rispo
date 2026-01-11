#!/bin/bash

# ========================
# Deployment Script for VPS
# ========================

cd /opt/rispo || exit 1

echo "🚀 Deploying Rispo..."

# Pull latest code
git pull origin main

# Pull latest images
echo "🐳 Pulling Docker images..."
docker compose -f docker-compose.prod.yml pull

# Restart services with zero-downtime
echo "🔄 Restarting services..."
docker compose -f docker-compose.prod.yml up -d --force-recreate --remove-orphans

# Wait for health checks
echo "⏳ Waiting for services to start..."
sleep 20

# Show status
docker compose -f docker-compose.prod.yml ps

echo "✅ Deployment complete!"
