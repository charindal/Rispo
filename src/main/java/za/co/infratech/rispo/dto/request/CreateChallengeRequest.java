package za.co.infratech.rispo.dto.request;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CreateChallengeRequest {
    private Long challengedPlayerId;
    private String challengeName;
    private String message;
    private String format; // e.g., "Race to 7", "Race to 9"
    private LocalDateTime dateOfMatch;
    private String timeOfMatch; // e.g., "14:00", "7:00 PM"
    private java.math.BigDecimal pot; // Total amount to be won
    private String venue; // Place and area where match is happening
}
