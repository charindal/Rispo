package za.co.infratech.rispo.dto.request;

import lombok.Data;
import za.co.infratech.rispo.dto.enums.MatchResult;

import java.time.LocalDateTime;

@Data
public class MatchRequest {
    private Long player1Id;
    private Long player2Id;
    private MatchResult result;
    private LocalDateTime datePlayed;
}

