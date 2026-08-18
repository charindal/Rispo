package za.co.infratech.rispo.repository;

import org.jetbrains.annotations.NotNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.model.Match;

import java.util.List;
import java.util.Optional;

@Repository
public interface MatchRepository extends JpaRepository<Match, Long> {

    List<Match> findByPlayer1IdOrPlayer2Id(Long playerId1, Long playerId2);

    @NotNull Optional<Match> findById(@NotNull Long id);

    List<Match> findByStatus(Match.MatchStatus status);
}
