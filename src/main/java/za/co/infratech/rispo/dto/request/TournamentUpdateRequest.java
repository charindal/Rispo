package za.co.infratech.rispo.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class TournamentUpdateRequest {
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer maxParticipants;
    private String venue;
    private String rules;
}
