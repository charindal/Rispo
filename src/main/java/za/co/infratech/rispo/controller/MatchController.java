package za.co.infratech.rispo.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.infratech.rispo.dto.request.MatchRequest;
import za.co.infratech.rispo.dto.response.MatchResponse;
import za.co.infratech.rispo.service.MatchService;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
@Slf4j
public class MatchController {

    private final MatchService matchService;

    @PostMapping
    public ResponseEntity<MatchResponse> createMatch(@RequestBody MatchRequest request) {
        log.info("Creating match: Player1={}, Player2={}, Result={}",
                request.getPlayer1Id(), request.getPlayer2Id(), request.getResult());

        MatchResponse response = matchService.createMatch(request);
        log.info("Match created with ID: {}", response.getId());

        return ResponseEntity.ok(response);
    }
}
