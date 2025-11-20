package za.co.infratech.rispo.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChallengeResponse {
    private Long challengeId;
    private Long challengerId;
    private String challengerName;
    private Long challengedId;
    private String challengedName;
    private String challengeName;
    private String status;
    private String message;
    private Long matchId;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
    private LocalDateTime expiresAt;
}
