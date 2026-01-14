# Grafana Troubleshooting Commands for VPS
# Run these commands on your VPS to diagnose the issue

# 1. Check if Grafana container is running
docker ps | grep grafana

# 2. Check Grafana container logs (last 50 lines)
docker logs rispo-grafana --tail 50

# 3. Check Grafana environment variables
docker inspect rispo-grafana | grep -A 20 "Env"

# 4. Test Grafana directly (bypassing Traefik)
curl -I http://localhost:3000/grafana

# 5. Check if Grafana is accessible from Traefik container
docker exec rispo-traefik wget -O- http://rispo-grafana:3000/grafana 2>&1 | head -20

# 6. Check Traefik configuration for Grafana
docker inspect rispo-grafana | grep -A 30 "Labels"

# 7. Check Traefik logs for Grafana routing
docker logs rispo-traefik 2>&1 | grep -i grafana | tail -20

# 8. Check all Traefik routers
docker logs rispo-traefik 2>&1 | grep -i "router" | tail -30

# 9. Test the /grafana endpoint from inside the network
docker exec rispo-traefik curl -I http://rispo-grafana:3000/grafana

# 10. Restart both services
docker restart rispo-grafana rispo-traefik

# 11. Check if the containers are on the same network
docker network inspect rispo-net | grep -E "grafana|traefik" -A 5
