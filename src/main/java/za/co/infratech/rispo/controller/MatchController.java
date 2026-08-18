package za.co.infratech.rispo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.infratech.rispo.dto.request.SubmitMatchRequest;
import za.co.infratech.rispo.dto.request.ReviewMatchRequest;
import za.co.infratech.rispo.dto.response.MatchResponse;
import za.co.infratech.rispo.service.MatchService;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "https://135.125.133.211"})
public class MatchController {

    private final MatchService matchService;

    @PostMapping
    public ResponseEntity<?> submitMatch(
            @RequestBody SubmitMatchRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            MatchResponse response = matchService.submitMatch(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PatchMapping("/{matchId}/review")
    public ResponseEntity<?> reviewMatch(
            @PathVariable Long matchId,
            @RequestBody ReviewMatchRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            MatchResponse response = matchService.reviewMatch(matchId, request, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<MatchResponse>> getAllMatches() {
        return ResponseEntity.ok(matchService.getAllMatches());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<MatchResponse>> getPendingMatches() {
        return ResponseEntity.ok(matchService.getPendingMatches());
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<MatchResponse>> getPlayerMatches(@PathVariable Long playerId) {
        return ResponseEntity.ok(matchService.getMatchesByPlayer(playerId));
    }

    @GetMapping("/{matchId}")
    public ResponseEntity<?> getMatch(@PathVariable Long matchId) {
        try {
            MatchResponse response = matchService.getMatchById(matchId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    private record ErrorResponse(String message) {}
}
