package za.co.infratech.rispo.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "knockout_tournament")
@Data
@NoArgsConstructor
@AllArgsConstructor
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
    
    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber = 1; // Allows multiple tournaments per week/day
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private TournamentStatus status = TournamentStatus.UPCOMING;
    
    @Column(name = "current_round")
    private Integer currentRound = 0;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_date")
    private LocalDateTime createdDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "start_date")
    private LocalDateTime startDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "end_date")
    private LocalDateTime endDate;
    
    @Column(name = "winner_player_id")
    private Long winnerPlayerId;
    
    @Column(name = "runner_up_player_id")
    private Long runnerUpPlayerId;
    
    @Column(name = "semifinalists", columnDefinition = "TEXT")
    private String semifinalists; // JSON array of player IDs
    
    @Column(name = "quarterfinalists", columnDefinition = "TEXT")
    private String quarterfinalists; // JSON array of player IDs
    
    @Column(name = "bracket_data", columnDefinition = "TEXT")
    private String bracketData; // JSON representation of bracket structure
    
    @Enumerated(EnumType.STRING)
    @Column(name = "draw_type", nullable = false)
    private DrawType drawType = DrawType.RANDOM;
    
    @Column(name = "round_1_generated")
    private Boolean round1Generated = false;
    
    @Column(name = "round_1_started")
    private Boolean round1Started = false;
    
    @Column(name = "allow_round_1_regenerate")
    private Boolean allowRound1Regenerate = true;
    
    @PrePersist
    protected void onCreate() {
        if (createdDate == null) {
            createdDate = LocalDateTime.now();
        }
        if (tournamentName == null || tournamentName.isEmpty()) {
            tournamentName = "Weekly Tournament - Week " + weekNumber + ", " + tournamentYear;
        }
    }
    
    public enum TournamentStatus {
        UPCOMING, IN_PROGRESS, COMPLETED
    }
    
    public enum DrawType {
        RANDOM, SEEDED
    }
}