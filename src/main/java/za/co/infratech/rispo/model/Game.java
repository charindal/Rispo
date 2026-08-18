package za.co.infratech.rispo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import za.co.infratech.rispo.dto.enums.GameResult;

import java.time.LocalDateTime;

@Entity
@Table(name = "game")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "player1_id")
    private Player player1;

    @ManyToOne(optional = false)
    @JoinColumn(name = "player2_id")
    private Player player2;

    @ManyToOne
    @JoinColumn(name = "match_id")
    private Match match;

    @Enumerated(EnumType.STRING)
    private GameResult result;

    @Enumerated(EnumType.STRING)
    @Column(name = "result_type", nullable = false)
    private GameResultType resultType = GameResultType.COMPLETED;

    @ManyToOne
    @JoinColumn(name = "winner_id")
    private Player winner;

    @Column(name = "player1_score")
    private Integer player1Score;

    @Column(name = "player2_score")
    private Integer player2Score;

    @Column(name = "game_number")
    private Integer gameNumber;

    @CreationTimestamp
    @Column(name = "date_played")
    private LocalDateTime datePlayed;

    public enum GameResultType {
        COMPLETED,
        NO_RESULT,
        ABANDONED,
        CANCELLED
    }
}
