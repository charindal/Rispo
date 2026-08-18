package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.co.infratech.rispo.model.Game;

import java.util.List;

public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findByMatchId(Long matchId);
    List<Game> findAllByPlayer1IdOrPlayer2Id(Long player1Id, Long player2Id);
}
