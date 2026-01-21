# Backend Implementation: Knockout Tournament System

## Overview
This document outlines the backend implementation required for the club knockout tournament system. The frontend has been completed and requires these backend endpoints and database schema.

## Database Schema

### KnockoutTournament Table
```sql
CREATE TABLE knockout_tournament (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    club_id BIGINT NOT NULL,
    tournament_name VARCHAR(255) NOT NULL,
    tournament_year INT NOT NULL,
    week_number INT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UPCOMING',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    winner_player_id BIGINT,
    runner_up_player_id BIGINT,
    semifinalists TEXT, -- JSON array of player IDs
    quarterfinalists TEXT, -- JSON array of player IDs
    bracket_data TEXT, -- JSON representation of bracket structure
    FOREIGN KEY (club_id) REFERENCES club(id),
    FOREIGN KEY (winner_player_id) REFERENCES player(id),
    FOREIGN KEY (runner_up_player_id) REFERENCES player(id),
    INDEX idx_club_year (club_id, tournament_year),
    INDEX idx_club_week (club_id, tournament_year, week_number)
);
```

### TournamentPointsConfig Table
```sql
CREATE TABLE tournament_points_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    club_id BIGINT NOT NULL UNIQUE,
    winner_points INT DEFAULT 5,
    runner_up_points INT DEFAULT 3,
    semifinalist_points INT DEFAULT 2,
    quarterfinalist_points INT DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (club_id) REFERENCES club(id)
);
```

### PlayerTournamentPoints Table
```sql
CREATE TABLE player_tournament_points (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    player_id BIGINT NOT NULL,
    club_id BIGINT NOT NULL,
    tournament_id BIGINT NOT NULL,
    tournament_year INT NOT NULL,
    points_earned INT NOT NULL,
    position_achieved VARCHAR(50) NOT NULL, -- WINNER, RUNNER_UP, SEMIFINALIST, QUARTERFINALIST
    date_earned TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES player(id),
    FOREIGN KEY (club_id) REFERENCES club(id),
    FOREIGN KEY (tournament_id) REFERENCES knockout_tournament(id),
    INDEX idx_player_club_year (player_id, club_id, tournament_year),
    INDEX idx_club_year_points (club_id, tournament_year, points_earned DESC)
);
```

## Required Endpoints

### 1. Get Club Knockout Tournaments
```
GET /api/clubs/{clubId}/knockout-tournaments
```
**Purpose:** Retrieve all knockout tournaments for a club, with optional year filter
**Response:** List of tournaments with their status, bracket data, and results

### 2. Create Weekly Knockout Tournament
```
POST /api/clubs/{clubId}/knockout-tournaments/weekly
Headers: X-User-Id: {userId}
```
**Purpose:** Create a new weekly knockout tournament with random draw from active club members
**Logic:**
- Get all active club members
- Create bracket structure based on number of participants (nearest power of 2)
- Randomly assign players to bracket positions
- Set tournament status to UPCOMING
- Return tournament with bracket structure

### 3. Get Tournament Leaderboard
```
GET /api/clubs/{clubId}/tournament-leaderboard?year={year}
```
**Purpose:** Get accumulated points leaderboard for the club
**Response:** List of players with their total points, tournaments participated, positions achieved

### 4. Update Tournament Points Configuration
```
PUT /api/clubs/{clubId}/tournament-points-config
Headers: X-User-Id: {userId}
Body: {
    "winner": 5,
    "runnerUp": 3,
    "semifinalist": 2,
    "quarterfinalist": 1
}
```
**Purpose:** Update the point values for different tournament positions

### 5. Get Tournament Points Configuration
```
GET /api/clubs/{clubId}/tournament-points-config
```
**Purpose:** Retrieve current point configuration for the club

## Java Implementation Structure

### Entity Classes

#### KnockoutTournament.java
```java
@Entity
@Table(name = "knockout_tournament")
public class KnockoutTournament {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "club_id", nullable = false)
    private Long clubId;
    
    @Column(name = "tournament_name", nullable = false)
    private String tournamentName;
    
    @Column(name = "tournament_year", nullable = false)
    private Integer tournamentYear;
    
    @Column(name = "week_number", nullable = false)
    private Integer weekNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TournamentStatus status = TournamentStatus.UPCOMING;
    
    @Column(name = "created_date")
    private LocalDateTime createdDate;
    
    @Column(name = "start_date")
    private LocalDateTime startDate;
    
    @Column(name = "end_date")
    private LocalDateTime endDate;
    
    @Column(name = "winner_player_id")
    private Long winnerPlayerId;
    
    @Column(name = "runner_up_player_id")
    private Long runnerUpPlayerId;
    
    @Column(name = "semifinalists", columnDefinition = "TEXT")
    private String semifinalists; // JSON array
    
    @Column(name = "quarterfinalists", columnDefinition = "TEXT")
    private String quarterfinalists; // JSON array
    
    @Column(name = "bracket_data", columnDefinition = "TEXT")
    private String bracketData; // JSON representation
    
    // Getters, setters, constructors
}

enum TournamentStatus {
    UPCOMING, IN_PROGRESS, COMPLETED
}
```

