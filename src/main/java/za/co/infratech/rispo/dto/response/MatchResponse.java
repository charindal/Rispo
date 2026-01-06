package za.co.infratech.rispo.dto.response;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class MatchResponse {
    private Long matchId;
    private Long player1Id;
    private Long player2Id;
    private PlayerSummary player1;
    private PlayerSummary player2;
    private PlayerSummary winner;
    private String status;
    private Boolean isRated;
    private Long challengeId;
    private Long tournamentId;
    private Integer round;
    private Integer player1RatingBefore;
    private Integer player2RatingBefore;
    private Integer player1RatingAfter;
    private Integer player2RatingAfter;
    private Integer player1RatingChange;
    private Integer player2RatingChange;
    private LocalDateTime submittedAt;
    private String submittedBy;
    private LocalDateTime reviewedAt;
    private String reviewedBy;
    private String reviewNotes;
    private List<GameSummary> games;

    @Data
    public static class PlayerSummary {
        private Long playerId;
        private String name;
        private Integer rating;
        private String email;
    }

    @Data
    public static class GameSummary {
        private Long gameId;
        private Integer gameNumber;
        private Integer player1Score;
        private Integer player2Score;
        private String resultType;
        private Long winnerId;
        private String winnerName;
    }
}
