package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class MatchRequest {
    private Long player1Id;
    private Long player2Id;
    private Long winnerId;
}

