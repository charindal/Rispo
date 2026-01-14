package za.co.infratech.rispo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.infratech.rispo.dto.request.ClubJoinRequestRequest;
import za.co.infratech.rispo.dto.request.CreateClubRequest;
import za.co.infratech.rispo.dto.request.GenerateTokenRequest;
import za.co.infratech.rispo.dto.request.ReviewJoinRequestRequest;
import za.co.infratech.rispo.dto.request.UpdateClubRequest;
import za.co.infratech.rispo.dto.response.ClubJoinRequestResponse;
import za.co.infratech.rispo.dto.response.ClubResponse;
import za.co.infratech.rispo.dto.response.TokenResponse;
import za.co.infratech.rispo.model.Club;
import za.co.infratech.rispo.service.ClubService;

import java.util.List;

@RestController
@RequestMapping("/api/clubs")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ClubController {

    private final ClubService clubService;

    @PostMapping
    public ResponseEntity<?> createClub(
            @RequestBody CreateClubRequest request,
            @RequestHeader("X-User-Id") Long systemAdminId) {
        try {
            ClubResponse response = clubService.createClub(request, systemAdminId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/tokens")
    public ResponseEntity<?> generateToken(
            @RequestBody GenerateTokenRequest request,
            @RequestHeader("X-User-Id") Long systemAdminId) {
        try {
            TokenResponse response = clubService.generateAdminToken(request, systemAdminId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<ClubResponse>> getAllClubs() {
        return ResponseEntity.ok(clubService.getAllClubs());
    }

    @GetMapping("/active")
    public ResponseEntity<List<ClubResponse>> getActiveClubs() {
        return ResponseEntity.ok(clubService.getActiveClubs());
    }

    @GetMapping("/{clubId}")
    public ResponseEntity<?> getClubById(@PathVariable Long clubId) {
        try {
            ClubResponse response = clubService.getClubById(clubId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{clubId}/tokens")
    public ResponseEntity<List<TokenResponse>> getClubTokens(@PathVariable Long clubId) {
        return ResponseEntity.ok(clubService.getTokensByClub(clubId));
    }

    @GetMapping("/tokens/unused")
    public ResponseEntity<List<TokenResponse>> getUnusedTokens() {
        return ResponseEntity.ok(clubService.getUnusedTokens());
    }

    @GetMapping("/tokens/my-tokens")
    public ResponseEntity<List<TokenResponse>> getMyTokens(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(clubService.getTokensByGenerator(userId));
    }

    @PutMapping("/{clubId}")
    public ResponseEntity<?> updateClub(
            @PathVariable Long clubId,
            @RequestBody UpdateClubRequest request,
            @RequestHeader("X-User-Id") Long systemAdminId) {
        try {
            ClubResponse response = clubService.updateClub(clubId, request, systemAdminId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{clubId}/status")
    public ResponseEntity<?> updateClubStatus(
            @PathVariable Long clubId,
            @RequestParam String status,
            @RequestHeader("X-User-Id") Long systemAdminId) {
        try {
            Club.ClubStatus clubStatus = Club.ClubStatus.valueOf(status);
            ClubResponse response = clubService.updateClubStatus(clubId, clubStatus, systemAdminId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status: " + status);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Club Join Request Endpoints
    @PostMapping("/join-requests")
    public ResponseEntity<?> requestToJoinClub(
            @RequestBody ClubJoinRequestRequest request,
            @RequestHeader("X-Player-Id") Long playerId) {
        try {
            ClubJoinRequestResponse response = clubService.requestToJoinClub(request, playerId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/join-requests/{requestId}")
    public ResponseEntity<?> reviewJoinRequest(
            @PathVariable Long requestId,
            @RequestBody ReviewJoinRequestRequest request,
            @RequestHeader("X-User-Id") Long adminUserId) {
        try {
            ClubJoinRequestResponse response = clubService.reviewJoinRequest(requestId, request, adminUserId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{clubId}/join-requests")
    public ResponseEntity<List<ClubJoinRequestResponse>> getClubJoinRequests(
            @PathVariable Long clubId,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(clubService.getClubJoinRequests(clubId, status));
    }

    @GetMapping("/join-requests/player/{playerId}")
    public ResponseEntity<List<ClubJoinRequestResponse>> getPlayerJoinRequests(@PathVariable Long playerId) {
        return ResponseEntity.ok(clubService.getPlayerJoinRequests(playerId));
    }

    @GetMapping("/join-requests/player/{playerId}/history")
    public ResponseEntity<List<ClubJoinRequestResponse>> getPlayerJoinRequestHistory(@PathVariable Long playerId) {
        return ResponseEntity.ok(clubService.getPlayerJoinRequestHistory(playerId));
    }

    @GetMapping("/join-requests/pending")
    public ResponseEntity<List<ClubJoinRequestResponse>> getPendingJoinRequests() {
        return ResponseEntity.ok(clubService.getPendingJoinRequests());
    }

    @GetMapping("/search")
    public ResponseEntity<List<ClubResponse>> searchClubs(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String suburb) {
        return ResponseEntity.ok(clubService.searchClubs(name, city, suburb));
    }
}