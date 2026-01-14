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
    private Integer challengerRating;
    private Long challengedId;
    private String challengedName;
    private Integer challengedRating;
    private String challengeName;
    private String status;
    private String message;
    private String format;
    private LocalDateTime dateOfMatch;
    private String timeOfMatch;
    private Double pot;
    private String venue;
    private Long matchId;
    private Boolean matchSubmitted;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
    private LocalDateTime expiresAt;
}
