package za.co.infratech.rispo.dto.response;

import lombok.Data;
import za.co.infratech.rispo.dto.enums.MatchResult;

import java.time.LocalDateTime;

@Data
public class MatchResponse {
    private Long id;
    private Long player1Id;
    private Long player2Id;
    private MatchResult result;
    private Long winnerId; // null if draw
    private int player1RatingChange;
    private int player2RatingChange;
    private LocalDateTime datePlayed;

    public MatchResponse(Long id, Long id1, Long id2, MatchResult result, Long aLong, int player1Change, int player2Change, LocalDateTime datePlayed) {
    }
}

