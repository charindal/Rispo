package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.infratech.rispo.model.*;
import za.co.infratech.rispo.repository.*;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
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

        // Determine player1Score
        double player1Score;

        if (completedGames.isEmpty()) {
            // No game records — use the match winner field directly
            if (match.getWinner() == null) {
                player1Score = 0.5; // Draw
            } else if (match.getWinner().getId().equals(match.getPlayer1().getId())) {
                player1Score = 1.0;
            } else {
                player1Score = 0.0;
            }
        } else {
            long player1Wins = completedGames.stream()
                    .filter(g -> g.getWinner() != null && g.getWinner().getId().equals(match.getPlayer1().getId()))
                    .count();
            long player2Wins = completedGames.stream()
                    .filter(g -> g.getWinner() != null && g.getWinner().getId().equals(match.getPlayer2().getId()))
                    .count();
            if (player1Wins > player2Wins) {
                player1Score = 1.0;
                match.setWinner(match.getPlayer1());
            } else if (player2Wins > player1Wins) {
                player1Score = 0.0;
                match.setWinner(match.getPlayer2());
            } else {
                player1Score = 0.5;
                match.setWinner(null);
            }
        }

        Player player1 = match.getPlayer1();
        Player player2 = match.getPlayer2();

        match.setPlayer1RatingBefore(player1.getRating());
        match.setPlayer2RatingBefore(player2.getRating());

        int[] changes = calculateRatingChanges(player1, player2, player1Score);
        int change1 = changes[0];
        int change2 = changes[1];

        int newRating1 = applyRatingBounds(player1.getRating() + change1);
        int newRating2 = applyRatingBounds(player2.getRating() + change2);

        player1.setRating(newRating1);
        player2.setRating(newRating2);

        player1.setMatchesPlayed(player1.getMatchesPlayed() + 1);
        player2.setMatchesPlayed(player2.getMatchesPlayed() + 1);

        player1.setGamesPlayed(player1.getGamesPlayed() + completedGames.size());
        player2.setGamesPlayed(player2.getGamesPlayed() + completedGames.size());

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

        match.setPlayer1RatingAfter(newRating1);
        match.setPlayer2RatingAfter(newRating2);
        match.setPlayer1RatingChange(change1);
        match.setPlayer2RatingChange(change2);
        match.setIsRated(true);

        playerRepository.save(player1);
        playerRepository.save(player2);
        matchRepository.save(match);
    }
}
