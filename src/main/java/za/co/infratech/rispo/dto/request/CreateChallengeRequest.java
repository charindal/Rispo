package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class CreateChallengeRequest {
    private Long challengedPlayerId;
    private String challengeName;
    private String message;
}
