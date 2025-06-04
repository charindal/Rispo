package za.co.infratech.rispo.dto.response;

import lombok.Data;

@Data
public class MatchResponse {
    private Long id;
    private Long player1Id;
    private Long player2Id;
    private Long winnerId;
    private int player1RatingChange;
    private int player2RatingChange;
}
