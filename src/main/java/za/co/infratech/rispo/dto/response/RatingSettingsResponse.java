package za.co.infratech.rispo.dto.response;

import lombok.Data;

@Data
public class RatingSettingsResponse {
    private Long id;
    private Integer provisionalGamesCount;
    private Integer provisionalKFactor;
    private Integer establishedKFactor;
    private Integer minRating;
    private Integer maxRating;
    private Integer defaultRating;
    private String updatedBy;
    private String updatedAt;
}
