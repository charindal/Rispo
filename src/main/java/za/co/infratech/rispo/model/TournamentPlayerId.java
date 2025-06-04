package za.co.infratech.rispo.model;

import lombok.*;
import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentPlayerId implements Serializable {
    private Long tournament;
    private Long player;
}
