# Rispo Application - Clean Slate

## Cleanup Completed ✓

The application has been cleaned up and simplified. Here's what remains:

### Backend (Java Spring Boot)
**Kept:**
- `RispoApplication.java` - Main Spring Boot application
- **Models** (7 entities matching the database schema):
  - `UserEntity.java`
  - `Player.java`
  - `Game.java`
  - `Match.java`
  - `Tournament.java`
  - `TournamentPlayer.java`
  - `TournamentPlayerId.java`
- **Repositories** (5 repositories):
  - `UserRepository.java`
  - `PlayerRepository.java`
  - `GameRepository.java`
  - `MatchRepository.java`
  - `TournamentRepository.java`
- **Database Migration**: `V4__init_schema.sql` (preserved)

**Removed:**
- All controllers
- All DTOs (request/response)
- All services
- All config files (SecurityConfig, WebConfig, RouterConfig)
- All security implementations
- All utility classes
- Integration tests

### Frontend (React)
**Kept:**
- Minimal `App.js` (clean starter)
- `index.js` (simplified)
- `index.css` (basic styles)
- `public/` folder with index.html

**Removed:**
- All pages (LandingPage, LoginPage, RegisterPage, UserProfilePage)
- All components
- All services
- All custom CSS
- reportWebVitals, setupTests

### Infrastructure
**Simplified:**
- `Dockerfile` - Multi-stage build (React + Spring Boot, no telemetry)
- `docker-compose.yml` - Only PostgreSQL and app service
- `application.properties` - Basic PostgreSQL configuration

**Removed:**
- All telemetry configuration (OpenTelemetry, Prometheus, Grafana)
- telemetry/ folder

## Database Schema (Preserved)

The application maintains the following database structure:
- **users** - User authentication and roles (PLAYER, RATING_ADMIN, SYSTEM_ADMIN)
- **player** - Player profiles with ratings and statistics
- **tournament** - Tournament information
- **tournament_player** - Many-to-many relationship between tournaments and players
- **match** - Matches within tournaments
- **game** - Individual games (can be part of a match or standalone)

## Current Configuration

### Database Connection
- **URL**: jdbc:postgresql://localhost:5433/rispo
- **Username**: rispo_admin
- **Password**: R!#po123##

### Ports
- **Application**: 8080
- **Database**: 5433 (mapped from container's 5432)

## Ready to Build

The application is now in a clean state, ready for fresh development based on the existing database schema. All models and repositories are in place and mapped to the database tables.

## Next Steps
Awaiting further instructions to build the application...
