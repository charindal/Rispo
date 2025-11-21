package za.co.infratech.rispo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.infratech.rispo.dto.response.PlayerDTO;
import za.co.infratech.rispo.service.PlayerService;

import java.util.List;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class PlayerController {

    private final PlayerService playerService;

    @GetMapping
    public ResponseEntity<List<PlayerDTO>> getAllPlayers() {
        return ResponseEntity.ok(playerService.getAllPlayers());
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
            PlayerDTO player = playerService.verifyPlayer(playerId, adminUserId);
            return ResponseEntity.ok(player);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @PutMapping("/{playerId}/unverify")
    public ResponseEntity<?> unverifyPlayer(
            @PathVariable Long playerId,
            @RequestParam Long adminUserId) {
        try {
            PlayerDTO player = playerService.unverifyPlayer(playerId, adminUserId);
            return ResponseEntity.ok(player);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<PlayerDTO>> searchPlayers(
            @RequestParam Long clubId,
            @RequestParam(required = false) String searchTerm) {
        return ResponseEntity.ok(playerService.searchPlayersByClub(clubId, searchTerm));
    }

    @GetMapping("/search/global")
    public ResponseEntity<List<PlayerDTO>> searchPlayersGlobal(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long clubId) {
        return ResponseEntity.ok(playerService.searchPlayersGlobal(name, clubId));
    }

    @GetMapping("/rankings/top10")
    public ResponseEntity<List<PlayerDTO>> getTop10Players() {
        return ResponseEntity.ok(playerService.getTop10Players());
    }

    // Inner class for error responses
    private record ErrorResponse(String message) {}
}
