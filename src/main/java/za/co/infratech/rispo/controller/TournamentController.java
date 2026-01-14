package za.co.infratech.rispo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.infratech.rispo.dto.request.TournamentCreateRequest;
import za.co.infratech.rispo.dto.request.TournamentUpdateRequest;
import za.co.infratech.rispo.dto.request.TournamentMatchResultRequest;
import za.co.infratech.rispo.dto.response.TournamentPlayerResponse;
import za.co.infratech.rispo.dto.response.TournamentResponse;
import za.co.infratech.rispo.dto.response.MatchResponse;
import za.co.infratech.rispo.service.TournamentService;
import za.co.infratech.rispo.service.MatchService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TournamentController {

    private final TournamentService tournamentService;
    private final MatchService matchService;

    @PostMapping
    public ResponseEntity<TournamentResponse> createTournament(
            @RequestBody TournamentCreateRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            TournamentResponse tournament = tournamentService.createTournament(request, userId);
            return ResponseEntity.ok(tournament);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{tournamentId}")
    public ResponseEntity<TournamentResponse> updateTournament(
            @PathVariable Long tournamentId,
            @RequestBody TournamentUpdateRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            TournamentResponse tournament = tournamentService.updateTournament(tournamentId, request, userId);
            return ResponseEntity.ok(tournament);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{tournamentId}/publish")
    public ResponseEntity<TournamentResponse> publishTournament(
            @PathVariable Long tournamentId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            TournamentResponse tournament = tournamentService.publishTournament(tournamentId, userId);
            return ResponseEntity.ok(tournament);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{tournamentId}")
    public ResponseEntity<Void> deleteTournament(
            @PathVariable Long tournamentId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            tournamentService.deleteTournament(tournamentId, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<TournamentResponse>> getAllTournaments() {
        List<TournamentResponse> tournaments = tournamentService.getAllTournaments();
        return ResponseEntity.ok(tournaments);
    }

    @GetMapping("/published")
    public ResponseEntity<List<TournamentResponse>> getPublishedTournaments() {
        List<TournamentResponse> tournaments = tournamentService.getPublishedTournaments();
        return ResponseEntity.ok(tournaments);
    }

    @GetMapping("/{tournamentId}")
    public ResponseEntity<TournamentResponse> getTournamentById(@PathVariable Long tournamentId) {
        try {
            TournamentResponse tournament = tournamentService.getTournamentById(tournamentId);
            return ResponseEntity.ok(tournament);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{tournamentId}/join")
    public ResponseEntity<TournamentPlayerResponse> joinTournament(
            @PathVariable Long tournamentId,
            @RequestHeader("X-Player-Id") Long playerId) {
        try {
            TournamentPlayerResponse response = tournamentService.joinTournament(tournamentId, playerId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{tournamentId}/players/{playerId}/approve")
    public ResponseEntity<?> approveJoinRequest(
            @PathVariable Long tournamentId,
            @PathVariable Long playerId,
            @RequestHeader(value = "X-User-Id", required = false) Long adminUserId) {
        try {
            if (adminUserId == null) {
                return ResponseEntity.badRequest().body("User ID is required");
            }
            TournamentPlayerResponse response = tournamentService.approveJoinRequest(tournamentId, playerId, adminUserId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{tournamentId}/players/{playerId}/reject")
    public ResponseEntity<?> rejectJoinRequest(
            @PathVariable Long tournamentId,
            @PathVariable Long playerId,
            @RequestHeader(value = "X-User-Id", required = false) Long adminUserId) {
        try {
            if (adminUserId == null) {
                return ResponseEntity.badRequest().body("User ID is required");
            }
            TournamentPlayerResponse response = tournamentService.rejectJoinRequest(tournamentId, playerId, adminUserId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{tournamentId}/players")
    public ResponseEntity<List<TournamentPlayerResponse>> getTournamentPlayers(@PathVariable Long tournamentId) {
        List<TournamentPlayerResponse> players = tournamentService.getTournamentPlayers(tournamentId);
        return ResponseEntity.ok(players);
    }

    @GetMapping("/{tournamentId}/requests")
    public ResponseEntity<List<TournamentPlayerResponse>> getTournamentPendingRequests(@PathVariable Long tournamentId) {
        List<TournamentPlayerResponse> requests = tournamentService.getTournamentPendingRequests(tournamentId);
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/{tournamentId}/generate-matches")
    public ResponseEntity<?> generateTournamentMatches(
            @PathVariable Long tournamentId,
            @RequestParam(required = false) Integer round,
            @RequestHeader("X-User-Id") Long adminUserId) {
        try {
            List<za.co.infratech.rispo.model.Match> matches = tournamentService.generateTournamentMatches(
                    tournamentId, round, adminUserId);
            return ResponseEntity.ok(Map.of(
                    "message", "Successfully generated " + matches.size() + " matches",
                    "matchCount", matches.size(),
                    "round", matches.isEmpty() ? 0 : matches.get(0).getRound()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{tournamentId}/matches")
    public ResponseEntity<List<MatchResponse>> getTournamentMatches(
            @PathVariable Long tournamentId,
            @RequestParam(required = false) Integer round) {
        List<MatchResponse> matches = matchService.getTournamentMatches(tournamentId, round);
        return ResponseEntity.ok(matches);
    }

    @GetMapping("/{tournamentId}/standings")
    public ResponseEntity<?> getTournamentStandings(@PathVariable Long tournamentId) {
        try {
            var standings = tournamentService.getTournamentStandings(tournamentId);
            return ResponseEntity.ok(standings);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{tournamentId}/crosstable")
    public ResponseEntity<?> getTournamentCrossTable(@PathVariable Long tournamentId) {
        try {
            var crossTable = tournamentService.getTournamentCrossTable(tournamentId);
            return ResponseEntity.ok(crossTable);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{tournamentId}/bracket")
    public ResponseEntity<?> getKnockoutBracket(@PathVariable Long tournamentId) {
        try {
            var bracket = tournamentService.getKnockoutBracket(tournamentId);
            return ResponseEntity.ok(bracket);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{tournamentId}/close")
    public ResponseEntity<?> closeTournament(
            @PathVariable Long tournamentId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            TournamentResponse tournament = tournamentService.closeTournament(tournamentId, userId);
            return ResponseEntity.ok(Map.of(
                    "message", "Tournament closed successfully",
                    "tournament", tournament
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{tournamentId}/matches/{matchId}/result")
    public ResponseEntity<?> updateTournamentMatchResult(
            @PathVariable Long tournamentId,
            @PathVariable Long matchId,
            @RequestBody TournamentMatchResultRequest request,
            @RequestHeader("X-User-Id") Long adminUserId) {
        try {
            var match = tournamentService.updateTournamentMatchResult(matchId, request, adminUserId);
            return ResponseEntity.ok(Map.of(
                    "message", "Match result updated successfully",
                    "matchId", match.getId(),
                    "status", match.getStatus().toString(),
                    "winnerId", match.getWinner() != null ? match.getWinner().getId() : null
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
