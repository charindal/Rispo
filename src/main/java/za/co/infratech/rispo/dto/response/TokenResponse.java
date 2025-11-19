package za.co.infratech.rispo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse {
    private Long tokenId;
    private String token;
    private Long clubId;
    private String clubName;
    private String role;
    private Boolean isUsed;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private String usedByUsername;
}
