package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class UserRegisterRequest {
    private String username;
    private String password;
    private String role; // PLAYER, RATING_ADMIN, SYSTEM_ADMIN
}
