package za.co.infratech.rispo.model;

import jakarta.persistence.*;
import lombok.*;

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
}

