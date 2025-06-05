package za.co.infratech.rispo.dto.response;

import lombok.Data;

@Data
public class PlayerResponse {
    private Long id;
    private String name;
    private int rating;
    private int matchesPlayed;
    private int wins;
    private int losses;
    private int draws;
}
