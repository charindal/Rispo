package za.co.infratech.rispo.model;

import jakarta.persistence.*;
import lombok.*;
import za.co.infratech.rispo.dto.enums.MatchResult;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "match")
public class Match {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "player1_id", nullable = false)
    private Player player1;

    @ManyToOne
    @JoinColumn(name = "player2_id", nullable = false)
    private Player player2;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false)
    private MatchResult result;

    @ManyToOne
    @JoinColumn(name = "winner_id")
    private Player winner;  // nullable if draw

    private LocalDateTime datePlayed;

    private Integer player1RatingChange;
    private Integer player2RatingChange;
}
