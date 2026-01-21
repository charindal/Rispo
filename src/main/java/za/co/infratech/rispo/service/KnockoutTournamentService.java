package za.co.infratech.rispo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.infratech.rispo.dto.KnockoutTournamentDTO;
import za.co.infratech.rispo.dto.TournamentLeaderboardDTO;
import za.co.infratech.rispo.entity.*;
import za.co.infratech.rispo.model.Player;
import za.co.infratech.rispo.repository.*;

import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class KnockoutTournamentService {
    
    @Autowired
    private KnockoutTournamentRepository tournamentRepository;
    
    @Autowired
    private TournamentPointsConfigRepository pointsConfigRepository;
    
    @Autowired
    private PlayerTournamentPointsRepository playerPointsRepository;
    
    @Autowired
    private PlayerRepository playerRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    public List<KnockoutTournamentDTO> getClubTournaments(Long clubId, Integer year) {
        List<KnockoutTournament> tournaments;
        
        if (year != null) {
            tournaments = tournamentRepository.findByClubIdAndTournamentYearOrderByWeekNumberDesc(clubId, year);
        } else {
            tournaments = tournamentRepository.findByClubIdOrderByCreatedDateDesc(clubId);
        }
        
        return tournaments.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public KnockoutTournamentDTO createWeeklyTournament(Long clubId, Long userId, KnockoutTournament.DrawType drawType) {
        return createKnockoutTournament(clubId, userId, drawType, null, TournamentFrequency.WEEKLY);
    }
    
    public KnockoutTournamentDTO createKnockoutTournament(Long clubId, Long userId, KnockoutTournament.DrawType drawType, 
                                                          String tournamentName, TournamentFrequency frequency) {
        if (drawType == null) {
            drawType = KnockoutTournament.DrawType.RANDOM; // Default to random
        }
        
        // Get current year and week
        LocalDateTime now = LocalDateTime.now();
        int currentYear = now.getYear();
        int currentWeek = now.get(WeekFields.of(Locale.getDefault()).weekOfYear());
        
        // For weekly tournaments, check if tournament already exists for this week
        if (frequency == TournamentFrequency.WEEKLY) {
            Optional<KnockoutTournament> existingTournament = 
                tournamentRepository.findByClubIdAndYearAndWeek(clubId, currentYear, currentWeek);
            
            if (existingTournament.isPresent()) {
                throw new RuntimeException("Tournament already exists for week " + currentWeek + " of " + currentYear);
            }
        }
        
        // Get active club members (players with verified status and belonging to the club)
        List<Player> activeMembers = playerRepository.findByClubIdAndIsVerifiedOrderByNameAsc(clubId);
        
        if (activeMembers.size() < 4) {
            throw new RuntimeException("At least 4 active members are required to create a tournament");
        }
        
        // Create tournament
        KnockoutTournament tournament = new KnockoutTournament();
        tournament.setClubId(clubId);
        tournament.setTournamentYear(currentYear);
        tournament.setWeekNumber(currentWeek);
        tournament.setStatus(KnockoutTournament.TournamentStatus.UPCOMING);
        tournament.setStartDate(now.plusDays(1)); // Start tomorrow
        tournament.setDrawType(drawType);
        
        // Set tournament name based on frequency and custom name
        if (tournamentName != null && !tournamentName.trim().isEmpty()) {
            tournament.setTournamentName(tournamentName.trim());
        } else {
            String defaultName = generateTournamentName(frequency, currentWeek, currentYear);
            tournament.setTournamentName(defaultName);
        }
        
        // Generate bracket with specified draw type
        BracketStructure bracket = generateBracket(activeMembers, drawType);
        try {
            tournament.setBracketData(objectMapper.writeValueAsString(bracket));
        } catch (Exception e) {
            log.error("Failed to serialize bracket data", e);
            throw new RuntimeException("Failed to create tournament bracket");
        }
        
        tournament = tournamentRepository.save(tournament);
        log.info("Created {} tournament '{}' for club {} - Week {}, Year {} with {} draw", 
                frequency, tournament.getTournamentName(), clubId, currentWeek, currentYear, drawType);
        
        return convertToDTO(tournament);
    }
    
    private String generateTournamentName(TournamentFrequency frequency, int week, int year) {
        switch (frequency) {
            case WEEKLY:
                return "Weekly Tournament - Week " + week + ", " + year;
            case MONTHLY:
                java.time.Month month = java.time.LocalDate.now().getMonth();
                return month.getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH) + " " + year + " Monthly Tournament";
            case ONCE_OFF:
                return "Special Tournament - " + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy"));
            default:
                return "Tournament - Week " + week + ", " + year;
        }
    }
    
    public void updateKnockoutMatchResult(Long clubId, Long tournamentId, Long matchId, java.util.Map<String, Object> request, Long userId) {
        // Get the tournament
        Optional<KnockoutTournament> tournamentOpt = tournamentRepository.findById(tournamentId);
        if (tournamentOpt.isEmpty()) {
            throw new RuntimeException("Tournament not found");
        }
        
        KnockoutTournament tournament = tournamentOpt.get();
        
        // Verify tournament belongs to the club
        if (!tournament.getClubId().equals(clubId)) {
            throw new RuntimeException("Tournament does not belong to this club");
        }
        
        // Parse the bracket data
        BracketStructure bracket;
        try {
            bracket = objectMapper.readValue(tournament.getBracketData(), BracketStructure.class);
        } catch (Exception e) {
            log.error("Failed to parse bracket data for tournament {}", tournamentId, e);
            throw new RuntimeException("Failed to parse tournament bracket data");
        }
        
        // Find and update the match
        BracketMatch matchToUpdate = bracket.getMatches().stream()
                .filter(match -> match.getMatchNumber() == matchId.intValue())
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Match not found in tournament"));
        
        // Extract winner from request
        Object winnerIdObj = request.get("winnerId");
        if (winnerIdObj != null) {
            Long winnerId = null;
            if (winnerIdObj instanceof Number) {
                winnerId = ((Number) winnerIdObj).longValue();
            } else if (winnerIdObj instanceof String) {
                try {
                    winnerId = Long.parseLong((String) winnerIdObj);
                } catch (NumberFormatException e) {
                    throw new RuntimeException("Invalid winner ID format");
                }
            }
            
            // Verify winner is one of the players in this match
            BracketParticipant winner = null;
            if (matchToUpdate.getPlayer1() != null && matchToUpdate.getPlayer1().getPlayerId().equals(winnerId)) {
                winner = matchToUpdate.getPlayer1();
            } else if (matchToUpdate.getPlayer2() != null && matchToUpdate.getPlayer2().getPlayerId().equals(winnerId)) {
                winner = matchToUpdate.getPlayer2();
            } else {
                throw new RuntimeException("Winner must be one of the players in this match");
            }
            
            matchToUpdate.setWinner(winner);
            
            // Generate next round matches if this completes a round
            generateNextRoundIfNeeded(bracket, matchToUpdate.getRound());
            
            // Save the updated bracket data
            try {
                tournament.setBracketData(objectMapper.writeValueAsString(bracket));
                tournamentRepository.save(tournament);
                log.info("Updated match {} result for tournament {} in club {}", matchId, tournamentId, clubId);
            } catch (Exception e) {
                log.error("Failed to save updated bracket data", e);
                throw new RuntimeException("Failed to update match result");
            }
        } else {
            throw new RuntimeException("Winner ID is required");
        }
    }
    
    private void generateNextRoundIfNeeded(BracketStructure bracket, int currentRound) {
        // Check if all matches in the current round are complete
        List<BracketMatch> currentRoundMatches = bracket.getMatches().stream()
                .filter(match -> match.getRound() == currentRound)
                .collect(Collectors.toList());
        
        boolean allMatchesComplete = currentRoundMatches.stream()
                .allMatch(match -> match.getWinner() != null || match.isBye());
        
        if (!allMatchesComplete) {
            return; // Not all matches are complete yet
        }
        
        // Check if next round already exists
        boolean nextRoundExists = bracket.getMatches().stream()
                .anyMatch(match -> match.getRound() == currentRound + 1);
        
        if (nextRoundExists) {
            return; // Next round already generated
        }
        
        // Generate next round matches
        List<BracketParticipant> winners = currentRoundMatches.stream()
                .map(match -> {
                    if (match.isBye()) {
                        return match.getPlayer1(); // Bye winners advance automatically
                    }
                    return match.getWinner();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        
        if (winners.size() <= 1) {
            // Tournament is complete
            return;
        }
        
        // Create matches for next round
        int nextRound = currentRound + 1;
        int matchCounter = bracket.getMatches().stream()
                .mapToInt(BracketMatch::getMatchNumber)
                .max().orElse(0) + 1;
        
        for (int i = 0; i < winners.size(); i += 2) {
            BracketParticipant player1 = winners.get(i);
            BracketParticipant player2 = (i + 1 < winners.size()) ? winners.get(i + 1) : null;
            
            BracketMatch nextRoundMatch = new BracketMatch(matchCounter++, nextRound, player1, player2, null);
            if (player2 == null) {
                // This is a bye match
                nextRoundMatch.setBye(true);
                nextRoundMatch.setWinner(player1);
            }
            
            bracket.getMatches().add(nextRoundMatch);
        }
        
        log.info("Generated {} matches for round {}", winners.size() / 2, nextRound);
    }
    
    // Tournament frequency enum
    public enum TournamentFrequency {
        WEEKLY, MONTHLY, ONCE_OFF
    }
    
    @Transactional
    public KnockoutTournamentDTO startTournament(Long tournamentId, Long clubId, Long userId) {
        Optional<KnockoutTournament> tournamentOpt = tournamentRepository.findById(tournamentId);
        
        if (tournamentOpt.isEmpty()) {
            throw new RuntimeException("Tournament not found");
        }
        
        KnockoutTournament tournament = tournamentOpt.get();
        
        // Verify tournament belongs to the club
        if (!tournament.getClubId().equals(clubId)) {
            throw new RuntimeException("Tournament does not belong to this club");
        }
        
        // Check if tournament is in UPCOMING status
        if (tournament.getStatus() != KnockoutTournament.TournamentStatus.UPCOMING) {
            throw new RuntimeException("Tournament can only be started when in UPCOMING status. Current status: " + tournament.getStatus());
        }
        
        // Update tournament status and start time
        tournament.setStatus(KnockoutTournament.TournamentStatus.IN_PROGRESS);
        tournament.setStartDate(LocalDateTime.now());
        tournament.setCurrentRound(1);
        
        tournament = tournamentRepository.save(tournament);
        
        log.info("Started tournament {} for club {} - moved to IN_PROGRESS status", tournamentId, clubId);
        
        return convertToDTO(tournament);
    }
    
    public List<TournamentLeaderboardDTO> getClubTournamentLeaderboard(Long clubId, Integer year) {
        if (year == null) {
            year = LocalDateTime.now().getYear();
        }
        
        List<Object[]> leaderboardData = playerPointsRepository.findLeaderboardByClubAndYear(clubId, year);
        List<TournamentLeaderboardDTO> leaderboard = new ArrayList<>();
        
        int rank = 1;
        for (Object[] data : leaderboardData) {
            Long playerId = (Long) data[0];
            Long totalPoints = (Long) data[1];
            Long tournamentCount = (Long) data[2];
            
            Optional<Player> playerOpt = playerRepository.findById(playerId);
            if (playerOpt.isPresent()) {
                Player player = playerOpt.get();
                
                // Get detailed tournament statistics
                List<PlayerTournamentPoints> playerPoints = 
                    playerPointsRepository.findByPlayerIdAndClubIdAndTournamentYear(playerId, clubId, year);
                
                Map<PlayerTournamentPoints.TournamentPosition, Long> positionCounts = 
                    playerPoints.stream()
                        .collect(Collectors.groupingBy(
                            PlayerTournamentPoints::getPositionAchieved,
                            Collectors.counting()
                        ));
                
                TournamentLeaderboardDTO dto = new TournamentLeaderboardDTO();
                dto.setPlayerId(playerId);
                dto.setPlayerName(player.getName());
                dto.setUsername(player.getUser().getUsername());
                dto.setTotalPoints(totalPoints.intValue());
                dto.setTournamentCount(tournamentCount.intValue());
                dto.setWinCount(positionCounts.getOrDefault(PlayerTournamentPoints.TournamentPosition.WINNER, 0L).intValue());
                dto.setRunnerUpCount(positionCounts.getOrDefault(PlayerTournamentPoints.TournamentPosition.RUNNER_UP, 0L).intValue());
                dto.setSemifinalCount(positionCounts.getOrDefault(PlayerTournamentPoints.TournamentPosition.SEMIFINALIST, 0L).intValue());
                dto.setQuarterfinalCount(positionCounts.getOrDefault(PlayerTournamentPoints.TournamentPosition.QUARTERFINALIST, 0L).intValue());
                dto.setRank(rank++);
                
                leaderboard.add(dto);
            }
        }
        
        return leaderboard;
    }
    
    public TournamentPointsConfig updateTournamentPointsConfig(Long clubId, TournamentPointsConfig config, Long userId) {
        Optional<TournamentPointsConfig> existingConfig = pointsConfigRepository.findByClubId(clubId);
        
        TournamentPointsConfig pointsConfig;
        if (existingConfig.isPresent()) {
            pointsConfig = existingConfig.get();
            pointsConfig.setWinnerPoints(config.getWinnerPoints());
            pointsConfig.setRunnerUpPoints(config.getRunnerUpPoints());
            pointsConfig.setSemifinalistPoints(config.getSemifinalistPoints());
            pointsConfig.setQuarterfinalistPoints(config.getQuarterfinalistPoints());
        } else {
            pointsConfig = new TournamentPointsConfig();
            pointsConfig.setClubId(clubId);
            pointsConfig.setWinnerPoints(config.getWinnerPoints());
            pointsConfig.setRunnerUpPoints(config.getRunnerUpPoints());
            pointsConfig.setSemifinalistPoints(config.getSemifinalistPoints());
            pointsConfig.setQuarterfinalistPoints(config.getQuarterfinalistPoints());
        }
        
        return pointsConfigRepository.save(pointsConfig);
    }
    
    public TournamentPointsConfig getTournamentPointsConfig(Long clubId) {
        return pointsConfigRepository.findByClubId(clubId)
                .orElseGet(() -> {
                    TournamentPointsConfig defaultConfig = new TournamentPointsConfig();
                    defaultConfig.setClubId(clubId);
                    return defaultConfig;
                });
    }
    
    private KnockoutTournamentDTO convertToDTO(KnockoutTournament tournament) {
        KnockoutTournamentDTO dto = new KnockoutTournamentDTO(tournament);
        
        // Add winner and runner-up names if available
        if (tournament.getWinnerPlayerId() != null) {
            playerRepository.findById(tournament.getWinnerPlayerId())
                    .ifPresent(player -> dto.setWinnerPlayerName(player.getName()));
        }
        
        if (tournament.getRunnerUpPlayerId() != null) {
            playerRepository.findById(tournament.getRunnerUpPlayerId())
                    .ifPresent(player -> dto.setRunnerUpPlayerName(player.getName()));
        }
        
        // Calculate participant count from bracket data
        if (tournament.getBracketData() != null) {
            try {
                BracketStructure bracket = objectMapper.readValue(tournament.getBracketData(), BracketStructure.class);
                dto.setParticipantCount(bracket.getParticipants().size());
            } catch (Exception e) {
                log.warn("Failed to parse bracket data for tournament {}", tournament.getId());
                dto.setParticipantCount(0);
            }
        }
        
        return dto;
    }
    
    private BracketStructure generateBracket(List<Player> activeMembers, KnockoutTournament.DrawType drawType) {
        List<BracketParticipant> participants = activeMembers.stream()
                .map(player -> {
                    return new BracketParticipant(
                        player.getId(),
                        player.getName(), // Using name field from Player entity
                        player.getUser().getUsername(), // Getting username from user relationship
                        player.getRating() != null ? player.getRating().doubleValue() : 1200.0 // Default rating
                    );
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        
        // Apply draw type
        if (drawType == KnockoutTournament.DrawType.SEEDED) {
            // Sort by rating (highest first) for seeded draw
            participants.sort((p1, p2) -> Double.compare(p2.getRating(), p1.getRating()));
            log.info("Generated seeded bracket with {} participants, ratings from {} to {}", 
                    participants.size(), 
                    participants.size() > 0 ? participants.get(participants.size() - 1).getRating() : 0,
                    participants.size() > 0 ? participants.get(0).getRating() : 0);
        } else {
            // Shuffle for random draw
            Collections.shuffle(participants);
            log.info("Generated random bracket with {} participants", participants.size());
        }
        
        // Calculate bracket size (next power of 2)
        int bracketSize = Integer.highestOneBit(participants.size() - 1) * 2;
        if (bracketSize < participants.size()) {
            bracketSize *= 2;
        }
        
        // For seeded tournaments, assign byes to highest-rated players
        // For random tournaments, byes are distributed based on the shuffle
        int byeCount = bracketSize - participants.size();
        if (byeCount > 0) {
            log.info("Tournament will have {} bye(s) in first round", byeCount);
        }
        
        return new BracketStructure(bracketSize, participants, drawType);
    }
    
    public KnockoutTournamentDTO getKnockoutTournament(Long tournamentId, Long clubId) {
        Optional<KnockoutTournament> tournamentOpt = tournamentRepository.findById(tournamentId);
        
        if (tournamentOpt.isEmpty()) {
            throw new RuntimeException("Tournament not found");
        }
        
        KnockoutTournament tournament = tournamentOpt.get();
        
        // Verify tournament belongs to the club
        if (!tournament.getClubId().equals(clubId)) {
            throw new RuntimeException("Tournament does not belong to this club");
        }
        
        return convertToDTO(tournament);
    }
    
    // Inner classes for bracket structure
    public static class BracketStructure {
        private int size;
        private List<BracketParticipant> participants;
        private List<BracketMatch> matches;
        private KnockoutTournament.DrawType drawType;
        
        public BracketStructure() {}
        
        public BracketStructure(int size, List<BracketParticipant> participants, KnockoutTournament.DrawType drawType) {
            this.size = size;
            this.participants = participants;
            this.drawType = drawType;
            this.matches = generateMatches();
        }
        
        private List<BracketMatch> generateMatches() {
            List<BracketMatch> matchList = new ArrayList<>();
            
            // Calculate how many byes we need
            int byeCount = size - participants.size();
            
            // For seeded tournaments, higher seeds get byes
            // For random tournaments, byes are distributed based on position
            List<BracketParticipant> firstRoundParticipants = new ArrayList<>();
            
            if (drawType == KnockoutTournament.DrawType.SEEDED && byeCount > 0) {
                // In seeded tournaments, top seeds get byes
                // Add participants who play in first round (those after bye recipients)
                for (int i = byeCount; i < participants.size(); i++) {
                    firstRoundParticipants.add(participants.get(i));
                }
                
                // Create bye matches for top seeds
                for (int i = 0; i < byeCount; i++) {
                    BracketParticipant byePlayer = participants.get(i);
                    BracketMatch byeMatch = new BracketMatch(i + 1, 1, byePlayer, null, byePlayer);
                    byeMatch.setBye(true);
                    matchList.add(byeMatch);
                }
            } else {
                // For random or when no byes needed, all participants play
                firstRoundParticipants.addAll(participants);
            }
            
            // Generate first round matches for remaining participants
            int matchNumber = byeCount + 1;
            for (int i = 0; i < firstRoundParticipants.size(); i += 2) {
                BracketParticipant player1 = firstRoundParticipants.get(i);
                BracketParticipant player2 = null;
                boolean isBye = false;
                
                if (i + 1 < firstRoundParticipants.size()) {
                    player2 = firstRoundParticipants.get(i + 1);
                } else {
                    // Odd number in this group, player1 gets a bye
                    isBye = true;
                }
                
                BracketMatch match = new BracketMatch(matchNumber++, 1, player1, player2, isBye ? player1 : null);
                match.setBye(isBye);
                matchList.add(match);
            }
            
            return matchList;
        }
        
        // Getters and setters
        public int getSize() { return size; }
        public void setSize(int size) { this.size = size; }
        public List<BracketParticipant> getParticipants() { return participants; }
        public void setParticipants(List<BracketParticipant> participants) { this.participants = participants; }
        public List<BracketMatch> getMatches() { return matches; }
        public void setMatches(List<BracketMatch> matches) { this.matches = matches; }
        public KnockoutTournament.DrawType getDrawType() { return drawType; }
        public void setDrawType(KnockoutTournament.DrawType drawType) { this.drawType = drawType; }
    }
    
    public static class BracketParticipant {
        private Long playerId;
        private String playerName;
        private String username;
        private Double rating;
        
        public BracketParticipant() {}
        
        public BracketParticipant(Long playerId, String playerName, String username, Double rating) {
            this.playerId = playerId;
            this.playerName = playerName;
            this.username = username;
            this.rating = rating;
        }
        
        // Getters and setters
        public Long getPlayerId() { return playerId; }
        public void setPlayerId(Long playerId) { this.playerId = playerId; }
        public String getPlayerName() { return playerName; }
        public void setPlayerName(String playerName) { this.playerName = playerName; }
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public Double getRating() { return rating; }
        public void setRating(Double rating) { this.rating = rating; }
    }
    
    public static class BracketMatch {
        private int matchNumber;
        private int round;
        private BracketParticipant player1;
        private BracketParticipant player2;
        private BracketParticipant winner;
        private boolean isBye;
        
        public BracketMatch() {}
        
        public BracketMatch(int matchNumber, int round, BracketParticipant player1, BracketParticipant player2, BracketParticipant winner) {
            this.matchNumber = matchNumber;
            this.round = round;
            this.player1 = player1;
            this.player2 = player2;
            this.winner = winner;
            this.isBye = (player2 == null && player1 != null);
        }
        
        // Getters and setters
        public int getMatchNumber() { return matchNumber; }
        public void setMatchNumber(int matchNumber) { this.matchNumber = matchNumber; }
        public int getRound() { return round; }
        public void setRound(int round) { this.round = round; }
        public BracketParticipant getPlayer1() { return player1; }
        public void setPlayer1(BracketParticipant player1) { this.player1 = player1; }
        public BracketParticipant getPlayer2() { return player2; }
        public void setPlayer2(BracketParticipant player2) { this.player2 = player2; }
        public BracketParticipant getWinner() { return winner; }
        public void setWinner(BracketParticipant winner) { this.winner = winner; }
        public boolean isBye() { return isBye; }
        public void setBye(boolean bye) { isBye = bye; }
    }
}