package za.co.infratech.rispo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.infratech.rispo.dto.response.PlayerDTO;
import za.co.infratech.rispo.dto.response.PlayerRankingDTO;
import za.co.infratech.rispo.service.PlayerService;

import java.util.List;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "https://135.125.133.211"})
public class PlayerController {

    private final PlayerService playerService;

    @GetMapping
    public ResponseEntity<List<PlayerDTO>> getAllPlayers() {
        return ResponseEntity.ok(playerService.getAllPlayers());
    }

    @GetMapping("/{playerId}")
    public ResponseEntity<?> getPlayerById(@PathVariable Long playerId) {
        try {
            return ResponseEntity.ok(playerService.getPlayerById(playerId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/unverified")
    public ResponseEntity<List<PlayerDTO>> getUnverifiedPlayers() {
        return ResponseEntity.ok(playerService.getUnverifiedPlayers());
    }

    @PutMapping("/{playerId}/verify")
    public ResponseEntity<?> verifyPlayer(
            @PathVariable Long playerId,
            @RequestParam Long adminUserId) {
        try {
            return ResponseEntity.ok(playerService.verifyPlayer(playerId, adminUserId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{playerId}/unverify")
    public ResponseEntity<?> unverifyPlayer(
            @PathVariable Long playerId,
            @RequestParam Long adminUserId) {
        try {
            return ResponseEntity.ok(playerService.unverifyPlayer(playerId, adminUserId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<PlayerDTO>> searchPlayers(
            @RequestParam(required = false) String name) {
        return ResponseEntity.ok(playerService.searchPlayersGlobal(name));
    }

    @GetMapping("/rankings/top10")
    public ResponseEntity<List<PlayerDTO>> getTop10Players() {
        return ResponseEntity.ok(playerService.getTop10Players());
    }

    @GetMapping("/rankings")
    public ResponseEntity<List<PlayerRankingDTO>> getTop10Rankings() {
        return ResponseEntity.ok(playerService.getTop10Rankings());
    }

    @GetMapping("/{playerId}/ranking")
    public ResponseEntity<?> getPlayerRanking(@PathVariable Long playerId) {
        try {
            return ResponseEntity.ok(playerService.getPlayerRanking(playerId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/rankings/search")
    public ResponseEntity<List<PlayerRankingDTO>> searchPlayerRankings(
            @RequestParam(required = false) String searchTerm) {
        return ResponseEntity.ok(playerService.searchPlayerRankings(searchTerm));
    }

    private record ErrorResponse(String message) {}
}
