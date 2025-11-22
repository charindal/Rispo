# Rispo Scaling Roadmap

## Target: 500K Players

### Phase 1: Optimize Monolith (0-100K players)
**Timeline: Next 2-3 months**

#### Infrastructure
- [ ] Add Redis for caching (player profiles , leaderboards, challenge lists)
- [ ] Setup RabbitMQ for async processing
- [ ] Configure database read replicas
- [ ] Add load balancer (nginx/HAProxy) for multiple app instances

#### Backend Optimizations
- [ ] Implement Redis caching layer
  - Player profile cache (TTL: 5 min)
  - Club player list cache (TTL: 10 min)
  - Challenge counts cache (TTL: 1 min)
- [ ] Move to async processing:
  - Rating calculations → Queue
  - Email notifications → Queue
  - Match acknowledgment reminders → Scheduled job
- [ ] Add database indexes (already started ✓)
- [ ] Implement pagination everywhere (limit 50 per page)

#### Frontend Optimizations
- [ ] Add WebSocket for real-time challenge notifications
- [ ] Implement virtual scrolling for large player lists
- [ ] Use CDN for static assets
- [ ] Add service worker for offline capabilities

#### Monitoring
- [ ] Setup Prometheus + Grafana
- [ ] Add application metrics (response times, queue lengths)
- [ ] Database query monitoring
- [ ] Alert thresholds for high load

**Expected Capacity: 100K concurrent users, 1000 challenges/sec**

---

### Phase 2: Horizontal Scaling (100K-300K players)
**Timeline: Month 4-6**

#### Infrastructure
- [ ] Deploy 3+ app instances behind load balancer
- [ ] Setup PostgreSQL clustering (primary + 2 read replicas)
- [ ] Add Redis cluster (3 nodes)
- [ ] Implement session stickiness or distributed sessions

#### Backend
- [ ] Add API rate limiting per user
- [ ] Implement circuit breakers for external services
- [ ] Database partitioning for matches table (by year/month)
- [ ] Optimize N+1 queries (use @EntityGraph)

#### Database Schema Changes
- [ ] Add materialized views for leaderboards
- [ ] Archive old matches (older than 2 years)
- [ ] Add time-series database for analytics (InfluxDB)

**Expected Capacity: 300K concurrent users, 3000 challenges/sec**

---

### Phase 3: Microservices (300K+ players)
**Timeline: Month 7-12 (if needed)**

#### Service Extraction (in order)
1. **Challenge Service** (highest traffic)
   - Own PostgreSQL database
   - Event-driven communication (Kafka)
   - Independent scaling
   
2. **Rating Engine Service**
   - Async rating calculations
   - Historical rating trends
   - Separate from main app

3. **Tournament Service**
   - Complex bracket generation
   - Tournament-specific logic
   - Own database

4. **Notification Service**
   - Email, push, in-app notifications
   - Template management

#### API Gateway
- [ ] Setup Kong/Envoy for routing
- [ ] Authentication at gateway level
- [ ] Request aggregation for frontend

#### Infrastructure
- [ ] Kubernetes for orchestration
- [ ] Service mesh (Istio/Linkerd)
- [ ] Distributed tracing (Jaeger)
- [ ] Centralized logging (ELK stack)

**Expected Capacity: 500K+ concurrent users, 10K+ challenges/sec**

---

## Quick Wins (Implement Now)

### 1. Add Redis Caching
```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis-data:/data
```

### 2. Async Rating Processing
Move rating calculations to background jobs instead of synchronous processing

### 3. Database Connection Pool Tuning
```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=20000
```

### 4. Add Indexes (Already Started ✓)
- `idx_player_club_verified` ✓
- `idx_challenge_status_created` (for pagination)
- `idx_match_players_status` (for player match history)

---

## Cost Estimation

### Current (Monolith)
- 1 app server: $50/month
- 1 database: $100/month
- **Total: ~$150/month**

### Phase 1 (Optimized Monolith)
- 3 app servers: $150/month
- 1 primary + 2 read replica DB: $300/month
- Redis cluster: $50/month
- Load balancer: $20/month
- **Total: ~$520/month**

### Phase 3 (Microservices)
- Kubernetes cluster: $300/month
- 10+ service instances: $500/month
- Multiple databases: $600/month
- Message queue: $100/month
- Monitoring stack: $100/month
- **Total: ~$1,600/month**

---

## Decision Points

**Stay Monolith If:**
- < 100K active users
- < 500 challenges/sec
- Response times < 200ms
- Database CPU < 70%

**Move to Microservices If:**
- > 300K active users
- Database becomes bottleneck even with replicas
- Need independent deployment of services
- Team grows to 20+ developers

---

## Monitoring Thresholds

### Red Alerts (Scale Now)
- API response time p95 > 1s
- Database CPU > 80%
- Queue depth > 10,000
- Memory usage > 90%

### Yellow Alerts (Plan Scaling)
- API response time p95 > 500ms
- Database CPU > 60%
- Cache hit rate < 70%
- Error rate > 1%
