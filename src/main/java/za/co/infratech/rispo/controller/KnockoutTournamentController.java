package za.co.infratech.rispo.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.infratech.rispo.dto.KnockoutTournamentDTO;
import za.co.infratech.rispo.dto.TournamentLeaderboardDTO;
import za.co.infratech.rispo.entity.TournamentPointsConfig;
import za.co.infratech.rispo.service.KnockoutTournamentService;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/clubs")
@CrossOrigin(origins = {"http://localhost:3000", "http://135.125.133.211"})
public class KnockoutTournamentController {
    
    @Autowired
    private KnockoutTournamentService tournamentService;
    
    @GetMapping("/{clubId}/knockout-tournaments")
    public ResponseEntity<List<KnockoutTournamentDTO>> getClubTournaments(
            @PathVariable Long clubId,
            @RequestParam(required = false) Integer year) {
        
        try {
            log.info("Fetching knockout tournaments for club {} and year {}", clubId, year);
            List<KnockoutTournamentDTO> tournaments = tournamentService.getClubTournaments(clubId, year);
            return ResponseEntity.ok(tournaments);
        } catch (Exception e) {
            log.error("Error fetching tournaments for club {}", clubId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping("/{clubId}/knockout-tournaments")
    public ResponseEntity<?> createKnockoutTournament(
            @PathVariable Long clubId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false, defaultValue = "RANDOM") String drawType,
            @RequestParam(required = false) String tournamentName,
            @RequestParam(required = false, defaultValue = "WEEKLY") String tournamentType) {
        
        try {
            // Parse draw type
            za.co.infratech.rispo.entity.KnockoutTournament.DrawType tournamentDrawType;
            try {
                tournamentDrawType = za.co.infratech.rispo.entity.KnockoutTournament.DrawType.valueOf(drawType.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid draw type. Use RANDOM or SEEDED"));
            }
            
            // Parse tournament type
            KnockoutTournamentService.TournamentFrequency frequency;
            try {
                frequency = KnockoutTournamentService.TournamentFrequency.valueOf(tournamentType.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid tournament type. Use WEEKLY, MONTHLY, or ONCE_OFF"));
            }
            
            log.info("Creating {} tournament for club {} by user {} with {} draw", frequency, clubId, userId, tournamentDrawType);
            KnockoutTournamentDTO tournament = tournamentService.createKnockoutTournament(clubId, userId, tournamentDrawType, tournamentName, frequency);
            return ResponseEntity.ok(tournament);
        } catch (RuntimeException e) {
            log.warn("Failed to create tournament for club {}: {}", clubId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating tournament for club {}", clubId, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to create tournament"));
        }
    }
    
    // Keep the legacy weekly tournament endpoint for backwards compatibility
    @PostMapping("/{clubId}/knockout-tournaments/weekly")
    public ResponseEntity<?> createWeeklyTournament(
            @PathVariable Long clubId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(required = false, defaultValue = "RANDOM") String drawType) {
        
        return createKnockoutTournament(clubId, userId, drawType, null, "WEEKLY");
    }
    
    @GetMapping("/{clubId}/tournament-leaderboard")
    public ResponseEntity<List<TournamentLeaderboardDTO>> getLeaderboard(
            @PathVariable Long clubId,
            @RequestParam(required = false) Integer year) {
        
        try {
            log.info("Fetching tournament leaderboard for club {} and year {}", clubId, year);
            List<TournamentLeaderboardDTO> leaderboard = tournamentService.getClubTournamentLeaderboard(clubId, year);
            return ResponseEntity.ok(leaderboard);
        } catch (Exception e) {
            log.error("Error fetching leaderboard for club {}", clubId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/{clubId}/tournament-points-config")
    public ResponseEntity<?> updatePointsConfig(
            @PathVariable Long clubId,
            @RequestBody TournamentPointsConfig config,
            @RequestHeader("X-User-Id") Long userId) {
        
        try {
            log.info("Updating tournament points config for club {} by user {}: winner={}, runnerUp={}, semi={}, quarter={}", 
                    clubId, userId, config.getWinnerPoints(), config.getRunnerUpPoints(), 
                    config.getSemifinalistPoints(), config.getQuarterfinalistPoints());
            
            // Basic validation - check for null values first
            if (config.getWinnerPoints() == null || config.getRunnerUpPoints() == null || 
                config.getSemifinalistPoints() == null || config.getQuarterfinalistPoints() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "All point values are required"));
            }
            
            if (config.getWinnerPoints() <= 0 || config.getRunnerUpPoints() <= 0 || 
                config.getSemifinalistPoints() <= 0 || config.getQuarterfinalistPoints() <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "All point values must be greater than 0"));
            }
            
            TournamentPointsConfig updatedConfig = tournamentService.updateTournamentPointsConfig(clubId, config, userId);
            return ResponseEntity.ok(updatedConfig);
        } catch (Exception e) {
            log.error("Error updating points config for club {}", clubId, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update points configuration"));
        }
    }
    
    @PostMapping("/{clubId}/knockout-tournaments/{tournamentId}/start")
    public ResponseEntity<?> startTournament(
            @PathVariable Long clubId,
            @PathVariable Long tournamentId,
            @RequestHeader("X-User-Id") Long userId) {
        
        try {
            log.info("Starting tournament {} for club {} by user {}", tournamentId, clubId, userId);
            KnockoutTournamentDTO tournament = tournamentService.startTournament(tournamentId, clubId, userId);
            return ResponseEntity.ok(tournament);
        } catch (RuntimeException e) {
            log.warn("Failed to start tournament {}: {}", tournamentId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error starting tournament {}", tournamentId, e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to start tournament"));
        }
    }
    
    @GetMapping("/{clubId}/knockout-tournaments/{tournamentId}/bracket")
    public ResponseEntity<?> getKnockoutBracket(
            @PathVariable Long clubId,
            @PathVariable Long tournamentId) {
        try {
            log.info("Fetching knockout tournament bracket for tournament {} in club {}", tournamentId, clubId);
            
            // Get the knockout tournament
            KnockoutTournamentDTO tournament = tournamentService.getKnockoutTournament(tournamentId, clubId);
            
            if (tournament == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Parse and return the bracket data
            if (tournament.getBracketData() != null && !tournament.getBracketData().isEmpty()) {
                try {
                    // Parse the bracket data JSON
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.databind.JsonNode bracketNode = mapper.readTree(tournament.getBracketData());
                    
                    // Format the response similar to regular tournament bracket format
                    java.util.Map<String, Object> response = new java.util.HashMap<>();
                    response.put("tournamentId", tournament.getId());
                    response.put("tournamentName", tournament.getTournamentName());
                    response.put("status", tournament.getStatus().toString());
                    response.put("format", "KNOCKOUT");
                    
                    // Parse matches and organize by rounds
                    java.util.Map<Integer, java.util.List<java.util.Map<String, Object>>> rounds = new java.util.LinkedHashMap<>();
                    com.fasterxml.jackson.databind.JsonNode matchesNode = bracketNode.get("matches");
                    
                    if (matchesNode != null && matchesNode.isArray()) {
                        int maxRound = 0;
                        for (com.fasterxml.jackson.databind.JsonNode matchNode : matchesNode) {
                            int round = matchNode.get("round").asInt();
                            if (round > maxRound) maxRound = round;
                            
                            rounds.computeIfAbsent(round, k -> new java.util.ArrayList<>());
                            
                            java.util.Map<String, Object> matchData = new java.util.HashMap<>();
                            matchData.put("matchId", matchNode.get("matchNumber").asInt());
                            matchData.put("round", round);
                            
                            // Get status from bracket data - default to PENDING if not set
                            com.fasterxml.jackson.databind.JsonNode statusNode = matchNode.get("status");
                            String matchStatus = (statusNode != null && !statusNode.isNull()) 
                                ? statusNode.asText() 
                                : (matchNode.get("winner") != null && !matchNode.get("winner").isNull() ? "APPROVED" : "PENDING");
                            matchData.put("status", matchStatus);
                            matchData.put("isBye", matchNode.get("bye").asBoolean());
                            
                            // Get game scores from bracket data
                            com.fasterxml.jackson.databind.JsonNode p1GamesNode = matchNode.get("player1Games");
                            com.fasterxml.jackson.databind.JsonNode p2GamesNode = matchNode.get("player2Games");
                            int player1Games = (p1GamesNode != null && !p1GamesNode.isNull()) ? p1GamesNode.asInt() : 0;
                            int player2Games = (p2GamesNode != null && !p2GamesNode.isNull()) ? p2GamesNode.asInt() : 0;
                            
                            // Player 1
                            com.fasterxml.jackson.databind.JsonNode player1Node = matchNode.get("player1");
                            if (player1Node != null) {
                                java.util.Map<String, Object> player1 = new java.util.HashMap<>();
                                player1.put("playerId", player1Node.get("playerId").asLong());
                                player1.put("name", player1Node.get("playerName").asText());
                                player1.put("rating", player1Node.get("rating").asDouble());
                                // Include rating change if available
                                com.fasterxml.jackson.databind.JsonNode p1RatingChangeNode = player1Node.get("ratingChange");
                                if (p1RatingChangeNode != null && !p1RatingChangeNode.isNull()) {
                                    player1.put("ratingChange", p1RatingChangeNode.asInt());
                                }
                                matchData.put("player1", player1);
                                matchData.put("player1Games", player1Games);
                            }
                            
                            // Player 2
                            com.fasterxml.jackson.databind.JsonNode player2Node = matchNode.get("player2");
                            if (player2Node != null && !player2Node.isNull()) {
                                java.util.Map<String, Object> player2 = new java.util.HashMap<>();
                                player2.put("playerId", player2Node.get("playerId").asLong());
                                player2.put("name", player2Node.get("playerName").asText());
                                player2.put("rating", player2Node.get("rating").asDouble());
                                // Include rating change if available
                                com.fasterxml.jackson.databind.JsonNode p2RatingChangeNode = player2Node.get("ratingChange");
                                if (p2RatingChangeNode != null && !p2RatingChangeNode.isNull()) {
                                    player2.put("ratingChange", p2RatingChangeNode.asInt());
                                }
                                matchData.put("player2", player2);
                                matchData.put("player2Games", player2Games);
                            } else {
                                matchData.put("player2", null);
                                matchData.put("player2Games", 0);
                            }
                            
                            // Add match-level rating changes
                            com.fasterxml.jackson.databind.JsonNode p1RcNode = matchNode.get("player1RatingChange");
                            com.fasterxml.jackson.databind.JsonNode p2RcNode = matchNode.get("player2RatingChange");
                            if (p1RcNode != null && !p1RcNode.isNull()) {
                                matchData.put("player1RatingChange", p1RcNode.asInt());
                            }
                            if (p2RcNode != null && !p2RcNode.isNull()) {
                                matchData.put("player2RatingChange", p2RcNode.asInt());
                            }
                            
                            // Winner
                            com.fasterxml.jackson.databind.JsonNode winnerNode = matchNode.get("winner");
                            if (winnerNode != null && !winnerNode.isNull()) {
                                java.util.Map<String, Object> winner = new java.util.HashMap<>();
                                winner.put("playerId", winnerNode.get("playerId").asLong());
                                winner.put("name", winnerNode.get("playerName").asText());
                                matchData.put("winner", winner);
                            } else {
                                matchData.put("winner", null);
                            }
                            
                            rounds.get(round).add(matchData);
                        }
                        
                        // Calculate round names
                        java.util.Map<Integer, String> roundNames = new java.util.HashMap<>();
                        if (maxRound > 0) {
                            roundNames.put(maxRound, "Final");
                            if (maxRound > 1) roundNames.put(maxRound - 1, "Semi-Finals");
                            if (maxRound > 2) roundNames.put(maxRound - 2, "Quarter-Finals");
                            for (int r = 1; r <= maxRound - 3; r++) {
                                roundNames.put(r, "Round " + r);
                            }
                        }
                        
                        response.put("rounds", rounds);
                        response.put("roundNames", roundNames);
                        response.put("totalRounds", maxRound);
                        
                        // Add champion info if tournament is completed
                        if (tournament.getStatus() == za.co.infratech.rispo.entity.KnockoutTournament.TournamentStatus.COMPLETED && maxRound > 0) {
                            // Find the final match winner
                            java.util.List<java.util.Map<String, Object>> finalRoundMatches = rounds.get(maxRound);
                            if (finalRoundMatches != null && !finalRoundMatches.isEmpty()) {
                                java.util.Map<String, Object> finalMatch = finalRoundMatches.get(0);
                                @SuppressWarnings("unchecked")
                                java.util.Map<String, Object> champion = (java.util.Map<String, Object>) finalMatch.get("winner");
                                if (champion != null) {
                                    response.put("champion", champion);
                                }
                            }
                        }
                    }
                    
                    return ResponseEntity.ok(response);
                } catch (Exception e) {
                    log.error("Failed to parse bracket data for tournament {}", tournamentId, e);
                    return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to parse bracket data"));
                }
            } else {
                java.util.Map<String, Object> response = new java.util.HashMap<>();
                response.put("tournamentId", tournament.getId());
                response.put("tournamentName", tournament.getTournamentName());
                response.put("status", tournament.getStatus());
                response.put("message", "Tournament bracket not yet generated");
                return ResponseEntity.ok(response);
            }
        } catch (RuntimeException e) {
            log.warn("Failed to get knockout tournament bracket {}: {}", tournamentId, e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error getting knockout tournament bracket {}", tournamentId, e);
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to get tournament bracket"));
        }
    }

    @PutMapping("/{clubId}/knockout-tournaments/{tournamentId}/matches/{matchId}/result")
    public ResponseEntity<?> updateKnockoutMatchResult(
            @PathVariable Long clubId,
            @PathVariable Long tournamentId,
            @PathVariable Long matchId,
            @RequestBody java.util.Map<String, Object> request,
            @RequestHeader("X-User-Id") Long userId) {
        
        try {
            log.info("Updating match result {} for knockout tournament {} in club {} by user {}", 
                    matchId, tournamentId, clubId, userId);
            
            // Update the match result in the knockout tournament
            tournamentService.updateKnockoutMatchResult(clubId, tournamentId, matchId, request, userId);
            
            return ResponseEntity.ok(java.util.Map.of(
                    "message", "Match result updated successfully",
                    "matchId", matchId
            ));
        } catch (RuntimeException e) {
            log.warn("Failed to update match result {}: {}", matchId, e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error updating match result {}", matchId, e);
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to update match result"));
        }
    }

    @GetMapping("/{clubId}/tournament-points-config")
    public ResponseEntity<TournamentPointsConfig> getPointsConfig(@PathVariable Long clubId) {
        try {
            log.info("Fetching tournament points config for club {}", clubId);
            TournamentPointsConfig config = tournamentService.getTournamentPointsConfig(clubId);
            return ResponseEntity.ok(config);
        } catch (Exception e) {
            log.error("Error fetching points config for club {}", clubId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/{clubId}/knockout-tournaments/{tournamentId}/player-approvals")
    public ResponseEntity<?> getTournamentPlayersForApproval(
            @PathVariable Long clubId,
            @PathVariable Long tournamentId) {
        try {
            log.info("Fetching players for approval in tournament {} for club {}", tournamentId, clubId);
            List<java.util.Map<String, Object>> players = tournamentService.getTournamentPlayersForApproval(clubId, tournamentId);
            return ResponseEntity.ok(players);
        } catch (RuntimeException e) {
            log.warn("Failed to get players for approval {}: {}", tournamentId, e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching players for approval in tournament {}", tournamentId, e);
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to get players for approval"));
        }
    }
    
    @PatchMapping("/{clubId}/knockout-tournaments/{tournamentId}/approve-player/{playerId}")
    public ResponseEntity<?> approvePlayerForTournament(
            @PathVariable Long clubId,
            @PathVariable Long tournamentId,
            @PathVariable Long playerId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            log.info("Approving player {} for tournament {} in club {}", playerId, tournamentId, clubId);
            tournamentService.approvePlayerForTournament(clubId, tournamentId, playerId, userId);
            return ResponseEntity.ok(java.util.Map.of("message", "Player approved successfully"));
        } catch (RuntimeException e) {
            log.warn("Failed to approve player {}: {}", playerId, e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error approving player {} for tournament {}", playerId, tournamentId, e);
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to approve player"));
        }
    }
    
    @PatchMapping("/{clubId}/knockout-tournaments/{tournamentId}/reject-player/{playerId}")
    public ResponseEntity<?> rejectPlayerForTournament(
            @PathVariable Long clubId,
            @PathVariable Long tournamentId,
            @PathVariable Long playerId,
            @RequestParam String reason,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            log.info("Rejecting player {} for tournament {} in club {}", playerId, tournamentId, clubId);
            tournamentService.rejectPlayerForTournament(clubId, tournamentId, playerId, reason, userId);
            return ResponseEntity.ok(java.util.Map.of("message", "Player rejected successfully"));
        } catch (RuntimeException e) {
            log.warn("Failed to reject player {}: {}", playerId, e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error rejecting player {} for tournament {}", playerId, tournamentId, e);
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to reject player"));
        }
    }
    
    @PostMapping("/{clubId}/knockout-tournaments/{tournamentId}/generate-round-1")
    public ResponseEntity<?> generateFirstRoundPairings(
            @PathVariable Long clubId,
            @PathVariable Long tournamentId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            log.info("Generating round 1 pairings for tournament {} in club {}", tournamentId, clubId);
            tournamentService.generateFirstRoundPairings(clubId, tournamentId);
            return ResponseEntity.ok(java.util.Map.of("message", "Round 1 pairings generated successfully"));
        } catch (RuntimeException e) {
            log.warn("Failed to generate round 1 pairings {}: {}", tournamentId, e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error generating round 1 pairings for tournament {}", tournamentId, e);
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to generate pairings"));
        }
    }

    @PostMapping("/{clubId}/knockout-tournaments/{tournamentId}/regenerate-round-1")
    public ResponseEntity<?> regenerateFirstRoundPairings(
            @PathVariable Long clubId,
            @PathVariable Long tournamentId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            log.info("Regenerating round 1 pairings for tournament {} in club {}", tournamentId, clubId);
            tournamentService.regenerateFirstRoundPairings(clubId, tournamentId);
            return ResponseEntity.ok(java.util.Map.of("message", "Round 1 pairings regenerated successfully"));
        } catch (RuntimeException e) {
            log.warn("Failed to regenerate round 1 pairings {}: {}", tournamentId, e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error regenerating round 1 pairings for tournament {}", tournamentId, e);
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to regenerate pairings"));
        }
    }

    @PostMapping("/{clubId}/knockout-tournaments/{tournamentId}/start-round-1")
    public ResponseEntity<?> startRound1(
            @PathVariable Long clubId,
            @PathVariable Long tournamentId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            log.info("Starting round 1 for tournament {} in club {}", tournamentId, clubId);
            tournamentService.markRound1Started(clubId, tournamentId);
            return ResponseEntity.ok(java.util.Map.of("message", "Round 1 started - pairings are now locked"));
        } catch (RuntimeException e) {
            log.warn("Failed to start round 1 {}: {}", tournamentId, e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error starting round 1 for tournament {}", tournamentId, e);
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to start round 1"));
        }
    }
    
    @GetMapping("/{clubId}/knockout-tournaments/{tournamentId}/standings")
    public ResponseEntity<?> getTournamentStandings(
            @PathVariable Long clubId,
            @PathVariable Long tournamentId) {
        try {
            log.info("Fetching standings for knockout tournament {} in club {}", tournamentId, clubId);
            java.util.List<java.util.Map<String, Object>> standings = 
                    tournamentService.getTournamentStandings(tournamentId, clubId);
            return ResponseEntity.ok(standings);
        } catch (RuntimeException e) {
            log.warn("Failed to get tournament standings {}: {}", tournamentId, e.getMessage());
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error fetching standings for tournament {}", tournamentId, e);
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to get tournament standings"));
        }
    }
    
    // Helper method to create error response
    private static class Map {
        public static java.util.Map<String, String> of(String key, String value) {
            java.util.Map<String, String> map = new java.util.HashMap<>();
            map.put(key, value);
            return map;
        }
    }
}