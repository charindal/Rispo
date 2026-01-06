package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import za.co.infratech.rispo.model.Player;
import za.co.infratech.rispo.model.Match;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for generating Random tournament pairings.
 * Random pairing does not use rating as seed but randomly pairs players,
 * ensuring players who have already played together won't be paired again.
 * 
 * Two modes:
 * 1. Fixed rounds: A specified number of rounds (must be less than total players)
 * 2. Everyone plays everyone: Like round robin but with random pairing order
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RandomPairingService {

    private final Random random = new Random();

    /**
     * Generate random pairings for a tournament round.
     * 
     * @param players List of players to pair
     * @param previousMatches Previous matches to avoid rematches
     * @param currentRound Current round number
     * @param everyonePlaysEveryone If true, acts like random round-robin (everyone plays everyone)
     * @return List of random pairings
     */
    public List<PlayerPair> generateRandomPairings(
            List<Player> players, 
            List<Match> previousMatches, 
            int currentRound,
            boolean everyonePlaysEveryone) {
        
        if (players == null || players.size() < 2) {
            throw new IllegalArgumentException("Need at least 2 players for random pairing");
        }

        log.info("Generating random pairings for round {} with {} players, everyonePlaysEveryone={}", 
                currentRound, players.size(), everyonePlaysEveryone);

        // Build a map of previous opponents for each player
        Map<Long, Set<Long>> previousOpponents = buildOpponentHistory(previousMatches);

        // Check if everyone has played everyone (for everyone-plays-everyone mode)
        if (everyonePlaysEveryone && allMatchupsPlayed(players, previousOpponents)) {
            log.info("All matchups have been played - tournament complete");
            return Collections.emptyList();
        }

        // Shuffle players randomly
        List<Player> shuffledPlayers = new ArrayList<>(players);
        Collections.shuffle(shuffledPlayers, random);

        List<PlayerPair> pairings = new ArrayList<>();
        Set<Long> pairedThisRound = new HashSet<>();

        // Try to pair each player with someone they haven't played
        for (Player player : shuffledPlayers) {
            if (pairedThisRound.contains(player.getId())) {
                continue;
            }

            // Find an opponent this player hasn't played yet
            Player opponent = findRandomUnplayedOpponent(player, shuffledPlayers, 
                    previousOpponents, pairedThisRound);

            if (opponent != null) {
                pairings.add(new PlayerPair(player, opponent));
                pairedThisRound.add(player.getId());
                pairedThisRound.add(opponent.getId());
            }
        }

        // Handle bye if odd number of unpaired players
        List<Player> unpairedPlayers = shuffledPlayers.stream()
                .filter(p -> !pairedThisRound.contains(p.getId()))
                .collect(Collectors.toList());

        if (unpairedPlayers.size() == 1) {
            log.info("Player {} receives a bye in round {}", 
                    unpairedPlayers.get(0).getName(), currentRound);
            // Bye is handled by not pairing this player
        } else if (unpairedPlayers.size() > 1) {
            // This can happen if the pairing constraints are too restrictive
            // Try to force pair remaining players even if they've played before
            log.warn("Cannot pair {} players without rematches in round {}", 
                    unpairedPlayers.size(), currentRound);
            
            // Only in everyonePlaysEveryone mode, don't force rematches
            if (!everyonePlaysEveryone) {
                forcePairRemainingPlayers(unpairedPlayers, pairings, pairedThisRound);
            }
        }

        log.info("Generated {} random pairings for round {}", pairings.size(), currentRound);
        return pairings;
    }

    /**
     * Check if all possible matchups have been played.
     */
    private boolean allMatchupsPlayed(List<Player> players, Map<Long, Set<Long>> previousOpponents) {
        for (int i = 0; i < players.size(); i++) {
            Player p1 = players.get(i);
            Set<Long> p1Opponents = previousOpponents.getOrDefault(p1.getId(), Collections.emptySet());
            
            for (int j = i + 1; j < players.size(); j++) {
                Player p2 = players.get(j);
                if (!p1Opponents.contains(p2.getId())) {
                    return false; // Found an unplayed matchup
                }
            }
        }
        return true;
    }

    /**
     * Find a random opponent that the player hasn't played yet.
     */
    private Player findRandomUnplayedOpponent(
            Player player,
            List<Player> allPlayers,
            Map<Long, Set<Long>> previousOpponents,
            Set<Long> pairedThisRound) {
        
        Set<Long> playerOpponents = previousOpponents.getOrDefault(player.getId(), Collections.emptySet());
        
        // Get all potential opponents (not paired, not self, not already played)
        List<Player> potentialOpponents = allPlayers.stream()
                .filter(p -> !p.getId().equals(player.getId()))
                .filter(p -> !pairedThisRound.contains(p.getId()))
                .filter(p -> !playerOpponents.contains(p.getId()))
                .collect(Collectors.toList());

        if (potentialOpponents.isEmpty()) {
            return null;
        }

        // Pick a random opponent
        return potentialOpponents.get(random.nextInt(potentialOpponents.size()));
    }

    /**
     * Force pair remaining players even if they've played before.
     * Used when we can't avoid rematches in fixed-round mode.
     */
    private void forcePairRemainingPlayers(
            List<Player> unpairedPlayers, 
            List<PlayerPair> pairings,
            Set<Long> pairedThisRound) {
        
        Collections.shuffle(unpairedPlayers, random);
        
        while (unpairedPlayers.size() >= 2) {
            Player p1 = unpairedPlayers.remove(0);
            Player p2 = unpairedPlayers.remove(0);
            pairings.add(new PlayerPair(p1, p2));
            pairedThisRound.add(p1.getId());
            pairedThisRound.add(p2.getId());
        }
    }

    /**
     * Build a map of previous opponents for each player.
     */
    private Map<Long, Set<Long>> buildOpponentHistory(List<Match> matches) {
        Map<Long, Set<Long>> opponentMap = new HashMap<>();
        
        if (matches == null) {
            return opponentMap;
        }

        for (Match match : matches) {
            Long p1Id = match.getPlayer1().getId();
            Long p2Id = match.getPlayer2().getId();
            
            opponentMap.computeIfAbsent(p1Id, k -> new HashSet<>()).add(p2Id);
            opponentMap.computeIfAbsent(p2Id, k -> new HashSet<>()).add(p1Id);
        }
        
        return opponentMap;
    }

    /**
     * Calculate the total number of rounds needed for everyone to play everyone.
     */
    public int calculateTotalRoundsForEveryonePlaysEveryone(int playerCount) {
        // With n players, we need n-1 rounds (or n rounds if odd with byes)
        return playerCount % 2 == 0 ? playerCount - 1 : playerCount;
    }

    /**
     * Calculate the maximum number of matches possible.
     */
    public int calculateTotalMatches(int playerCount) {
        return (playerCount * (playerCount - 1)) / 2;
    }

    /**
     * Validate that fixed rounds is less than the number of players.
     */
    public boolean isValidFixedRounds(int fixedRounds, int playerCount) {
        return fixedRounds > 0 && fixedRounds < playerCount;
    }

    /**
     * Represents a pairing of two players.
     */
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class PlayerPair {
        private Player player1;
        private Player player2;
    }
}
