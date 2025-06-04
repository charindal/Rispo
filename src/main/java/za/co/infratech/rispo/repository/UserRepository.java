package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.model.UserEntity;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByUsername(String username);
}
//public interface PlayerRepository extends JpaRepository<Player, Long> {}
//public interface MatchRepository extends JpaRepository<Match, Long> {}
//public interface TournamentRepository extends JpaRepository<Tournament, Long> {}
//public interface TournamentPlayerRepository extends JpaRepository<TournamentPlayer, TournamentPlayerId> {}
