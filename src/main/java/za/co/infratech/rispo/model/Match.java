package za.co.infratech.rispo.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import za.co.infratech.rispo.dto.enums.MatchResult;

import java.time.LocalDateTime;

@Entity
@Table(name = "match")
@Data
@NoArgsConstructor
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player1_id", nullable = false)
    private Player player1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player2_id", nullable = false)
    private Player player2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id")
    private Player winner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MatchResult result = MatchResult.PLAYER1_WIN;

    @Column(name = "date_played", nullable = false)
    private LocalDateTime datePlayed;

    @Column(name = "player1_rating_change")
    private Integer player1RatingChange;

    @Column(name = "player2_rating_change")
    private Integer player2RatingChange;
}
