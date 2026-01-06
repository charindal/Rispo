package za.co.infratech.rispo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentResponse {
    private Long id;
    private Long tournamentId; // Alias for frontend compatibility
    private String name;
    private String description;
    private LocalDate startDate;
    private String status;
    private String format; // SWISS, KNOCKOUT, ROUND_ROBIN, or RANDOM
    private Long createdById;
    private String createdByUsername;
    private Long clubId;
    private String clubName;
    private Integer maxParticipants;
    private Integer minParticipants; // Minimum participants required to start
    private Integer currentParticipants;
    private Integer pendingRequests;
    private String venue;
    private String rules;
    private Integer totalRounds; // Number of rounds for Swiss/Random tournaments
    private Integer currentRound; // Current round number
    private Boolean everyonePlaysEveryone; // For RANDOM format
    private Boolean canStart; // True if minimum participants met
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime closedAt; // When the tournament was closed/completed
}
