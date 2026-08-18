package za.co.infratech.rispo.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class SubmitMatchRequest {
    private Long player1Id;
    private Long player2Id;
    private Long winnerId; // Null for draw
    private Integer round;
    private List<GameResultRequest> games;

    @Data
    public static class GameResultRequest {
        private Integer player1Score;
        private Integer player2Score;
        private String resultType; // COMPLETED, NO_RESULT, ABANDONED, CANCELLED
        private Long winnerId; // Null for draw
    }
}
