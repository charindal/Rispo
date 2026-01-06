package za.co.infratech.rispo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentPlayerResponse {
    private Long tournamentId;
    private String tournamentName;
    private Long playerId;
    private String playerName;
    private Integer playerRating;
    private String status;
    private LocalDateTime requestedAt;
    private LocalDateTime respondedAt;
    private Long respondedById;
    private String respondedByUsername;
}
