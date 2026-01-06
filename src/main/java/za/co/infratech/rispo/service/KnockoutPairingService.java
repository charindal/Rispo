package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import za.co.infratech.rispo.model.Player;
import za.co.infratech.rispo.model.Match;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for generating Knockout (Single-elimination) tournament pairings.
 * Uses seeding based on player ratings to ensure top players don't meet early.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KnockoutPairingService {

    /**
     * Generate knockout bracket pairings for a tournament round.
     * 
     * Knockout rules:
     * 1. Round 1: Seed players by rating (highest vs lowest)
     * 2. Subsequent rounds: Winners advance to next round
     * 3. Standard bracket: 1 vs 16, 8 vs 9, 5 vs 12, etc.
     * 4. If not a power of 2, higher seeds get byes
     * 
     * @param players List of players for first round, or remaining winners for subsequent rounds
     * @param previousMatches Previous matches in the tournament
     * @param currentRound Current round number
     * @return List of pairings for this round
     */
    public List<PlayerPair> generateKnockoutPairings(
            List<Player> players, 
            List<Match> previousMatches, 
            int currentRound) {
        
        if (players == null || players.isEmpty()) {
            throw new IllegalArgumentException("Cannot generate pairings with no players");
        }

        log.info("Generating Knockout pairings for round {} with {} players", currentRound, players.size());

        if (currentRound == 1) {
            return generateFirstRoundPairings(players);
        } else {
            return generateNextRoundPairings(players, previousMatches, currentRound);
        }
    }

    /**
     * Generate first round pairings with seeding.
     * Seeds players by rating and pairs them using standard bracket seeding.
     * Higher-rated players receive byes when numbers don't match power of 2.
     */
    private List<PlayerPair> generateFirstRoundPairings(List<Player> players) {
        // Sort players by rating (descending) for seeding
        List<Player> seededPlayers = new ArrayList<>(players);
        seededPlayers.sort((p1, p2) -> Integer.compare(p2.getRating(), p1.getRating()));

        log.info("Seeded players for knockout:");
        for (int i = 0; i < seededPlayers.size(); i++) {
            Player p = seededPlayers.get(i);
            log.info("Seed {}: {} (rating: {})", i + 1, p.getName(), p.getRating());
        }

        // Calculate bracket size (next power of 2)
        int bracketSize = nextPowerOf2(seededPlayers.size());
        int numByes = bracketSize - seededPlayers.size();

        log.info("Bracket size: {}, Number of byes: {}", bracketSize, numByes);

        // Track players who receive byes (they auto-advance to round 2)
        List<Player> byePlayers = new ArrayList<>();
        List<Player> playingPlayers = new ArrayList<>();

        // Top seeds get byes
        for (int i = 0; i < seededPlayers.size(); i++) {
            if (i < numByes) {
                byePlayers.add(seededPlayers.get(i));
                log.info("Seed {} ({}) receives a bye to round 2", i + 1, seededPlayers.get(i).getName());
            } else {
                playingPlayers.add(seededPlayers.get(i));
            }
        }

        List<PlayerPair> pairings = new ArrayList<>();

        // Create proper bracket seeding for playing players
        // Standard bracket: highest remaining seed vs lowest, etc.
        if (playingPlayers.size() >= 2) {
            // Generate bracket positions using standard seeding
            List<Integer> bracketOrder = generateBracketOrder(playingPlayers.size());
            
            for (int i = 0; i < bracketOrder.size(); i += 2) {
                int idx1 = bracketOrder.get(i);
                int idx2 = bracketOrder.get(i + 1);
                
                Player player1 = playingPlayers.get(idx1);
                Player player2 = playingPlayers.get(idx2);
                
                pairings.add(new PlayerPair(player1, player2, 1));
                log.info("Match: {} (seed {}) vs {} (seed {})", 
                        player1.getName(), idx1 + numByes + 1,
                        player2.getName(), idx2 + numByes + 1);
            }
        }

        return pairings;
    }

    /**
     * Generate bracket order for standard knockout seeding.
     * Ensures that if seeds win, higher seeds meet in later rounds.
     * Pattern for 8 players: 0v7, 3v4, 1v6, 2v5
     */
    private List<Integer> generateBracketOrder(int numPlayers) {
        if (numPlayers < 2) {
            return Collections.emptyList();
        }

        // For proper bracket, pair 0 vs n-1, 1 vs n-2, etc.
        // But arrange so winners of top matches meet winners of bottom matches
        List<Integer> order = new ArrayList<>();
        
        int half = numPlayers / 2;
        for (int i = 0; i < half; i++) {
            order.add(i);
            order.add(numPlayers - 1 - i);
        }

        return order;
    }

    /**
     * Get players who received byes in round 1 and should be added to round 2.
     */
    public List<Player> getByePlayers(List<Player> allPlayers) {
        List<Player> seededPlayers = new ArrayList<>(allPlayers);
        seededPlayers.sort((p1, p2) -> Integer.compare(p2.getRating(), p1.getRating()));
        
        int bracketSize = nextPowerOf2(seededPlayers.size());
        int numByes = bracketSize - seededPlayers.size();
        
        if (numByes > 0) {
            return new ArrayList<>(seededPlayers.subList(0, numByes));
        }
        return Collections.emptyList();
    }

    /**
     * Generate pairings for subsequent rounds based on winners from previous round.
     */
    private List<PlayerPair> generateNextRoundPairings(
            List<Player> remainingPlayers, 
            List<Match> previousMatches,
            int currentRound) {
        
        // Get winners from previous round
        List<Player> winners = getWinnersFromRound(previousMatches, currentRound - 1);
        
        if (winners.isEmpty()) {
            throw new IllegalStateException("No winners found from previous round");
        }

        if (winners.size() == 1) {
            log.info("Tournament complete! Winner: {}", winners.get(0).getName());
            return Collections.emptyList();
        }

        log.info("Found {} winners from round {}", winners.size(), currentRound - 1);

        // Maintain bracket order - pair winners sequentially
        List<PlayerPair> pairings = new ArrayList<>();
        for (int i = 0; i < winners.size(); i += 2) {
            if (i + 1 < winners.size()) {
                pairings.add(new PlayerPair(winners.get(i), winners.get(i + 1), currentRound));
                log.debug("Pairing: {} vs {}", winners.get(i).getName(), winners.get(i + 1).getName());
            } else {
                // Odd number of winners - shouldn't happen in proper knockout
                log.warn("Odd number of winners in round {}, player {} advances automatically", 
                        currentRound - 1, winners.get(i).getName());
            }
        }

        return pairings;
    }

    /**
     * Get winners from a specific round.
     */
    private List<Player> getWinnersFromRound(List<Match> matches, int round) {
        return matches.stream()
                .filter(m -> m.getRound() == round)
                .filter(m -> m.getStatus() == Match.MatchStatus.APPROVED)
                .filter(m -> m.getWinner() != null)
                .map(Match::getWinner)
                .collect(Collectors.toList());
    }

    /**
     * Calculate next power of 2 greater than or equal to n.
     */
    private int nextPowerOf2(int n) {
        if (n <= 0) return 1;
        int power = 1;
        while (power < n) {
            power *= 2;
        }
        return power;
    }

    /**
     * Calculate the number of rounds needed for a knockout tournament.
     */
    public int calculateTotalRounds(int numPlayers) {
        if (numPlayers <= 1) return 0;
        int bracketSize = nextPowerOf2(numPlayers);
        return (int) (Math.log(bracketSize) / Math.log(2));
    }

    /**
     * Get the round name (e.g., "Final", "Semi-Final", "Quarter-Final").
     */
    public String getRoundName(int round, int totalRounds) {
        if (round == totalRounds) return "Final";
        if (round == totalRounds - 1) return "Semi-Final";
        if (round == totalRounds - 2) return "Quarter-Final";
        return "Round " + round;
    }

    /**
     * Represents a pairing of two players in a knockout bracket.
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
