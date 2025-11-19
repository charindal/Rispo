package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import za.co.infratech.rispo.model.Player;

import java.util.List;
import java.util.Optional;

public interface PlayerRepository extends JpaRepository<Player, Long> {
    @Query("SELECT p FROM Player p WHERE p.user.id = :userId")
    Optional<Player> findByUserId(@Param("userId") Long userId);
    
    List<Player> findByIsVerified(Boolean isVerified);
}
