package za.co.infratech.rispo.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "player_tournament_points")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlayerTournamentPoints {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "player_id", nullable = false)
    private Long playerId;
    
    @Column(name = "club_id", nullable = false)
    private Long clubId;
    
    @Column(name = "tournament_id", nullable = false)
    private Long tournamentId;
    
    @Column(name = "tournament_year", nullable = false)
    private Integer tournamentYear;
    
    @Column(name = "points_earned", nullable = false)
    private Integer pointsEarned;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "position_achieved", nullable = false)
    private TournamentPosition positionAchieved;
    
    @Column(name = "date_earned")
    private LocalDateTime dateEarned;
    
    @PrePersist
    protected void onCreate() {
        if (dateEarned == null) {
            dateEarned = LocalDateTime.now();
        }
    }
    
    public enum TournamentPosition {
        WINNER, RUNNER_UP, SEMIFINALIST, QUARTERFINALIST
    }
}