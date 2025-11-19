package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class GenerateTokenRequest {
    private Long clubId;
    private String role; // CLUB_ADMIN or RATING_ADMIN
    private Integer validityDays = 30; // Token validity in days
}
