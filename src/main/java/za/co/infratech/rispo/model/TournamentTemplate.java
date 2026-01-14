package za.co.infratech.rispo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "tournament_template")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TournamentTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long templateId;
    
    @Column(nullable = false)
    private String templateName;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private String tournamentType; // SWISS, ROUND_ROBIN, SINGLE_ELIMINATION, DOUBLE_ELIMINATION
    
    private Integer minPlayers;
    
    private Integer maxPlayers;
    
    private Integer numberOfRounds;
    
    private String scoringSystem; // MATCH_WINS, GAME_WINS, POINTS
    
    private String timeControl; // e.g., "10 minutes per frame", "30 minutes per match"
    
    @Column(columnDefinition = "TEXT")
    private String rules; // Additional tournament rules
    
    private Integer pointsForWin;
    
    private Integer pointsForDraw;
    
    private Integer pointsForLoss;
    
    private Boolean allowTieBreaks;
    
    private String tieBreakMethod; // BUCHHOLZ, MEDIAN_BUCHHOLZ, HEAD_TO_HEAD, etc.
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
