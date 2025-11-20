package za.co.infratech.rispo.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PlayerFlagResponse {
    private Long flagId;
    private Long playerId;
    private String playerName;
    private Long matchId;
    private String flagType;
    private String description;
    private LocalDateTime flaggedAt;
    private String flaggedByName;
    private Boolean resolved;
    private LocalDateTime resolvedAt;
    private String resolvedByName;
    private String resolutionNotes;
}
