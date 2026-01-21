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
            log.info("Updating tournament points config for club {} by user {}", clubId, userId);
            
            // Basic validation
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
                            matchData.put("status", matchNode.get("winner") != null ? "APPROVED" : "PENDING");
                            matchData.put("isBye", matchNode.get("bye").asBoolean());
                            
                            // Player 1
                            com.fasterxml.jackson.databind.JsonNode player1Node = matchNode.get("player1");
                            if (player1Node != null) {
                                java.util.Map<String, Object> player1 = new java.util.HashMap<>();
                                player1.put("playerId", player1Node.get("playerId").asLong());
                                player1.put("name", player1Node.get("playerName").asText());
                                player1.put("rating", player1Node.get("rating").asDouble());
                                matchData.put("player1", player1);
                                matchData.put("player1Games", 0); // Will need to be updated when match results are implemented
                            }
                            
                            // Player 2
                            com.fasterxml.jackson.databind.JsonNode player2Node = matchNode.get("player2");
                            if (player2Node != null && !player2Node.isNull()) {
                                java.util.Map<String, Object> player2 = new java.util.HashMap<>();
                                player2.put("playerId", player2Node.get("playerId").asLong());
                                player2.put("name", player2Node.get("playerName").asText());
                                player2.put("rating", player2Node.get("rating").asDouble());
                                matchData.put("player2", player2);
                                matchData.put("player2Games", 0);
                            } else {
                                matchData.put("player2", null);
                                matchData.put("player2Games", 0);
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
    
    // Helper method to create error response
    private static class Map {
        public static java.util.Map<String, String> of(String key, String value) {
            java.util.Map<String, String> map = new java.util.HashMap<>();
            map.put(key, value);
            return map;
        }
    }
}