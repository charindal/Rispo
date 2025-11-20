package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.infratech.rispo.model.*;
import za.co.infratech.rispo.repository.*;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RatingEngine {

    private final RatingSettingsRepository ratingSettingsRepository;
    private final PlayerRepository playerRepository;
    private final GameRepository gameRepository;
    private final MatchRepository matchRepository;

    /**
     * Calculate expected score for player A against player B
     * E_A = 1 / (1 + 10^((R_B - R_A) / 400))
     */
    private double calculateExpectedScore(int ratingA, int ratingB) {
        return 1.0 / (1.0 + Math.pow(10.0, (ratingB - ratingA) / 400.0));
    }

    /**
     * Get K-factor based on player's games played
     */
    private int getKFactor(Player player) {
        RatingSettings settings = getRatingSettings();
        
        // Count only completed games that were rated
        int ratedGamesCount = player.getGamesPlayed() != null ? player.getGamesPlayed() : 0;
        
        if (ratedGamesCount < settings.getProvisionalGamesCount()) {
            return settings.getProvisionalKFactor();
        } else {
            return settings.getEstablishedKFactor();
        }
    }

    /**
     * Get current rating settings (or default)
     */
    private RatingSettings getRatingSettings() {
        return ratingSettingsRepository.findFirstByOrderByIdDesc()
                .orElseGet(() -> {
                    RatingSettings defaults = new RatingSettings();
                    defaults.setProvisionalGamesCount(100);
                    defaults.setProvisionalKFactor(40);
                    defaults.setEstablishedKFactor(20);
                    defaults.setMinRating(400);
                    defaults.setMaxRating(3000);
                    defaults.setDefaultRating(1200);
                    return defaults;
                });
    }

    /**
     * Apply rating bounds
     */
    private int applyRatingBounds(int rating) {
        RatingSettings settings = getRatingSettings();
        if (rating < settings.getMinRating()) {
            return settings.getMinRating();
        }
        if (rating > settings.getMaxRating()) {
            return settings.getMaxRating();
        }
        return rating;
    }

    /**
     * Calculate rating changes for a match
     * Returns array: [player1RatingChange, player2RatingChange]
     */
    public int[] calculateRatingChanges(Player player1, Player player2, double player1Score) {
        int rating1 = player1.getRating();
        int rating2 = player2.getRating();
        
        // Calculate expected scores
        double expected1 = calculateExpectedScore(rating1, rating2);
        double expected2 = 1.0 - expected1;
        
        // Get K-factors
        int k1 = getKFactor(player1);
        int k2 = getKFactor(player2);
        
        // Calculate rating changes
        int change1 = (int) Math.round(k1 * (player1Score - expected1));
        int change2 = (int) Math.round(k2 * ((1.0 - player1Score) - expected2));
        
        return new int[]{change1, change2};
    }

    /**
     * Process and apply ratings for an approved match
     */
    @Transactional
    public void processMatchRating(Long matchId) throws Exception {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new Exception("Match not found"));

        if (match.getIsRated()) {
            throw new Exception("Match has already been rated");
        }

        if (match.getStatus() != Match.MatchStatus.APPROVED) {
            throw new Exception("Only approved matches can be rated");
        }

        // Get all completed games for this match
        List<Game> games = gameRepository.findByMatchId(matchId);
        
        // Filter only completed games (exclude NO_RESULT, ABANDONED, CANCELLED)
        List<Game> completedGames = games.stream()
                .filter(g -> g.getResultType() == Game.GameResultType.COMPLETED)
                .toList();

        if (completedGames.isEmpty()) {
            throw new Exception("No completed games found for this match");
        }

        // Count wins for each player
        long player1Wins = completedGames.stream()
                .filter(g -> g.getWinner() != null && g.getWinner().getId().equals(match.getPlayer1().getId()))
                .count();
        
        long player2Wins = completedGames.stream()
                .filter(g -> g.getWinner() != null && g.getWinner().getId().equals(match.getPlayer2().getId()))
                .count();
        
        long draws = completedGames.stream()
                .filter(g -> g.getWinner() == null)
                .count();

        // Calculate match score (1 = player1 won, 0 = player2 won, 0.5 = draw)
        double player1Score;
        if (player1Wins > player2Wins) {
            player1Score = 1.0;
            match.setWinner(match.getPlayer1());
        } else if (player2Wins > player1Wins) {
            player1Score = 0.0;
            match.setWinner(match.getPlayer2());
        } else {
            player1Score = 0.5; // Draw
            match.setWinner(null);
        }

        Player player1 = match.getPlayer1();
        Player player2 = match.getPlayer2();

        // Save ratings before calculation
        match.setPlayer1RatingBefore(player1.getRating());
        match.setPlayer2RatingBefore(player2.getRating());

        // Calculate rating changes
        int[] changes = calculateRatingChanges(player1, player2, player1Score);
        int change1 = changes[0];
        int change2 = changes[1];

        // Apply new ratings with bounds
        int newRating1 = applyRatingBounds(player1.getRating() + change1);
        int newRating2 = applyRatingBounds(player2.getRating() + change2);

        // Update players
        player1.setRating(newRating1);
        player2.setRating(newRating2);

        // Update match statistics
        player1.setMatchesPlayed(player1.getMatchesPlayed() + 1);
        player2.setMatchesPlayed(player2.getMatchesPlayed() + 1);

        // Update games played count (only completed games)
        player1.setGamesPlayed(player1.getGamesPlayed() + (int) completedGames.size());
        player2.setGamesPlayed(player2.getGamesPlayed() + (int) completedGames.size());

        // Update win/loss/draw counts
        if (player1Score == 1.0) {
            player1.setWins(player1.getWins() + 1);
            player2.setLosses(player2.getLosses() + 1);
        } else if (player1Score == 0.0) {
            player1.setLosses(player1.getLosses() + 1);
            player2.setWins(player2.getWins() + 1);
        } else {
            player1.setDraws(player1.getDraws() + 1);
            player2.setDraws(player2.getDraws() + 1);
        }

        // Save rating changes to match
        match.setPlayer1RatingAfter(newRating1);
        match.setPlayer2RatingAfter(newRating2);
        match.setPlayer1RatingChange(change1);
        match.setPlayer2RatingChange(change2);
        match.setIsRated(true);

        // Persist changes
        playerRepository.save(player1);
        playerRepository.save(player2);
        matchRepository.save(match);
    }

    /**
     * Reverse ratings if a match is rejected after being rated
     */
    @Transactional
    public void reverseMatchRating(Long matchId) throws Exception {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new Exception("Match not found"));

        if (!match.getIsRated()) {
            throw new Exception("Match has not been rated");
        }

        Player player1 = match.getPlayer1();
        Player player2 = match.getPlayer2();

        // Reverse the rating changes
        player1.setRating(match.getPlayer1RatingBefore());
        player2.setRating(match.getPlayer2RatingBefore());

        // Reverse match count
        player1.setMatchesPlayed(Math.max(0, player1.getMatchesPlayed() - 1));
        player2.setMatchesPlayed(Math.max(0, player2.getMatchesPlayed() - 1));

        // Get completed games count
        List<Game> games = gameRepository.findByMatchId(matchId);
        int completedGamesCount = (int) games.stream()
                .filter(g -> g.getResultType() == Game.GameResultType.COMPLETED)
                .count();

        // Reverse games played count
        player1.setGamesPlayed(Math.max(0, player1.getGamesPlayed() - completedGamesCount));
        player2.setGamesPlayed(Math.max(0, player2.getGamesPlayed() - completedGamesCount));

        // Reverse win/loss/draw counts
        if (match.getWinner() != null) {
            if (match.getWinner().getId().equals(player1.getId())) {
                player1.setWins(Math.max(0, player1.getWins() - 1));
                player2.setLosses(Math.max(0, player2.getLosses() - 1));
            } else {
                player2.setWins(Math.max(0, player2.getWins() - 1));
                player1.setLosses(Math.max(0, player1.getLosses() - 1));
            }
        } else {
            player1.setDraws(Math.max(0, player1.getDraws() - 1));
            player2.setDraws(Math.max(0, player2.getDraws() - 1));
        }

        // Mark as not rated
        match.setIsRated(false);
        match.setPlayer1RatingAfter(null);
        match.setPlayer2RatingAfter(null);
        match.setPlayer1RatingChange(null);
        match.setPlayer2RatingChange(null);

        // Persist changes
        playerRepository.save(player1);
        playerRepository.save(player2);
        matchRepository.save(match);
    }
}
