# Rispo Observability Stack

This directory contains the configuration for the complete observability stack using OpenTelemetry, Prometheus, Tempo, Loki, and Grafana.

## Architecture

```
┌──────────────┐
│  Rispo App   │
│  (Spring)    │
└──────┬───────┘
       │
       │ Metrics, Traces, Logs
       │ (OTLP/HTTP)
       ▼
┌──────────────────┐
│ OpenTelemetry    │
│   Collector      │
└─────┬─────┬──────┘
      │     │
      │     └─────────────────┐
      │                       │
      ▼                       ▼
┌────────────┐         ┌───────────┐
│ Prometheus │         │   Tempo   │
│  (Metrics) │         │ (Traces)  │
└────────────┘         └───────────┘
      │                       │
      │     ┌────────────┐    │
      └────►│  Grafana   │◄───┘
            │ (Visualize)│
      ┌────►│            │
      │     └────────────┘
      │
┌────────────┐
│    Loki    │
│   (Logs)   │
└────────────┘
```

## Components

### OpenTelemetry Collector
- **Port**: 4318 (HTTP), 4317 (gRPC)
- **Purpose**: Receives telemetry data from the application and routes it to appropriate backends
- **Config**: `otel-collector-config.yaml`

### Prometheus
- **Port**: 9090
- **Purpose**: Stores and queries metrics
- **Config**: `prometheus.yaml`
- **Access**: http://localhost:9090

### Tempo
- **Port**: 3200
- **Purpose**: Distributed tracing backend
- **Config**: `tempo.yaml`
- **Storage**: Local filesystem (48h retention)

### Loki
- **Port**: 3100
- **Purpose**: Log aggregation system
- **Storage**: Local filesystem

### Grafana
- **Port**: 3000
- **Purpose**: Visualization and dashboards
- **Default Credentials**: admin/admin
- **Access**: http://localhost:3000

### Exporters (Optional)
- **PostgreSQL Exporter**: Port 9187
- **Redis Exporter**: Port 9121

## Dashboards

### 1. Rispo Application Overview (`rispo-overview`)
Comprehensive application monitoring dashboard including:
- HTTP request rate and latency
- Success/error rates
- JVM memory usage
- Database connection pool metrics
- Repository method invocations
- Service health status (App, DB, Redis)
- RabbitMQ message rates
- Cache hit rates

### 2. Rispo Business Metrics (`rispo-business`)
Business-focused metrics dashboard including:
- API endpoint activity breakdown
- Match submission rates
- Challenge activity (created/accepted/rejected)
- API response times by endpoint
- HTTP status code distribution
- Error logs integration

## Quick Start

1. **Start all services**:
   ```bash
   docker-compose up -d
   ```

2. **Verify services are running**:
   ```bash
   docker-compose ps
   ```

3. **Access Grafana**:
   - URL: http://localhost:3000
   - Username: admin
   - Password: admin
   - Navigate to Dashboards → Browse

4. **Access Prometheus**:
   - URL: http://localhost:9090
   - Query metrics directly

5. **View Application Metrics**:
   - Spring Boot Actuator: http://localhost:8080/actuator
   - Prometheus Metrics: http://localhost:8080/actuator/prometheus

## Monitoring Endpoints

### Application Endpoints
- Health: http://localhost:8080/actuator/health
- Metrics: http://localhost:8080/actuator/metrics
- Prometheus: http://localhost:8080/actuator/prometheus
- Info: http://localhost:8080/actuator/info

### Observability Stack
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- Tempo: http://localhost:3200
- Loki: http://localhost:3100
- RabbitMQ Management: http://localhost:15672

## Key Metrics

### Application Performance
- `http_server_requests_seconds_count` - HTTP request count
- `http_server_requests_seconds_sum` - Total request duration
- `jvm_memory_used_bytes` - JVM memory usage
- `hikaricp_connections_active` - Active DB connections

### Business Metrics
- Match submissions per hour
- Challenge creation/acceptance rates
- API endpoint usage patterns
- Error rates by endpoint

### System Health
- `up` - Service availability (1=up, 0=down)
- `process_cpu_usage` - CPU usage
- `system_load_average_1m` - System load

## Tracing

### View Traces
1. Go to Grafana → Explore
2. Select "Tempo" datasource
3. Search by:
   - TraceID
   - Service name (rispo)
   - Duration
   - Tags

### Trace-to-Log Correlation
- Click on any span in Tempo
- Click "Logs for this span" to see related logs in Loki

## Alerting (Optional)

To set up alerts:
1. Go to Grafana → Alerting
2. Create alert rules based on metrics:
   - High error rate: `rate(http_server_requests_seconds_count{status=~"5.."}[5m]) > 0.1`
   - High latency: `histogram_quantile(0.95, ...) > 1.0`
   - Low success rate: `success_rate < 95`

## Troubleshooting

### Services not starting
```bash
# Check logs
docker-compose logs otel-collector
docker-compose logs prometheus
docker-compose logs grafana

# Restart specific service
docker-compose restart otel-collector
```

### No metrics in Grafana
1. Check application is exposing metrics: http://localhost:8080/actuator/prometheus
2. Check Prometheus is scraping: http://localhost:9090/targets
3. Verify datasource connection in Grafana

### Traces not appearing
1. Check OTLP endpoint is reachable from app container
2. Verify sampling rate in application.properties (should be 1.0 for testing)
3. Check OTel Collector logs: `docker-compose logs otel-collector`

### Logs not showing in Loki
1. Check Logback configuration in `src/main/resources/logback-spring.xml`
2. Verify Loki is reachable: http://localhost:3100/ready
3. Check app logs: `docker-compose logs app`

## Cost

All components are **100% free and open-source**:
- No licensing fees
- No cloud costs (self-hosted)
- Scales with your infrastructure

## Production Considerations

For production deployments:
1. **Storage**: Configure persistent storage with appropriate retention policies
2. **Security**: Enable authentication on all services (Prometheus, Tempo, Loki)
3. **Scaling**: Consider using distributed setups for high-volume environments
4. **Alerting**: Set up Alertmanager for Prometheus alerts
5. **Backup**: Regular backups of Prometheus, Tempo, and Loki data
6. **Resource Limits**: Adjust memory/CPU limits in docker-compose.yml based on load

## References

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Tempo Documentation](https://grafana.com/docs/tempo/)
- [Grafana Loki Documentation](https://grafana.com/docs/loki/)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
