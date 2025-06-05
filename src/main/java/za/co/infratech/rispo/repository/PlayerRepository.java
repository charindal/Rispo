package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.co.infratech.rispo.model.Player;

public interface PlayerRepository extends JpaRepository<Player, Long> {
}
