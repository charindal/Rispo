package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import za.co.infratech.rispo.dto.request.TournamentRequest;
import za.co.infratech.rispo.dto.response.TournamentResponse;
import za.co.infratech.rispo.model.Tournament;
import za.co.infratech.rispo.repository.TournamentRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TournamentService {

    private final TournamentRepository tournamentRepository;

    public TournamentResponse createTournament(TournamentRequest request) {
        log.info("Creating tournament: {}", request);

        Tournament tournament = new Tournament();
        tournament.setName(request.getName());
        tournament.setStartDate(LocalDate.parse(request.getStartDate()));
        tournament.setEndDate(LocalDate.parse(request.getEndDate()));

        Tournament saved = tournamentRepository.save(tournament);
        return new TournamentResponse(saved.getId(), saved.getName(), saved.getStartDate(), saved.getEndDate());
    }

    public List<TournamentResponse> getAllTournaments() {
        return tournamentRepository.findAll().stream()
                .map(t -> new TournamentResponse(t.getId(), t.getName(), t.getStartDate(), t.getEndDate()))
                .collect(Collectors.toList());
    }

    public TournamentResponse getTournamentById(Long id) {
        Tournament t = tournamentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tournament not found with id " + id));

        return new TournamentResponse(t.getId(), t.getName(), t.getStartDate(), t.getEndDate());
    }

    public void deleteTournament(Long id) {
        log.info("Deleting tournament with id: {}", id);
        tournamentRepository.deleteById(id);
    }
}
