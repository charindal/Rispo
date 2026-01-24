package za.co.infratech.rispo.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import za.co.infratech.rispo.entity.KnockoutTournament;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class KnockoutTournamentDTO {
    
    private Long id;
    private Long clubId;
    private String tournamentName;
    private Integer tournamentYear;
    private Integer weekNumber;
    private Integer sequenceNumber;
    private KnockoutTournament.TournamentStatus status;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endDate;
    
    private Long winnerPlayerId;
    private String winnerPlayerName;
    private Long runnerUpPlayerId;
    private String runnerUpPlayerName;
    private String semifinalists;
    private String quarterfinalists;
    private String bracketData;
    private Integer participantCount;
    private KnockoutTournament.DrawType drawType;
    private Integer currentRound;
    private Boolean round1Generated;
    private Boolean round1Started;
    private Boolean allowRound1Regenerate;
    
    // Constructor from entity
    public KnockoutTournamentDTO(KnockoutTournament tournament) {
        this.id = tournament.getId();
        this.clubId = tournament.getClubId();
        this.tournamentName = tournament.getTournamentName();
        this.tournamentYear = tournament.getTournamentYear();
        this.weekNumber = tournament.getWeekNumber();
        this.sequenceNumber = tournament.getSequenceNumber();
        this.status = tournament.getStatus();
        this.createdDate = tournament.getCreatedDate();
        this.startDate = tournament.getStartDate();
        this.endDate = tournament.getEndDate();
        this.winnerPlayerId = tournament.getWinnerPlayerId();
        this.runnerUpPlayerId = tournament.getRunnerUpPlayerId();
        this.semifinalists = tournament.getSemifinalists();
        this.quarterfinalists = tournament.getQuarterfinalists();
        this.bracketData = tournament.getBracketData();
        this.drawType = tournament.getDrawType();
        this.currentRound = tournament.getCurrentRound();
        this.round1Generated = tournament.getRound1Generated();
        this.round1Started = tournament.getRound1Started();
        this.allowRound1Regenerate = tournament.getAllowRound1Regenerate();
    }
}