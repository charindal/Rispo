package za.co.infratech.rispo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.infratech.rispo.dto.response.TournamentResponse;
import za.co.infratech.rispo.service.TournamentService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clubs/{clubId}/tournaments")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ClubTournamentController {
    
    private final TournamentService tournamentService;
    
    /**
     * Get all tournaments for a club, optionally filtered by approval status
     */
    @GetMapping
    public ResponseEntity<List<TournamentResponse>> getClubTournaments(
            @PathVariable Long clubId,
            @RequestParam(required = false) String approvalStatus) {
        return ResponseEntity.ok(tournamentService.getClubTournaments(clubId, approvalStatus));
    }
    
    /**
     * Create a new tournament from a template for a club
     * All club members will be automatically enrolled
     */
    @PostMapping("/from-template")
    public ResponseEntity<TournamentResponse> createTournamentFromTemplate(
            @PathVariable Long clubId,
            @RequestParam Long templateId,
            @RequestParam(required = false) String tournamentName,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            TournamentResponse response = tournamentService.createClubTournamentFromTemplate(
                    clubId, templateId, tournamentName, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
    
    /**
     * Approve a pending club tournament (club admin only)
     */
    @PatchMapping("/{tournamentId}/approve")
    public ResponseEntity<?> approveTournament(
            @PathVariable Long clubId,
            @PathVariable Long tournamentId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            TournamentResponse response = tournamentService.approveClubTournament(tournamentId, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Reject a pending club tournament (club admin only)
     */
    @PatchMapping("/{tournamentId}/reject")
    public ResponseEntity<?> rejectTournament(
            @PathVariable Long clubId,
            @PathVariable Long tournamentId,
            @RequestParam(required = false) String reason,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            TournamentResponse response = tournamentService.rejectClubTournament(tournamentId, reason, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Start an approved club tournament (club admin only)
     * This will generate the first round pairings
     */
    @PostMapping("/{tournamentId}/start")
    public ResponseEntity<?> startTournament(
            @PathVariable Long clubId,
            @PathVariable Long tournamentId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            TournamentResponse response = tournamentService.startClubTournament(tournamentId, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
