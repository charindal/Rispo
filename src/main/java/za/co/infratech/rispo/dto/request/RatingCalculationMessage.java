package za.co.infratech.rispo.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingCalculationMessage {
    private Long matchId;
    private Long player1Id;
    private Long player2Id;
    private Long winnerId;
    private String calculationType; // "MATCH_SUBMIT" or "MATCH_ACKNOWLEDGE"
}
