package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import za.co.infratech.rispo.model.Player;
import za.co.infratech.rispo.model.Match;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for generating Swiss-format tournament pairings.
 * Swiss system ensures stronger players don't meet early in the tournament.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SwissPairingService {

    /**
     * Generate Swiss pairings for a tournament round.
     * 
     * Swiss pairing rules:
     * 1. Players are sorted by score (wins), then by rating
     * 2. Top half plays bottom half within similar score groups
     * 3. Players should not play each other twice
     * 4. If odd number of players, lowest-rated unpaired player gets a bye
     * 
     * @param players List of players to pair
     * @param previousMatches Previous matches in the tournament to avoid rematches
     * @param currentRound Current round number
     * @return SwissPairingResult containing pairings and optional bye player
     */
    public SwissPairingResult generateSwissPairingsWithBye(
            List<Player> players, 
            List<Match> previousMatches, 
            int currentRound) {
        
        if (players == null || players.isEmpty()) {
            throw new IllegalArgumentException("Cannot generate pairings with no players");
        }

        log.info("Generating Swiss pairings for round {} with {} players", currentRound, players.size());

        // Create a map of player scores from previous matches
        Map<Long, Double> playerScores = calculatePlayerScores(players, previousMatches);
        
        // Create a map of previous opponents for each player
        Map<Long, Set<Long>> previousOpponents = buildOpponentHistory(previousMatches);

        // Sort players by score (descending), then by rating (descending)
        List<Player> sortedPlayers = new ArrayList<>(players);
        sortedPlayers.sort((p1, p2) -> {
            Double score1 = playerScores.getOrDefault(p1.getId(), 0.0);
            Double score2 = playerScores.getOrDefault(p2.getId(), 0.0);
            
            int scoreCompare = Double.compare(score2, score1); // Higher score first
            if (scoreCompare != 0) {
                return scoreCompare;
            }
            
            // If scores are equal, higher rating first
            return Integer.compare(p2.getRating(), p1.getRating());
        });

        // Generate pairings
        List<PlayerPair> pairings = new ArrayList<>();
        Set<Long> paired = new HashSet<>();

        // Handle odd number of players - give bye to lowest-rated unpaired player who hasn't had one
        Player byePlayer = null;
        if (sortedPlayers.size() % 2 != 0) {
            // Find the lowest-rated player who hasn't had a bye yet
            for (int i = sortedPlayers.size() - 1; i >= 0; i--) {
                Player candidate = sortedPlayers.get(i);
                // Check if player already had a bye
                if (!hadBye(candidate.getId(), previousMatches)) {
                    byePlayer = candidate;
                    sortedPlayers.remove(i);
                    log.info("Player {} (rating: {}) receives a bye for round {}", 
                            byePlayer.getName(), byePlayer.getRating(), currentRound);
                    break;
                }
            }
            // If everyone had a bye, just give it to the lowest scoring/rated player
            if (byePlayer == null && !sortedPlayers.isEmpty()) {
                byePlayer = sortedPlayers.remove(sortedPlayers.size() - 1);
                log.info("All players had byes, giving repeat bye to {} for round {}", 
                        byePlayer.getName(), currentRound);
            }
        }

        // Group players by score brackets
        Map<Double, List<Player>> scoreGroups = sortedPlayers.stream()
                .collect(Collectors.groupingBy(p -> playerScores.getOrDefault(p.getId(), 0.0)));

        // Process each score group
        List<Double> sortedScores = new ArrayList<>(scoreGroups.keySet());
        sortedScores.sort(Collections.reverseOrder());

        List<Player> unpaired = new ArrayList<>();

        for (Double score : sortedScores) {
            List<Player> group = new ArrayList<>(scoreGroups.get(score));
            group.addAll(0, unpaired); // Add any unpaired from previous groups
            unpaired.clear();

            // Try to pair within this group
            while (group.size() >= 2) {
                Player p1 = group.remove(0);
                
                if (paired.contains(p1.getId())) {
                    continue;
                }

                // Find best opponent
                Player opponent = findBestOpponent(p1, group, previousOpponents, paired);
                
                if (opponent != null) {
                    pairings.add(new PlayerPair(p1, opponent, currentRound));
                    paired.add(p1.getId());
                    paired.add(opponent.getId());
                    group.remove(opponent);
                    log.debug("Paired {} (rating: {}) vs {} (rating: {})", 
                            p1.getName(), p1.getRating(), 
                            opponent.getName(), opponent.getRating());
                } else {
                    // No valid opponent found, carry to next group
                    unpaired.add(p1);
                }
            }

            // Add remaining unpaired from this group
            unpaired.addAll(group);
        }

        // Handle remaining unpaired players (shouldn't happen often)
        while (unpaired.size() >= 2) {
            Player p1 = unpaired.remove(0);
            Player p2 = unpaired.remove(0);
            pairings.add(new PlayerPair(p1, p2, currentRound));
            paired.add(p1.getId());
            paired.add(p2.getId());
            log.warn("Force pairing (rematch possible): {} vs {}", p1.getName(), p2.getName());
        }

        // If there's still one unpaired (shouldn't happen), give them a bye
        if (!unpaired.isEmpty() && byePlayer == null) {
            byePlayer = unpaired.get(0);
            log.warn("Emergency bye for player: {}", byePlayer.getName());
        }

        log.info("Generated {} pairings for round {}, bye player: {}", 
                pairings.size(), currentRound, byePlayer != null ? byePlayer.getName() : "none");
        
        return new SwissPairingResult(pairings, byePlayer);
    }

    /**
     * Generate Swiss pairings (legacy method for backward compatibility).
     * @deprecated Use generateSwissPairingsWithBye instead for proper bye handling
     */
    public List<PlayerPair> generateSwissPairings(
            List<Player> players, 
            List<Match> previousMatches, 
            int currentRound) {
        return generateSwissPairingsWithBye(players, previousMatches, currentRound).getPairings();
    }

    /**
     * Find the best opponent for a player from available options.
     * Prefers opponent with same score who hasn't played before.
     */
    private Player findBestOpponent(Player player, List<Player> candidates, 
                                   Map<Long, Set<Long>> previousOpponents,
                                   Set<Long> alreadyPaired) {
        Set<Long> playerOpponents = previousOpponents.getOrDefault(player.getId(), Collections.emptySet());
        
        // First pass: try to find opponent who hasn't played before
        for (Player candidate : candidates) {
            if (alreadyPaired.contains(candidate.getId())) {
                continue;
            }
            if (!playerOpponents.contains(candidate.getId())) {
                return candidate;
            }
        }

        // Second pass: if all have played before, take first available
        for (Player candidate : candidates) {
            if (!alreadyPaired.contains(candidate.getId())) {
                log.warn("Forced rematch: {} vs {}", player.getName(), candidate.getName());
                return candidate;
            }
        }

        return null;
    }

    /**
     * Calculate current scores for all players based on previous matches.
     * Win = 1 point, Draw = 0.5 points, Loss = 0 points, Bye = 1 point
     */
    private Map<Long, Double> calculatePlayerScores(List<Player> players, List<Match> previousMatches) {
        Map<Long, Double> scores = new HashMap<>();
        
        // Initialize all players with 0 score
        for (Player player : players) {
            scores.put(player.getId(), 0.0);
        }

        // Calculate scores from matches
        for (Match match : previousMatches) {
            if (match.getStatus() != Match.MatchStatus.APPROVED) {
                continue; // Only count approved matches
            }

            // Handle bye matches - player gets 1 point
            if (Boolean.TRUE.equals(match.getIsBye())) {
                Long byePlayerId = match.getPlayer1().getId();
                scores.merge(byePlayerId, 1.0, Double::sum);
                continue;
            }

            Long p1Id = match.getPlayer1().getId();
            Long p2Id = match.getPlayer2().getId();

            if (match.getWinner() == null) {
                // Draw
                scores.merge(p1Id, 0.5, Double::sum);
                scores.merge(p2Id, 0.5, Double::sum);
            } else if (match.getWinner().getId().equals(p1Id)) {
                // Player 1 wins
                scores.merge(p1Id, 1.0, Double::sum);
                scores.merge(p2Id, 0.0, Double::sum);
            } else if (match.getWinner().getId().equals(p2Id)) {
                // Player 2 wins
                scores.merge(p1Id, 0.0, Double::sum);
                scores.merge(p2Id, 1.0, Double::sum);
            }
        }

        return scores;
    }

    /**
     * Build a map of previous opponents for each player.
     */
    private Map<Long, Set<Long>> buildOpponentHistory(List<Match> previousMatches) {
        Map<Long, Set<Long>> opponents = new HashMap<>();

        for (Match match : previousMatches) {
            Long p1Id = match.getPlayer1().getId();
            Long p2Id = match.getPlayer2().getId();

            opponents.computeIfAbsent(p1Id, k -> new HashSet<>()).add(p2Id);
            opponents.computeIfAbsent(p2Id, k -> new HashSet<>()).add(p1Id);
        }

        return opponents;
    }

    /**
     * Check if a player has already received a bye.
     */
    private boolean hadBye(Long playerId, List<Match> previousMatches) {
        // Check for bye matches where isBye is true and the player is player1
        return previousMatches.stream()
                .anyMatch(m -> Boolean.TRUE.equals(m.getIsBye()) && 
                         m.getPlayer1().getId().equals(playerId));
    }

    /**
     * Result class containing both pairings and optional bye player.
     */
    public static class SwissPairingResult {
        private final List<PlayerPair> pairings;
        private final Player byePlayer;

        public SwissPairingResult(List<PlayerPair> pairings, Player byePlayer) {
            this.pairings = pairings;
            this.byePlayer = byePlayer;
        }

        public List<PlayerPair> getPairings() {
            return pairings;
        }

        public Player getByePlayer() {
            return byePlayer;
        }

        public boolean hasBye() {
            return byePlayer != null;
        }
    }

    /**
     * Represents a pairing of two players.
     */
    public static class PlayerPair {
        private final Player player1;
        private final Player player2;
        private final int round;

        public PlayerPair(Player player1, Player player2, int round) {
            this.player1 = player1;
            this.player2 = player2;
            this.round = round;
        }

        public Player getPlayer1() {
            return player1;
        }

        public Player getPlayer2() {
            return player2;
        }

        public int getRound() {
            return round;
        }

        @Override
        public String toString() {
            return String.format("Round %d: %s (rating: %d) vs %s (rating: %d)", 
                    round,
                    player1.getName(), player1.getRating(),
                    player2.getName(), player2.getRating());
        }
    }
}
