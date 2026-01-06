package za.co.infratech.rispo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@IdClass(TournamentPlayerId.class)
@Table(name = "tournament_player")
public class TournamentPlayer {

    @Id
    @ManyToOne
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;

    @Id
    @ManyToOne
    @JoinColumn(name = "player_id")
    private Player player;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    private LocalDateTime requestedAt = LocalDateTime.now();
    private LocalDateTime respondedAt;

    @ManyToOne
    @JoinColumn(name = "responded_by")
    private UserEntity respondedBy;
}

