package za.co.infratech.rispo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private Long userId;
    private String username;
    private String email;
    private String role;
    private Long playerId;
    private Boolean isVerified;
    private Boolean mustChangePassword;
    private String message;
    private String token;
}
