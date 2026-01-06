package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.model.TournamentPlayer;
import za.co.infratech.rispo.model.TournamentPlayerId;

import java.util.List;
import java.util.Optional;

@Repository
public interface TournamentPlayerRepository extends JpaRepository<TournamentPlayer, TournamentPlayerId> {
    List<TournamentPlayer> findByTournamentId(Long tournamentId);
    List<TournamentPlayer> findByPlayerId(Long playerId);
    List<TournamentPlayer> findByTournamentIdAndStatus(Long tournamentId, String status);
    Optional<TournamentPlayer> findByTournamentIdAndPlayerId(Long tournamentId, Long playerId);
    long countByTournamentIdAndStatus(Long tournamentId, String status);
}
