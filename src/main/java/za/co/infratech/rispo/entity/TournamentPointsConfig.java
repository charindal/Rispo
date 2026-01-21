package za.co.infratech.rispo.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "tournament_points_config")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentPointsConfig {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "club_id", unique = true, nullable = false)
    private Long clubId;
    
    @Column(name = "winner_points", nullable = false)
    private Integer winnerPoints = 5;
    
    @Column(name = "runner_up_points", nullable = false)
    private Integer runnerUpPoints = 3;
    
    @Column(name = "semifinalist_points", nullable = false)
    private Integer semifinalistPoints = 2;
    
    @Column(name = "quarterfinalist_points", nullable = false)
    private Integer quarterfinalistPoints = 1;
    
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;
    
    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}