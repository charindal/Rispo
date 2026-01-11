#!/bin/bash

# ========================
# Health Check Script
# ========================

echo "🏥 Checking service health..."

cd /opt/rispo || exit 1

# Check Docker service
if ! systemctl is-active --quiet docker; then
    echo "❌ Docker service is not running"
    exit 1
fi

# Check containers
echo ""
echo "📊 Container Status:"
docker compose -f docker-compose.prod.yml ps

# Check app health
echo ""
echo "🔍 Application Health:"
for i in 1 2; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' rispo-app-$i 2>/dev/null || echo "not running")
    echo "  App Instance $i: $HEALTH"
done

# Check Traefik
echo ""
echo "🌐 Traefik Status:"
TRAEFIK_HEALTH=$(docker inspect --format='{{.State.Status}}' rispo-traefik 2>/dev/null || echo "not running")
echo "  Traefik: $TRAEFIK_HEALTH"

# Check database
echo ""
echo "🗄️ Database Status:"
DB_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' rispo-db 2>/dev/null || echo "not running")
echo "  PostgreSQL: $DB_HEALTH"

# Check disk space
echo ""
echo "💾 Disk Usage:"
df -h /opt/rispo
df -h /var/lib/docker

# Check memory
echo ""
echo "🧠 Memory Usage:"
free -h

echo ""
echo "✅ Health check complete!"
