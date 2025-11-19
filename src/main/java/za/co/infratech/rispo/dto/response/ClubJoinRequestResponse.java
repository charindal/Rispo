package za.co.infratech.rispo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubJoinRequestResponse {
    private Long requestId;
    private Long playerId;
    private String playerName;
    private Long clubId;
    private String clubName;
    private String status;
    private String message;
    private LocalDateTime requestedAt;
    private String reviewedByUsername;
    private LocalDateTime reviewedAt;
    private String reviewNotes;
}
