package za.co.infratech.rispo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PlayerDTO {
    private Long id;
    private Long userId;
    private String name;
    private String realName;
    private String email;
    private String phone;
    private Integer rating;
    private Integer matchesPlayed;
    private Integer gamesPlayed;
    private Integer wins;
    private Integer losses;
    private Integer draws;
    private Boolean isVerified;
    private String verifiedBy;
    private String verifiedAt;
    private String createdAt;
}
