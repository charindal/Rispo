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
    
    @Autowired
    private RatingEngine ratingEngine;
    
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
        
        // Auto-create player approvals with PENDING status for all active members
        for (Player player : activeMembers) {
            TournamentPlayerApproval approval = new TournamentPlayerApproval();
            approval.setTournamentId(tournament.getId());
            approval.setPlayerId(player.getId());
            approval.setClubId(clubId);
            approval.setApprovalStatus(TournamentPlayerApproval.ApprovalStatus.PENDING);
            playerApprovalRepository.save(approval);
        }
        
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
        if (winnerIdObj == null) {
            throw new RuntimeException("Winner ID is required");
        }
        
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
        
        // Extract and save game scores from request
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> games = (List<Map<String, Object>>) request.get("games");
        if (games != null && !games.isEmpty()) {
            int player1Games = 0;
            int player2Games = 0;
            
            for (Map<String, Object> game : games) {
                Object winnerIdForGame = game.get("winnerId");
                if (winnerIdForGame != null) {
                    Long gameWinnerId = null;
                    if (winnerIdForGame instanceof Number) {
                        gameWinnerId = ((Number) winnerIdForGame).longValue();
                    } else if (winnerIdForGame instanceof String) {
                        gameWinnerId = Long.parseLong((String) winnerIdForGame);
                    }
                    
                    if (gameWinnerId != null) {
                        if (matchToUpdate.getPlayer1() != null && matchToUpdate.getPlayer1().getPlayerId().equals(gameWinnerId)) {
                            player1Games++;
                        } else if (matchToUpdate.getPlayer2() != null && matchToUpdate.getPlayer2().getPlayerId().equals(gameWinnerId)) {
                            player2Games++;
                        }
                    }
                }
            }
            
            matchToUpdate.setPlayer1Games(player1Games);
            matchToUpdate.setPlayer2Games(player2Games);
            log.info("Match {} scores: Player1 {} - {} Player2", matchId, player1Games, player2Games);
        }
        
        // Check if this is an approval (rating should be applied)
        Boolean approve = (Boolean) request.get("approve");
        if (Boolean.TRUE.equals(approve)) {
            matchToUpdate.setStatus("APPROVED");
            
            // Apply ratings if both players exist (not a bye match)
            if (matchToUpdate.getPlayer1() != null && matchToUpdate.getPlayer2() != null && !matchToUpdate.isBye()) {
                try {
                    applyRatingsForKnockoutMatch(matchToUpdate, winnerId);
                    log.info("Applied ratings for knockout match {} in tournament {}", matchId, tournamentId);
                } catch (Exception e) {
                    log.error("Failed to apply ratings for match {}", matchId, e);
                    // Continue without rating - don't fail the whole operation
                }
            }
        }
        
        // Generate next round matches if this completes a round
        boolean tournamentComplete = generateNextRoundIfNeeded(bracket, matchToUpdate.getRound());
        
        // Award tournament points if tournament is complete
        if (tournamentComplete) {
            try {
                awardTournamentPoints(tournament, bracket);
                tournament.setStatus(KnockoutTournament.TournamentStatus.COMPLETED);
                log.info("Tournament {} completed. Points awarded.", tournamentId);
            } catch (Exception e) {
                log.error("Failed to award tournament points for tournament {}", tournamentId, e);
            }
        }
        
        // Save the updated bracket data
        try {
            tournament.setBracketData(objectMapper.writeValueAsString(bracket));
            tournamentRepository.save(tournament);
            log.info("Updated match {} result for tournament {} in club {}", matchId, tournamentId, clubId);
        } catch (Exception e) {
            log.error("Failed to save updated bracket data", e);
            throw new RuntimeException("Failed to update match result");
        }
    }
    
    /**
     * Apply ELO ratings for a knockout match and store the rating changes in the match
     */
    private void applyRatingsForKnockoutMatch(BracketMatch match, Long winnerId) {
        Long player1Id = match.getPlayer1().getPlayerId();
        Long player2Id = match.getPlayer2().getPlayerId();
        
        Optional<Player> player1Opt = playerRepository.findById(player1Id);
        Optional<Player> player2Opt = playerRepository.findById(player2Id);
        
        if (player1Opt.isEmpty() || player2Opt.isEmpty()) {
            log.warn("Cannot apply ratings - one or both players not found: {} / {}", player1Id, player2Id);
            return;
        }
        
        Player player1 = player1Opt.get();
        Player player2 = player2Opt.get();
        
        // Determine player1Score (1.0 if player1 won, 0.0 if player2 won)
        double player1Score = player1Id.equals(winnerId) ? 1.0 : 0.0;
        
        // Calculate rating changes
        int[] ratingChanges = ratingEngine.calculateRatingChanges(player1, player2, player1Score);
        int change1 = ratingChanges[0];
        int change2 = ratingChanges[1];
        
        // Store rating changes in the match for display on bracket
        match.setPlayer1RatingChange(change1);
        match.setPlayer2RatingChange(change2);
        
        // Also update the participant objects with rating changes for the bracket display
        if (match.getPlayer1() != null) {
            match.getPlayer1().setRatingChange(change1);
        }
        if (match.getPlayer2() != null) {
            match.getPlayer2().setRatingChange(change2);
        }
        
        // Apply new ratings
        player1.setRating(Math.max(400, Math.min(3000, player1.getRating() + change1)));
        player2.setRating(Math.max(400, Math.min(3000, player2.getRating() + change2)));
        
        // Update match statistics
        player1.setMatchesPlayed((player1.getMatchesPlayed() != null ? player1.getMatchesPlayed() : 0) + 1);
        player2.setMatchesPlayed((player2.getMatchesPlayed() != null ? player2.getMatchesPlayed() : 0) + 1);
        
        // Update win/loss counts
        if (player1Score == 1.0) {
            player1.setWins((player1.getWins() != null ? player1.getWins() : 0) + 1);
            player2.setLosses((player2.getLosses() != null ? player2.getLosses() : 0) + 1);
        } else {
            player1.setLosses((player1.getLosses() != null ? player1.getLosses() : 0) + 1);
            player2.setWins((player2.getWins() != null ? player2.getWins() : 0) + 1);
        }
        
        // Save players
        playerRepository.save(player1);
        playerRepository.save(player2);
        
        log.info("Applied ratings for knockout match: Player {} ({} -> {}, change: {}) vs Player {} ({} -> {}, change: {})",
                player1Id, player1.getRating() - change1, player1.getRating(), change1,
                player2Id, player2.getRating() - change2, player2.getRating(), change2);
    }
    
    /**
     * Award tournament points when tournament completes
     */
    private void awardTournamentPoints(KnockoutTournament tournament, BracketStructure bracket) {
        // Get points configuration for this club
        TournamentPointsConfig pointsConfig = pointsConfigRepository.findByClubId(tournament.getClubId())
                .orElseGet(() -> {
                    TournamentPointsConfig defaultConfig = new TournamentPointsConfig();
                    defaultConfig.setClubId(tournament.getClubId());
                    defaultConfig.setWinnerPoints(5);
                    defaultConfig.setRunnerUpPoints(3);
                    defaultConfig.setSemifinalistPoints(2);
                    defaultConfig.setQuarterfinalistPoints(1);
                    return defaultConfig;
                });
        
        // Find the final match (highest round with only one match)
        int maxRound = bracket.getMatches().stream()
                .mapToInt(BracketMatch::getRound)
                .max().orElse(1);
        
        Optional<BracketMatch> finalMatch = bracket.getMatches().stream()
                .filter(m -> m.getRound() == maxRound)
                .findFirst();
        
        if (finalMatch.isEmpty() || finalMatch.get().getWinner() == null) {
            log.warn("No final match or winner found for tournament {}", tournament.getId());
            return;
        }
        
        BracketMatch theFinal = finalMatch.get();
        BracketParticipant winner = theFinal.getWinner();
        BracketParticipant runnerUp = theFinal.getPlayer1().getPlayerId().equals(winner.getPlayerId()) 
                ? theFinal.getPlayer2() : theFinal.getPlayer1();
        
        // Award winner points
        if (winner != null) {
            awardPointsToPlayer(tournament, winner.getPlayerId(), 
                    pointsConfig.getWinnerPoints(), PlayerTournamentPoints.TournamentPosition.WINNER);
        }
        
        // Award runner-up points
        if (runnerUp != null) {
            awardPointsToPlayer(tournament, runnerUp.getPlayerId(), 
                    pointsConfig.getRunnerUpPoints(), PlayerTournamentPoints.TournamentPosition.RUNNER_UP);
        }
        
        // Award semifinalist points (players who lost in semi-finals)
        if (maxRound >= 2) {
            int semiFinalRound = maxRound - 1;
            bracket.getMatches().stream()
                    .filter(m -> m.getRound() == semiFinalRound && m.getWinner() != null && !m.isBye())
                    .forEach(m -> {
                        // The loser of the semi-final is the semifinalist
                        Long loserId = m.getPlayer1().getPlayerId().equals(m.getWinner().getPlayerId())
                                ? m.getPlayer2().getPlayerId() : m.getPlayer1().getPlayerId();
                        awardPointsToPlayer(tournament, loserId, 
                                pointsConfig.getSemifinalistPoints(), PlayerTournamentPoints.TournamentPosition.SEMIFINALIST);
                    });
        }
        
        // Award quarterfinalist points (players who lost in quarter-finals)
        if (maxRound >= 3) {
            int quarterFinalRound = maxRound - 2;
            bracket.getMatches().stream()
                    .filter(m -> m.getRound() == quarterFinalRound && m.getWinner() != null && !m.isBye())
                    .forEach(m -> {
                        Long loserId = m.getPlayer1().getPlayerId().equals(m.getWinner().getPlayerId())
                                ? m.getPlayer2().getPlayerId() : m.getPlayer1().getPlayerId();
                        awardPointsToPlayer(tournament, loserId, 
                                pointsConfig.getQuarterfinalistPoints(), PlayerTournamentPoints.TournamentPosition.QUARTERFINALIST);
                    });
        }
        
        log.info("Awarded tournament points for tournament {}", tournament.getId());
    }
    
    private void awardPointsToPlayer(KnockoutTournament tournament, Long playerId, 
                                     int points, PlayerTournamentPoints.TournamentPosition position) {
        PlayerTournamentPoints ptp = new PlayerTournamentPoints();
        ptp.setPlayerId(playerId);
        ptp.setClubId(tournament.getClubId());
        ptp.setTournamentId(tournament.getId());
        ptp.setTournamentYear(tournament.getTournamentYear());
        ptp.setPointsEarned(points);
        ptp.setPositionAchieved(position);
        ptp.setDateEarned(LocalDateTime.now());
        
        playerPointsRepository.save(ptp);
        log.info("Awarded {} points to player {} for {} in tournament {}", 
                points, playerId, position, tournament.getId());
    }
    
    /**
     * Generate next round matches if the current round is complete.
     * Uses "lucky loser" system to avoid byes in semi-finals and later rounds.
     * @return true if the tournament is complete (final match has a winner), false otherwise
     */
    private boolean generateNextRoundIfNeeded(BracketStructure bracket, int currentRound) {
        // Check if all matches in the current round are complete
        List<BracketMatch> currentRoundMatches = bracket.getMatches().stream()
                .filter(match -> match.getRound() == currentRound)
                .collect(Collectors.toList());
        
        boolean allMatchesComplete = currentRoundMatches.stream()
                .allMatch(match -> match.getWinner() != null || match.isBye());
        
        if (!allMatchesComplete) {
            return false; // Not all matches are complete yet
        }
        
        // Check if next round already exists
        boolean nextRoundExists = bracket.getMatches().stream()
                .anyMatch(match -> match.getRound() == currentRound + 1);
        
        if (nextRoundExists) {
            // Check if next round's final is complete
            return isTournamentComplete(bracket);
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
            // Tournament is complete - only one winner left (or just finished the final)
            return true;
        }
        
        // IMPROVED BYE LOGIC: If odd number of winners and not the final, add a "lucky loser"
        // This ensures semi-finals and finals never have byes
        if (winners.size() % 2 != 0 && winners.size() > 2) {
            BracketParticipant luckyLoser = findBestLoser(bracket, currentRound, winners);
            if (luckyLoser != null) {
                winners.add(luckyLoser);
                log.info("Added lucky loser {} to round {} to avoid bye in later rounds", 
                        luckyLoser.getPlayerName(), currentRound + 1);
            }
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
                // This is a bye match - should only happen in very rare edge cases now
                nextRoundMatch.setBye(true);
                nextRoundMatch.setWinner(player1);
            }
            
            bracket.getMatches().add(nextRoundMatch);
        }
        
        log.info("Generated {} matches for round {}", (winners.size() + 1) / 2, nextRound);
        return false; // Tournament continues
    }
    
    /**
     * Find the best loser from the current round to fill an odd bracket spot.
     * Selection criteria:
     * 1. Lost by the smallest game margin (closest match)
     * 2. If tie, higher rated player gets preference
     * This ensures the "lucky loser" is the most deserving player who almost won.
     */
    private BracketParticipant findBestLoser(BracketStructure bracket, int currentRound, List<BracketParticipant> currentWinners) {
        // Get all completed matches from current round (non-bye matches with results)
        List<BracketMatch> completedMatches = bracket.getMatches().stream()
                .filter(m -> m.getRound() == currentRound)
                .filter(m -> !m.isBye())
                .filter(m -> m.getWinner() != null)
                .filter(m -> m.getPlayer1() != null && m.getPlayer2() != null)
                .collect(Collectors.toList());
        
        if (completedMatches.isEmpty()) {
            return null;
        }
        
        // Collect winner IDs to exclude them
        Set<Long> winnerIds = currentWinners.stream()
                .map(BracketParticipant::getPlayerId)
                .collect(Collectors.toSet());
        
        // Find all losers with their match details
        List<LoserCandidate> loserCandidates = new ArrayList<>();
        
        for (BracketMatch match : completedMatches) {
            BracketParticipant loser;
            int loserGames, winnerGames;
            
            if (match.getWinner().getPlayerId().equals(match.getPlayer1().getPlayerId())) {
                loser = match.getPlayer2();
                loserGames = match.getPlayer2Games();
                winnerGames = match.getPlayer1Games();
            } else {
                loser = match.getPlayer1();
                loserGames = match.getPlayer1Games();
                winnerGames = match.getPlayer2Games();
            }
            
            // Skip if this loser is somehow already a winner (shouldn't happen)
            if (winnerIds.contains(loser.getPlayerId())) {
                continue;
            }
            
            // Calculate margin (smaller is better - closer match)
            int margin = winnerGames - loserGames;
            loserCandidates.add(new LoserCandidate(loser, margin, loser.getRating()));
        }
        
        if (loserCandidates.isEmpty()) {
            return null;
        }
        
        // Sort by: smallest margin first, then highest rating (for ties)
        loserCandidates.sort((a, b) -> {
            int marginCompare = Integer.compare(a.margin, b.margin);
            if (marginCompare != 0) return marginCompare;
            return Double.compare(b.rating, a.rating); // Higher rating preferred
        });
        
        BracketParticipant luckyLoser = loserCandidates.get(0).participant;
        // Mark as lucky loser for display purposes
        luckyLoser.setLuckyLoser(true);
        log.info("Best loser selected: {} (margin: {}, rating: {})", 
                luckyLoser.getPlayerName(), 
                loserCandidates.get(0).margin,
                luckyLoser.getRating());
        
        return luckyLoser;
    }
    
    /**
     * Helper class to track loser candidates for lucky loser selection
     */
    private static class LoserCandidate {
        BracketParticipant participant;
        int margin;
        double rating;
        
        LoserCandidate(BracketParticipant participant, int margin, double rating) {
            this.participant = participant;
            this.margin = margin;
            this.rating = rating;
        }
    }
    
    /**
     * Check if the tournament is complete (final match has a winner)
     */
    private boolean isTournamentComplete(BracketStructure bracket) {
        // Find the highest round
        int maxRound = bracket.getMatches().stream()
                .mapToInt(BracketMatch::getRound)
                .max().orElse(1);
        
        // Get matches in the highest round
        List<BracketMatch> finalRoundMatches = bracket.getMatches().stream()
                .filter(m -> m.getRound() == maxRound)
                .collect(Collectors.toList());
        
        // Tournament is complete if there's only one match in the final round and it has a winner
        if (finalRoundMatches.size() == 1) {
            BracketMatch finalMatch = finalRoundMatches.get(0);
            return finalMatch.getWinner() != null;
        }
        
        return false;
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
    
    /**
     * Get standings for a specific knockout tournament showing each player's results.
     */
    public List<Map<String, Object>> getTournamentStandings(Long tournamentId, Long clubId) {
        Optional<KnockoutTournament> tournamentOpt = tournamentRepository.findById(tournamentId);
        
        if (tournamentOpt.isEmpty()) {
            throw new RuntimeException("Tournament not found");
        }
        
        KnockoutTournament tournament = tournamentOpt.get();
        
        if (!tournament.getClubId().equals(clubId)) {
            throw new RuntimeException("Tournament does not belong to this club");
        }
        
        List<Map<String, Object>> standings = new ArrayList<>();
        
        if (tournament.getBracketData() == null || tournament.getBracketData().isEmpty()) {
            return standings;
        }
        
        try {
            BracketStructure bracket = objectMapper.readValue(tournament.getBracketData(), BracketStructure.class);
            
            // Create a map to track each player's performance
            Map<Long, Map<String, Object>> playerStats = new HashMap<>();
            
            // Initialize all participants
            for (BracketParticipant participant : bracket.getParticipants()) {
                Map<String, Object> stats = new HashMap<>();
                stats.put("playerId", participant.getPlayerId());
                stats.put("playerName", participant.getPlayerName());
                stats.put("rating", participant.getRating().intValue());
                stats.put("matchesPlayed", 0);
                stats.put("wins", 0);
                stats.put("losses", 0);
                stats.put("gamesWon", 0);
                stats.put("gamesLost", 0);
                stats.put("ratingChange", 0);
                stats.put("roundReached", 0);
                stats.put("position", "Participant");
                playerStats.put(participant.getPlayerId(), stats);
            }
            
            // Calculate max round for position naming
            int maxRound = bracket.getMatches().stream()
                    .mapToInt(BracketMatch::getRound)
                    .max().orElse(1);
            
            // Process all matches
            for (BracketMatch match : bracket.getMatches()) {
                if (match.isBye() || match.getPlayer1() == null || match.getPlayer2() == null) {
                    // Update round reached for bye winners
                    if (match.isBye() && match.getWinner() != null) {
                        Map<String, Object> winnerStats = playerStats.get(match.getWinner().getPlayerId());
                        if (winnerStats != null) {
                            int currentRound = (int) winnerStats.get("roundReached");
                            winnerStats.put("roundReached", Math.max(currentRound, match.getRound() + 1));
                        }
                    }
                    continue;
                }
                
                if (match.getWinner() == null || !"APPROVED".equals(match.getStatus())) {
                    continue; // Match not yet completed
                }
                
                Long player1Id = match.getPlayer1().getPlayerId();
                Long player2Id = match.getPlayer2().getPlayerId();
                Long winnerId = match.getWinner().getPlayerId();
                
                Map<String, Object> stats1 = playerStats.get(player1Id);
                Map<String, Object> stats2 = playerStats.get(player2Id);
                
                if (stats1 != null) {
                    stats1.put("matchesPlayed", (int) stats1.get("matchesPlayed") + 1);
                    stats1.put("gamesWon", (int) stats1.get("gamesWon") + match.getPlayer1Games());
                    stats1.put("gamesLost", (int) stats1.get("gamesLost") + match.getPlayer2Games());
                    
                    if (player1Id.equals(winnerId)) {
                        stats1.put("wins", (int) stats1.get("wins") + 1);
                        stats1.put("roundReached", Math.max((int) stats1.get("roundReached"), match.getRound() + 1));
                    } else {
                        stats1.put("losses", (int) stats1.get("losses") + 1);
                        stats1.put("roundReached", Math.max((int) stats1.get("roundReached"), match.getRound()));
                    }
                    
                    if (match.getPlayer1RatingChange() != null) {
                        stats1.put("ratingChange", (int) stats1.get("ratingChange") + match.getPlayer1RatingChange());
                    }
                }
                
                if (stats2 != null) {
                    stats2.put("matchesPlayed", (int) stats2.get("matchesPlayed") + 1);
                    stats2.put("gamesWon", (int) stats2.get("gamesWon") + match.getPlayer2Games());
                    stats2.put("gamesLost", (int) stats2.get("gamesLost") + match.getPlayer1Games());
                    
                    if (player2Id.equals(winnerId)) {
                        stats2.put("wins", (int) stats2.get("wins") + 1);
                        stats2.put("roundReached", Math.max((int) stats2.get("roundReached"), match.getRound() + 1));
                    } else {
                        stats2.put("losses", (int) stats2.get("losses") + 1);
                        stats2.put("roundReached", Math.max((int) stats2.get("roundReached"), match.getRound()));
                    }
                    
                    if (match.getPlayer2RatingChange() != null) {
                        stats2.put("ratingChange", (int) stats2.get("ratingChange") + match.getPlayer2RatingChange());
                    }
                }
            }
            
            // Assign position names based on round reached
            for (Map<String, Object> stats : playerStats.values()) {
                int roundReached = (int) stats.get("roundReached");
                String position;
                
                if (roundReached > maxRound) {
                    position = "Winner";
                } else if (roundReached == maxRound) {
                    position = "Runner-up";
                } else if (roundReached == maxRound - 1) {
                    position = "Semi-finalist";
                } else if (roundReached == maxRound - 2) {
                    position = "Quarter-finalist";
                } else if (roundReached > 0) {
                    position = "Round " + roundReached;
                } else {
                    position = "Participant";
                }
                stats.put("position", position);
            }
            
            // Sort standings: by round reached (desc), then wins (desc), then game diff (desc)
            standings = new ArrayList<>(playerStats.values());
            standings.sort((a, b) -> {
                int roundCompare = Integer.compare((int) b.get("roundReached"), (int) a.get("roundReached"));
                if (roundCompare != 0) return roundCompare;
                
                int winsCompare = Integer.compare((int) b.get("wins"), (int) a.get("wins"));
                if (winsCompare != 0) return winsCompare;
                
                int diffA = (int) a.get("gamesWon") - (int) a.get("gamesLost");
                int diffB = (int) b.get("gamesWon") - (int) b.get("gamesLost");
                return Integer.compare(diffB, diffA);
            });
            
            // Assign ranks
            for (int i = 0; i < standings.size(); i++) {
                standings.get(i).put("rank", i + 1);
            }
            
        } catch (Exception e) {
            log.error("Failed to calculate standings for tournament {}", tournamentId, e);
            throw new RuntimeException("Failed to calculate tournament standings");
        }
        
        return standings;
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

    /**
     * Get all players for approval in a tournament
     */
    @Autowired
    private TournamentPlayerApprovalRepository playerApprovalRepository;

    public List<Map<String, Object>> getTournamentPlayersForApproval(Long clubId, Long tournamentId) {
        KnockoutTournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new RuntimeException("Tournament not found"));
        
        if (!tournament.getClubId().equals(clubId)) {
            throw new RuntimeException("Tournament does not belong to this club");
        }

        // Get all players in the club
        List<Player> clubPlayers = playerRepository.findByClubIdAndIsVerifiedOrderByNameAsc(clubId);

        // Get approval statuses for this tournament
        List<TournamentPlayerApproval> approvals = playerApprovalRepository.findByTournamentIdOrderByApprovalStatusDesc(tournamentId);
        Map<Long, TournamentPlayerApproval> approvalMap = approvals.stream()
            .collect(Collectors.toMap(TournamentPlayerApproval::getPlayerId, a -> a));

        // Map players to approval DTOs
        return clubPlayers.stream()
            .map(player -> {
                Map<String, Object> playerApprovalDTO = new HashMap<>();
                playerApprovalDTO.put("playerId", player.getId());
                playerApprovalDTO.put("playerName", player.getName());
                playerApprovalDTO.put("rating", player.getRating());

                TournamentPlayerApproval approval = approvalMap.get(player.getId());
                if (approval != null) {
                    playerApprovalDTO.put("approvalStatus", approval.getApprovalStatus().toString());
                    playerApprovalDTO.put("approvalId", approval.getId());
                    playerApprovalDTO.put("approvedBy", approval.getApprovedBy());
                    playerApprovalDTO.put("approvedDate", approval.getApprovedDate());
                    playerApprovalDTO.put("rejectionReason", approval.getRejectionReason());
                } else {
                    playerApprovalDTO.put("approvalStatus", "PENDING");
                    playerApprovalDTO.put("approvalId", null);
                }
                return playerApprovalDTO;
            })
            .sorted((p1, p2) -> {
                // Sort by approval status (APPROVED first, then PENDING, then REJECTED)
                Map<String, Integer> statusOrder = Map.of("APPROVED", 0, "PENDING", 1, "REJECTED", 2);
                int status1 = statusOrder.getOrDefault(p1.get("approvalStatus").toString(), 3);
                int status2 = statusOrder.getOrDefault(p2.get("approvalStatus").toString(), 3);
                return Integer.compare(status1, status2);
            })
            .collect(Collectors.toList());
    }

    /**
     * Approve a player for tournament participation
     */
    public void approvePlayerForTournament(Long clubId, Long tournamentId, Long playerId, Long approvedByUserId) {
        KnockoutTournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new RuntimeException("Tournament not found"));
        
        if (!tournament.getClubId().equals(clubId)) {
            throw new RuntimeException("Tournament does not belong to this club");
        }

        Player player = playerRepository.findById(playerId)
            .orElseThrow(() -> new RuntimeException("Player not found"));

        Optional<TournamentPlayerApproval> existingApproval = playerApprovalRepository
            .findByTournamentIdAndPlayerId(tournamentId, playerId);

        TournamentPlayerApproval approval;
        if (existingApproval.isPresent()) {
            approval = existingApproval.get();
        } else {
            approval = new TournamentPlayerApproval();
            approval.setTournamentId(tournamentId);
            approval.setPlayerId(playerId);
            approval.setClubId(clubId);
        }

        approval.setApprovalStatus(TournamentPlayerApproval.ApprovalStatus.APPROVED);
        approval.setApprovedBy(approvedByUserId);
        approval.setApprovedDate(LocalDateTime.now());
        approval.setRejectionReason(null);

        playerApprovalRepository.save(approval);
    }

    /**
     * Reject a player for tournament participation
     */
    public void rejectPlayerForTournament(Long clubId, Long tournamentId, Long playerId, String reason, Long rejectedByUserId) {
        KnockoutTournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new RuntimeException("Tournament not found"));
        
        if (!tournament.getClubId().equals(clubId)) {
            throw new RuntimeException("Tournament does not belong to this club");
        }

        Player player = playerRepository.findById(playerId)
            .orElseThrow(() -> new RuntimeException("Player not found"));

        Optional<TournamentPlayerApproval> existingApproval = playerApprovalRepository
            .findByTournamentIdAndPlayerId(tournamentId, playerId);

        TournamentPlayerApproval approval;
        if (existingApproval.isPresent()) {
            approval = existingApproval.get();
        } else {
            approval = new TournamentPlayerApproval();
            approval.setTournamentId(tournamentId);
            approval.setPlayerId(playerId);
            approval.setClubId(clubId);
        }

        approval.setApprovalStatus(TournamentPlayerApproval.ApprovalStatus.REJECTED);
        approval.setApprovedBy(rejectedByUserId);
        approval.setApprovedDate(LocalDateTime.now());
        approval.setRejectionReason(reason);

        playerApprovalRepository.save(approval);
    }

    /**
     * Get count of approved players for a tournament
     */
    public int getApprovedPlayerCount(Long tournamentId) {
        return playerApprovalRepository.countByTournamentIdAndApprovalStatus(
            tournamentId, TournamentPlayerApproval.ApprovalStatus.APPROVED);
    }

    /**
     * Check if all required players are approved to start tournament
     */
    public boolean canStartTournament(Long tournamentId) {
        KnockoutTournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new RuntimeException("Tournament not found"));

        List<TournamentPlayerApproval> allApprovals = playerApprovalRepository.findByTournamentId(tournamentId);
        
        if (allApprovals.isEmpty()) {
            return false; // No players registered
        }

        // At least 2 players must be approved, and we need a power of 2 bracket size
        long approvedCount = allApprovals.stream()
            .filter(a -> a.getApprovalStatus() == TournamentPlayerApproval.ApprovalStatus.APPROVED)
            .count();

        // Check if it's a power of 2 (2, 4, 8, 16, 32, etc.)
        return approvedCount >= 2 && (approvedCount & (approvedCount - 1)) == 0;
    }

    /**
     * Get list of approved players for first round pairing
     */
    public List<Player> getApprovedPlayersForTournament(Long tournamentId) {
        List<TournamentPlayerApproval> approvals = playerApprovalRepository
            .findByTournamentIdAndApprovalStatus(tournamentId, TournamentPlayerApproval.ApprovalStatus.APPROVED);

        return approvals.stream()
            .map(approval -> playerRepository.findById(approval.getPlayerId()).orElse(null))
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }

    /**
     * Generate first round pairings based on approved players
     * Can be regenerated multiple times until round 1 starts (results entered)
     */
    public void generateFirstRoundPairings(Long clubId, Long tournamentId) {
        KnockoutTournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new RuntimeException("Tournament not found"));
        
        if (!tournament.getClubId().equals(clubId)) {
            throw new RuntimeException("Tournament does not belong to this club");
        }

        // Check if round 1 has already started (matches have results)
        if (tournament.getRound1Started()) {
            throw new RuntimeException("Cannot regenerate pairings - Round 1 has already started");
        }

        // Get approved players only
        List<Player> approvedPlayers = getApprovedPlayersForTournament(tournamentId);

        // Validate bracket size (must be power of 2)
        if (approvedPlayers.size() < 2) {
            throw new RuntimeException("At least 2 approved players required");
        }
        
        if ((approvedPlayers.size() & (approvedPlayers.size() - 1)) != 0) {
            throw new RuntimeException("Number of approved players must be a power of 2 (2, 4, 8, 16, 32, etc.). Currently " + approvedPlayers.size() + " approved.");
        }

        // Generate bracket with approved players only
        BracketStructure bracket = generateBracket(approvedPlayers, tournament.getDrawType());
        
        try {
            tournament.setBracketData(objectMapper.writeValueAsString(bracket));
            tournament.setRound1Generated(true);
            tournament.setCurrentRound(1);
            tournamentRepository.save(tournament);
            log.info("Generated round 1 pairings for tournament {} with {} approved players", tournamentId, approvedPlayers.size());
        } catch (Exception e) {
            log.error("Failed to generate round 1 pairings", e);
            throw new RuntimeException("Failed to generate pairings: " + e.getMessage());
        }
    }

    /**
     * Regenerate first round pairings (can be done multiple times before round 1 starts)
     */
    public void regenerateFirstRoundPairings(Long clubId, Long tournamentId) {
        KnockoutTournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new RuntimeException("Tournament not found"));
        
        if (!tournament.getClubId().equals(clubId)) {
            throw new RuntimeException("Tournament does not belong to this club");
        }

        if (!tournament.getAllowRound1Regenerate()) {
            throw new RuntimeException("Round 1 pairings cannot be regenerated at this stage");
        }

        // Clear existing bracket data
        tournament.setBracketData(null);
        tournament.setRound1Generated(false);
        tournamentRepository.save(tournament);

        // Generate new pairings
        generateFirstRoundPairings(clubId, tournamentId);
    }

    /**
     * Mark round 1 as started (no more regeneration allowed after this)
     */
    public void markRound1Started(Long clubId, Long tournamentId) {
        KnockoutTournament tournament = tournamentRepository.findById(tournamentId)
            .orElseThrow(() -> new RuntimeException("Tournament not found"));
        
        if (!tournament.getClubId().equals(clubId)) {
            throw new RuntimeException("Tournament does not belong to this club");
        }

        if (!tournament.getRound1Generated()) {
            throw new RuntimeException("Round 1 must be generated before starting");
        }

        tournament.setRound1Started(true);
        tournament.setAllowRound1Regenerate(false);
        tournamentRepository.save(tournament);
        log.info("Round 1 started for tournament {}", tournamentId);
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
        private Integer ratingChange;
        private boolean isLuckyLoser;
        
        public BracketParticipant() {}
        
        public BracketParticipant(Long playerId, String playerName, String username, Double rating) {
            this.playerId = playerId;
            this.playerName = playerName;
            this.username = username;
            this.rating = rating;
            this.isLuckyLoser = false;
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
        public Integer getRatingChange() { return ratingChange; }
        public void setRatingChange(Integer ratingChange) { this.ratingChange = ratingChange; }
        public boolean isLuckyLoser() { return isLuckyLoser; }
        public void setLuckyLoser(boolean luckyLoser) { isLuckyLoser = luckyLoser; }
    }
    
    public static class BracketMatch {
        private int matchNumber;
        private int round;
        private BracketParticipant player1;
        private BracketParticipant player2;
        private BracketParticipant winner;
        private boolean isBye;
        private int player1Games;
        private int player2Games;
        private Integer player1RatingChange;
        private Integer player2RatingChange;
        private String status; // PENDING, APPROVED
        
        public BracketMatch() {
            this.status = "PENDING";
        }
        
        public BracketMatch(int matchNumber, int round, BracketParticipant player1, BracketParticipant player2, BracketParticipant winner) {
            this.matchNumber = matchNumber;
            this.round = round;
            this.player1 = player1;
            this.player2 = player2;
            this.winner = winner;
            this.isBye = (player2 == null && player1 != null);
            this.status = this.isBye ? "APPROVED" : "PENDING";
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
        public int getPlayer1Games() { return player1Games; }
        public void setPlayer1Games(int player1Games) { this.player1Games = player1Games; }
        public int getPlayer2Games() { return player2Games; }
        public void setPlayer2Games(int player2Games) { this.player2Games = player2Games; }
        public Integer getPlayer1RatingChange() { return player1RatingChange; }
        public void setPlayer1RatingChange(Integer player1RatingChange) { this.player1RatingChange = player1RatingChange; }
        public Integer getPlayer2RatingChange() { return player2RatingChange; }
        public void setPlayer2RatingChange(Integer player2RatingChange) { this.player2RatingChange = player2RatingChange; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}