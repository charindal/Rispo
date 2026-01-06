package za.co.infratech.rispo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tournament")
public class Tournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private LocalDate startDate;

    @Column(nullable = false)
    private String status = "DRAFT"; // DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED

    @Enumerated(EnumType.STRING)
    @Column(name = "format", nullable = false)
    private TournamentFormat format = TournamentFormat.SWISS;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private UserEntity createdBy;

    @ManyToOne
    @JoinColumn(name = "club_id")
    private Club club;

    private Integer maxParticipants;
    private Integer minParticipants; // Minimum participants required to start
    private String venue;
    private String rules;
    private Integer totalRounds; // Number of rounds for Swiss/Random tournaments
    private Boolean everyonePlaysEveryone; // For RANDOM format: true = everyone plays everyone, false = fixed rounds

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();
    
    private LocalDateTime closedAt; // When the tournament was closed/completed

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TournamentPlayer> tournamentPlayers = new HashSet<>();

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum TournamentFormat {
        SWISS,       // Swiss-system: Players paired by score/rating, no elimination
        KNOCKOUT,    // Single-elimination: Players compete in brackets until one winner remains
        ROUND_ROBIN, // Round-robin: Every player plays against every other player
        RANDOM       // Random pairing: Players are randomly paired, no rating seeding
    }
}

