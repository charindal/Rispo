package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String email;
    private String nationalId;
    private String name;
    private String phone;
    private String role; // PLAYER, CLUB_ADMIN, RATING_ADMIN, SYSTEM_ADMIN
    private String adminToken; // Required for admin roles
    private Long clubId; // Optional club affiliation
    private Boolean createPlayerProfile = false; // For admins who want player profiles
}
