package za.co.infratech.rispo.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.infratech.rispo.dto.request.AcknowledgeResultRequest;
import za.co.infratech.rispo.dto.request.CreateChallengeRequest;
import za.co.infratech.rispo.dto.request.ResolveFlagRequest;
import za.co.infratech.rispo.dto.response.ChallengeResponse;
import za.co.infratech.rispo.dto.response.MatchResponse;
import za.co.infratech.rispo.dto.response.PlayerFlagResponse;
import za.co.infratech.rispo.model.Player;
import za.co.infratech.rispo.repository.PlayerRepository;
import za.co.infratech.rispo.service.ChallengeService;
import za.co.infratech.rispo.service.MatchService;

import java.util.List;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "https://135.125.133.211"})
public class ChallengeController {

    private final ChallengeService challengeService;
    private final MatchService matchService;
    private final PlayerRepository playerRepository;

    @PostMapping
    public ResponseEntity<ChallengeResponse> createChallenge(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody CreateChallengeRequest request) {
        try {
            // In a real app, you'd get the player ID from the authenticated user
            // For now, we'll pass the userId directly
            ChallengeResponse response = challengeService.createChallenge(userId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating challenge", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{challengeId}/accept")
    public ResponseEntity<ChallengeResponse> acceptChallenge(
            @PathVariable Long challengeId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            ChallengeResponse response = challengeService.acceptChallenge(challengeId, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error accepting challenge", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{challengeId}/reject")
    public ResponseEntity<ChallengeResponse> rejectChallenge(
            @PathVariable Long challengeId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            ChallengeResponse response = challengeService.rejectChallenge(challengeId, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error rejecting challenge", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{challengeId}/cancel")
    public ResponseEntity<ChallengeResponse> cancelChallenge(
            @PathVariable Long challengeId,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            ChallengeResponse response = challengeService.cancelChallenge(challengeId, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error cancelling challenge", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/incoming")
    public ResponseEntity<List<ChallengeResponse>> getIncomingChallenges(
            @RequestHeader("X-User-Id") Long userId) {
        try {
            List<ChallengeResponse> challenges = challengeService.getIncomingChallenges(userId);
            return ResponseEntity.ok(challenges);
        } catch (Exception e) {
            log.error("Error getting incoming challenges", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/outgoing")
    public ResponseEntity<List<ChallengeResponse>> getOutgoingChallenges(
            @RequestHeader("X-User-Id") Long userId) {
        try {
            List<ChallengeResponse> challenges = challengeService.getOutgoingChallenges(userId);
            return ResponseEntity.ok(challenges);
        } catch (Exception e) {
            log.error("Error getting outgoing challenges", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<ChallengeResponse>> getUpcomingChallenges() {
        try {
            List<ChallengeResponse> challenges = challengeService.getUpcomingChallenges();
            return ResponseEntity.ok(challenges);
        } catch (Exception e) {
            log.error("Error getting upcoming challenges", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/flags/player/{playerId}")
    public ResponseEntity<List<PlayerFlagResponse>> getPlayerFlags(@PathVariable Long playerId) {
        try {
            List<PlayerFlagResponse> flags = challengeService.getPlayerFlags(playerId);
            return ResponseEntity.ok(flags);
        } catch (Exception e) {
            log.error("Error getting player flags", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/flags/unresolved")
    public ResponseEntity<List<PlayerFlagResponse>> getUnresolvedFlags() {
        try {
            List<PlayerFlagResponse> flags = challengeService.getUnresolvedFlags();
            return ResponseEntity.ok(flags);
        } catch (Exception e) {
            log.error("Error getting unresolved flags", e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/flags/{flagId}/resolve")
    public ResponseEntity<Void> resolveFlag(
            @PathVariable Long flagId,
            @RequestHeader("X-User-Id") Long adminUserId,
            @RequestBody ResolveFlagRequest request) {
        try {
            challengeService.resolveFlag(flagId, adminUserId, request);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error resolving flag", e);
            return ResponseEntity.badRequest().build();
        }
    }
}
