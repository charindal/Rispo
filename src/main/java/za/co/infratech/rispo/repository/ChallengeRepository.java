package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.model.Challenge;
import za.co.infratech.rispo.model.Challenge.ChallengeStatus;
import za.co.infratech.rispo.model.Player;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChallengeRepository extends JpaRepository<Challenge, Long> {

    List<Challenge> findByChallengerOrderByCreatedAtDesc(Player challenger);

    List<Challenge> findByChallengedOrderByCreatedAtDesc(Player challenged);

    List<Challenge> findByChallengedAndStatusOrderByCreatedAtDesc(Player challenged, ChallengeStatus status);

    List<Challenge> findByChallengerAndStatusOrderByCreatedAtDesc(Player challenger, ChallengeStatus status);

    List<Challenge> findByStatusAndExpiresAtBefore(ChallengeStatus status, LocalDateTime expiryTime);
}
