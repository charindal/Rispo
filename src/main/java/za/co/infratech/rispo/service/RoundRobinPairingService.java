package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import za.co.infratech.rispo.model.Player;
import za.co.infratech.rispo.model.Match;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for generating Round-Robin tournament pairings.
 * In Round-Robin, every player plays against every other player exactly once.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RoundRobinPairingService {

    /**
     * Generate all Round-Robin pairings for a tournament.
     * Uses the circle method (Berger tables) to create balanced rounds.
     * 
     * Round-Robin rules:
     * 1. Every player plays every other player exactly once
     * 2. Total matches = n(n-1)/2 where n is number of players
     * 3. Number of rounds = n-1 (even players) or n (odd players with bye each round)
     * 4. Each round has n/2 matches (or (n-1)/2 if odd, with one bye)
     * 
     * @param players List of players in the tournament
     * @param previousMatches Previous matches to avoid duplicates
     * @param requestedRound The round to generate (or 0 to generate all remaining)
     * @return List of pairings for the requested round
     */
    public List<PlayerPair> generateRoundRobinPairings(
            List<Player> players, 
            List<Match> previousMatches, 
            int requestedRound) {
        
        if (players == null || players.size() < 2) {
            throw new IllegalArgumentException("Need at least 2 players for Round-Robin");
        }

        log.info("Generating Round-Robin pairings for round {} with {} players", requestedRound, players.size());

        // Sort players by rating for consistent ordering
        List<Player> sortedPlayers = new ArrayList<>(players);
        sortedPlayers.sort((p1, p2) -> Integer.compare(p2.getRating(), p1.getRating()));

        // Build set of already played matchups
        Set<String> playedMatchups = buildPlayedMatchups(previousMatches);

        // Generate the round schedule using circle method
        List<List<PlayerPair>> allRounds = generateAllRounds(sortedPlayers);

        // Find the first round that hasn't been played yet
        int roundToGenerate = requestedRound;
        if (roundToGenerate <= 0) {
            // Auto-determine the next round
            roundToGenerate = findNextUnplayedRound(allRounds, playedMatchups);
        }

        if (roundToGenerate > allRounds.size()) {
            log.info("All rounds have been generated for this Round-Robin tournament");
            return Collections.emptyList();
        }

        // Get the pairings for the requested round (1-indexed)
        List<PlayerPair> roundPairings = allRounds.get(roundToGenerate - 1);

        // Filter out any matches that have already been played
        List<PlayerPair> newPairings = roundPairings.stream()
                .filter(pair -> !isMatchupPlayed(pair, playedMatchups))
                .collect(Collectors.toList());

        log.info("Generated {} pairings for round {}", newPairings.size(), roundToGenerate);
        return newPairings;
    }

    /**
     * Generate all rounds using the circle method (Berger tables).
     * This creates a balanced schedule where each player plays once per round.
     */
    private List<List<PlayerPair>> generateAllRounds(List<Player> players) {
        List<Player> participants = new ArrayList<>(players);
        
        // If odd number of players, add a "bye" placeholder
        boolean hasOddPlayers = participants.size() % 2 == 1;
        if (hasOddPlayers) {
            participants.add(null); // null represents a bye
        }

        int n = participants.size();
        int numRounds = n - 1;
        int matchesPerRound = n / 2;

        List<List<PlayerPair>> allRounds = new ArrayList<>();

        // Use circle method: fix player 0, rotate others
        for (int round = 0; round < numRounds; round++) {
            List<PlayerPair> roundPairings = new ArrayList<>();

            for (int match = 0; match < matchesPerRound; match++) {
                int home = (round + match) % (n - 1);
                int away = (n - 1 - match + round) % (n - 1);

                // Last player stays in place
                if (match == 0) {
                    away = n - 1;
                }

                Player player1 = participants.get(home);
                Player player2 = participants.get(away);

                // Skip byes (null players)
                if (player1 != null && player2 != null) {
                    // Alternate home/away for fairness
                    if (round % 2 == 0) {
                        roundPairings.add(new PlayerPair(player1, player2, round + 1));
                    } else {
                        roundPairings.add(new PlayerPair(player2, player1, round + 1));
                    }
                } else {
                    // Log bye
                    Player activePlayer = player1 != null ? player1 : player2;
                    if (activePlayer != null) {
                        log.debug("Round {}: {} has a bye", round + 1, activePlayer.getName());
                    }
                }
            }

            allRounds.add(roundPairings);
        }

        return allRounds;
    }

    /**
     * Build a set of matchup keys from previous matches.
     */
    private Set<String> buildPlayedMatchups(List<Match> matches) {
        Set<String> matchups = new HashSet<>();
        for (Match match : matches) {
            String key = getMatchupKey(match.getPlayer1().getId(), match.getPlayer2().getId());
            matchups.add(key);
        }
        return matchups;
    }

    /**
     * Create a consistent matchup key regardless of player order.
     */
    private String getMatchupKey(Long playerId1, Long playerId2) {
        long min = Math.min(playerId1, playerId2);
        long max = Math.max(playerId1, playerId2);
        return min + "-" + max;
    }

    /**
     * Check if a pairing has already been played.
     */
    private boolean isMatchupPlayed(PlayerPair pair, Set<String> playedMatchups) {
        String key = getMatchupKey(pair.getPlayer1().getId(), pair.getPlayer2().getId());
        return playedMatchups.contains(key);
    }

    /**
     * Find the next round that hasn't been completely played.
     */
    private int findNextUnplayedRound(List<List<PlayerPair>> allRounds, Set<String> playedMatchups) {
        for (int i = 0; i < allRounds.size(); i++) {
            List<PlayerPair> round = allRounds.get(i);
            boolean hasUnplayedMatch = round.stream()
                    .anyMatch(pair -> !isMatchupPlayed(pair, playedMatchups));
            if (hasUnplayedMatch) {
                return i + 1; // 1-indexed
            }
        }
        return allRounds.size() + 1; // All rounds complete
    }

    /**
     * Calculate the total number of rounds in a Round-Robin tournament.
     */
    public int calculateTotalRounds(int numPlayers) {
        if (numPlayers <= 1) return 0;
        // If even: n-1 rounds, if odd: n rounds (each player gets one bye)
        return numPlayers % 2 == 0 ? numPlayers - 1 : numPlayers;
    }

    /**
     * Calculate the total number of matches in a Round-Robin tournament.
     */
    public int calculateTotalMatches(int numPlayers) {
        if (numPlayers <= 1) return 0;
        return numPlayers * (numPlayers - 1) / 2;
    }

    /**
     * Represents a pairing of two players in a round-robin round.
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
            return String.format("Round %d: %s vs %s", 
                    round, player1.getName(), player2.getName());
        }
    }
}
