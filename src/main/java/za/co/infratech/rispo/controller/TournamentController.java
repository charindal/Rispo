package za.co.infratech.rispo.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.infratech.rispo.dto.request.TournamentRequest;
import za.co.infratech.rispo.dto.response.TournamentResponse;
import za.co.infratech.rispo.service.TournamentService;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/tournaments")
@RequiredArgsConstructor
public class TournamentController {

    private final TournamentService tournamentService;

    @PostMapping
    public ResponseEntity<TournamentResponse> createTournament(@RequestBody TournamentRequest request) {
        log.info("Creating tournament: {}", request);
        TournamentResponse response = tournamentService.createTournament(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<TournamentResponse>> getAllTournaments() {
        log.info("Fetching all tournaments");
        return ResponseEntity.ok(tournamentService.getAllTournaments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TournamentResponse> getTournamentById(@PathVariable Long id) {
        log.info("Fetching tournament with ID: {}", id);
        return ResponseEntity.ok(tournamentService.getTournamentById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTournament(@PathVariable Long id) {
        log.info("Deleting tournament with ID: {}", id);
        tournamentService.deleteTournament(id);
        return ResponseEntity.noContent().build();
    }
}

