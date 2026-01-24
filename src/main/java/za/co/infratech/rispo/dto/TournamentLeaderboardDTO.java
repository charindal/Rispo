package za.co.infratech.rispo.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentLeaderboardDTO {
    
    private Long playerId;
    private String playerName;
    private String username;
    private Integer totalPoints;
    private Integer tournamentCount;
    private Integer winCount;
    private Integer runnerUpCount;
    private Integer semifinalCount;
    private Integer quarterfinalCount;
    private Integer rank;
    private String bestFinish;
}