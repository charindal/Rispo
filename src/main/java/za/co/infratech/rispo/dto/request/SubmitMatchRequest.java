package za.co.infratech.rispo.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class SubmitMatchRequest {
    private Long opponentPlayerId;
    private Long challengeId; // Optional - if this match is from a challenge
    private List<GameResultRequest> games;

    @Data
    public static class GameResultRequest {
        private Integer player1Score;
        private Integer player2Score;
        private String resultType; // COMPLETED, NO_RESULT, ABANDONED, CANCELLED
        private Long winnerId; // Null for draw
    }
}
