package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class UpdateRatingSettingsRequest {
    private Integer provisionalGamesCount;
    private Integer provisionalKFactor;
    private Integer establishedKFactor;
    private Integer minRating;
    private Integer maxRating;
    private Integer defaultRating;
}
