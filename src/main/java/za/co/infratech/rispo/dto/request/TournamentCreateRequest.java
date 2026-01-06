package za.co.infratech.rispo.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class TournamentCreateRequest {
    private String name;
    private String description;
    private LocalDate startDate;
    private Long clubId;
    private Integer maxParticipants;
    private Integer minParticipants; // Minimum participants required to start
    private String venue;
    private String rules;
    private String format; // SWISS, KNOCKOUT, ROUND_ROBIN, or RANDOM
    private Integer totalRounds; // Number of rounds for Swiss/Random tournaments
    private Boolean everyonePlaysEveryone; // For RANDOM format: true = everyone plays everyone
}
