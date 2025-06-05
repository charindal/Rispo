package za.co.infratech.rispo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.infratech.rispo.dto.request.PlayerRequest;
import za.co.infratech.rispo.dto.response.PlayerResponse;
import za.co.infratech.rispo.service.PlayerService;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    @PostMapping
    public ResponseEntity<PlayerResponse> createPlayer(@RequestBody PlayerRequest request) {
        return ResponseEntity.ok(playerService.createPlayer(request));
    }
}
