# ========================
# Scale Application Instances
# ========================
# Scale up to 3 instances
docker compose -f docker-compose.prod.yml up -d --scale app-1=3 --no-recreate

# Or scale down to 1 instance
docker compose -f docker-compose.prod.yml up -d --scale app-1=1 --no-recreate

# ========================
# View Logs
# ========================
# All application logs
docker compose -f docker-compose.prod.yml logs -f app-1 app-2

# Specific service logs
docker compose -f docker-compose.prod.yml logs -f traefik

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 app-1

# ========================
# Restart Services
# ========================
# Restart all services
docker compose -f docker-compose.prod.yml restart

# Restart specific service
docker compose -f docker-compose.prod.yml restart app-1

# ========================
# Update Single Service
# ========================
# Update without downtime
docker compose -f docker-compose.prod.yml up -d --no-deps --force-recreate app-1

# ========================
# Database Operations
# ========================
# Manual backup
docker compose -f docker-compose.prod.yml run --rm backup

# Restore from backup
gunzip < backups/rispo_backup_20260111_120000.sql.gz | docker compose -f docker-compose.prod.yml exec -T db psql -U rispo_admin -d rispo

# Access database
docker compose -f docker-compose.prod.yml exec db psql -U rispo_admin -d rispo

# ========================
# Monitoring
# ========================
# View resource usage
docker stats

# Check health status
docker compose -f docker-compose.prod.yml ps

# View Traefik dashboard
# https://traefik.your-domain.com

# ========================
# Cleanup
# ========================
# Remove unused images
docker image prune -af

# Remove unused volumes
docker volume prune -f

# Full system cleanup
docker system prune -af --volumes
