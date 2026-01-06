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
    private LocalDate endDate;
    private String status;
    private String format; // SWISS or KNOCKOUT
    private Long createdById;
    private String createdByUsername;
    private Long clubId;
    private String clubName;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private Integer pendingRequests;
    private String venue;
    private String rules;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
