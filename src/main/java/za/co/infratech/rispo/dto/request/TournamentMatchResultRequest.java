package za.co.infratech.rispo.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class TournamentMatchResultRequest {
    private Long winnerId; // Null for draw
    private List<GameResultRequest> games;
    private Boolean approve; // If true, also approve the match

    @Data
    public static class GameResultRequest {
        private Integer player1Score;
        private Integer player2Score;
        private String resultType; // COMPLETED, NO_RESULT, ABANDONED, CANCELLED
        private Long winnerId; // Null for draw
    }
}
