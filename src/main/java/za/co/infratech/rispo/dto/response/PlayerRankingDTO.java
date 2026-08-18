package za.co.infratech.rispo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlayerRankingDTO {
    private Long id;
    private Long userId;
    private String name;
    private Integer rating;
    private Integer matchesPlayed;
    private Integer wins;
    private Integer losses;
    private Integer draws;
    private Integer rank;
    private Boolean isCurrentUser;
}
