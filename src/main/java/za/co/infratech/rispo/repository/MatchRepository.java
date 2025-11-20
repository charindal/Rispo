package za.co.infratech.rispo.repository;

import io.micrometer.common.KeyValues;
import org.jetbrains.annotations.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.model.Match;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {

    // Find all matches by player ID (both as player1 and player2)
    List<Match> findByPlayer1IdOrPlayer2Id(Long playerId1, Long playerId2);

    // Find match by ID
    @NotNull Optional<Match> findById(@NotNull Long id);

    // Find all matches for a particular player, either as player1 or player2
    List<Match> findByPlayer1Id(Long playerId);

    List<Match> findByPlayer2Id(Long playerId);

    List<Match> findAllByTournamentId(Long tournamentId);

    // Find matches by status
    List<Match> findByStatus(Match.MatchStatus status);

    // Find matches by acknowledgment status
    List<Match> findByAcknowledgmentStatus(Match.AcknowledgmentStatus acknowledgmentStatus);

    // Find match by challenge
    Optional<Match> findByChallenge(za.co.infratech.rispo.model.Challenge challenge);
}
