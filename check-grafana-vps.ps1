# Check Grafana Status on VPS
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Grafana Diagnostic Tool for VPS" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Copy and run these commands on your VPS:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Check if Grafana container is running:" -ForegroundColor Green
Write-Host "   docker ps --filter name=grafana" -ForegroundColor White
Write-Host ""

Write-Host "2. Check Grafana container logs:" -ForegroundColor Green
Write-Host "   docker logs rispo-grafana --tail 50" -ForegroundColor White
Write-Host ""

Write-Host "3. Check Traefik routing for Grafana:" -ForegroundColor Green
Write-Host "   docker exec rispo-traefik traefik healthcheck" -ForegroundColor White
Write-Host ""

Write-Host "4. Restart Grafana with updated config:" -ForegroundColor Green
Write-Host "   cd /root/rispo" -ForegroundColor White
Write-Host "   docker compose -f docker-compose.test.yml restart grafana traefik" -ForegroundColor White
Write-Host ""

Write-Host "5. Check if Grafana port is accessible internally:" -ForegroundColor Green
Write-Host "   docker exec rispo-traefik wget -O- http://grafana:3000/api/health" -ForegroundColor White
Write-Host ""

Write-Host "6. View all Traefik routes:" -ForegroundColor Green
Write-Host "   docker logs rispo-traefik 2>&1 | grep -E 'grafana|priority'" -ForegroundColor White
Write-Host ""

Write-Host "After running these, the issue should be one of:" -ForegroundColor Yellow
Write-Host "  - Grafana container not running → restart it" -ForegroundColor White
Write-Host "  - Traefik not detecting route → restart traefik" -ForegroundColor White
Write-Host "  - Wrong docker-compose file used → verify with: docker inspect rispo-grafana" -ForegroundColor White
Write-Host ""
