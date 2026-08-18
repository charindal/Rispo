package za.co.infratech.rispo.dto.response;

import lombok.Data;

@Data
public class UserProfileResponse {
    private Long userId;
    private String username;
    private String email;
    private String nationalId;
    private String role;

    // Player profile fields
    private Long playerId;
    private String name;
    private String realName;
    private String phone;
    private Integer rating;
    private Boolean isVerified;
}