#### TournamentPointsConfig.java
```java
@Entity
@Table(name = "tournament_points_config")
public class TournamentPointsConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "club_id", unique = true, nullable = false)
    private Long clubId;
    
    @Column(name = "winner_points")
    private Integer winnerPoints = 5;
    
    @Column(name = "runner_up_points")
    private Integer runnerUpPoints = 3;
    
    @Column(name = "semifinalist_points")
    private Integer semifinalistPoints = 2;
    
    @Column(name = "quarterfinalist_points")
    private Integer quarterfinalistPoints = 1;
    
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
    
    // Getters, setters, constructors
}
```

### Controller Class

#### KnockoutTournamentController.java
```java
@RestController
@RequestMapping("/api/clubs")
@CrossOrigin(origins = {"http://localhost:3000", "http://135.125.133.211"})
public class KnockoutTournamentController {
    
    @Autowired
    private KnockoutTournamentService tournamentService;
    
    @GetMapping("/{clubId}/knockout-tournaments")
    public ResponseEntity<List<KnockoutTournamentDTO>> getClubTournaments(
            @PathVariable Long clubId,
            @RequestParam(required = false) Integer year) {
        // Implementation
    }
    
    @PostMapping("/{clubId}/knockout-tournaments/weekly")
    public ResponseEntity<KnockoutTournamentDTO> createWeeklyTournament(
            @PathVariable Long clubId,
            @RequestHeader("X-User-Id") Long userId) {
        // Implementation
    }
    
    @GetMapping("/{clubId}/tournament-leaderboard")
    public ResponseEntity<List<TournamentLeaderboardDTO>> getLeaderboard(
            @PathVariable Long clubId,
            @RequestParam(required = false) Integer year) {
        // Implementation
    }
    
    @PUT("/{clubId}/tournament-points-config")
    public ResponseEntity<TournamentPointsConfig> updatePointsConfig(
            @PathVariable Long clubId,
            @RequestBody TournamentPointsConfig config,
            @RequestHeader("X-User-Id") Long userId) {
        // Implementation
    }
    
    @GetMapping("/{clubId}/tournament-points-config")
    public ResponseEntity<TournamentPointsConfig> getPointsConfig(
            @PathVariable Long clubId) {
        // Implementation
    }
}
```

## Service Layer Logic

### Key Business Logic

1. **Random Draw Algorithm**: When creating a tournament, randomly shuffle active club members and assign to bracket positions
2. **Bracket Generation**: Create bracket structure based on participant count (round up to nearest power of 2)
3. **Points Calculation**: When tournament is completed, calculate and award points based on final positions
4. **Leaderboard Aggregation**: Sum up points across all tournaments for annual ranking

### Sample Bracket Generation Logic
```java
public BracketStructure generateBracket(List<Player> players) {
    // Round up to nearest power of 2
    int bracketSize = Integer.highestOneBit(players.size() - 1) * 2;
    if (bracketSize < players.size()) bracketSize *= 2;
    
    // Shuffle players randomly
    Collections.shuffle(players);
    
    // Create bracket structure
    BracketStructure bracket = new BracketStructure(bracketSize);
    for (int i = 0; i < players.size(); i++) {
        bracket.setPlayer(i, players.get(i));
    }
    
    return bracket;
}
```

## Testing Considerations

1. **Tournament Creation**: Test with various member counts (powers of 2 and non-powers of 2)
2. **Point Configuration**: Test updating and retrieving point configurations
3. **Leaderboard**: Test point aggregation across multiple tournaments
4. **Weekly Recurrence**: Test creating multiple tournaments in same year
5. **Permission Validation**: Ensure only club admins can create tournaments and update configurations

## Integration Notes

- The frontend ClubTournaments component expects specific data structures
- All date fields should be returned in ISO format for proper frontend parsing
- Error responses should include meaningful messages for user feedback
- Consider implementing pagination for tournaments and leaderboard if clubs have many tournaments

## Next Steps

1. Implement the database schema
2. Create the entity classes
3. Implement the service layer with business logic
4. Create the controller endpoints
5. Test the integration with the existing frontend
6. Add proper error handling and validation