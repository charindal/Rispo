package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.entity.TournamentPointsConfig;

import java.util.Optional;

@Repository
public interface TournamentPointsConfigRepository extends JpaRepository<TournamentPointsConfig, Long> {
    
    Optional<TournamentPointsConfig> findByClubId(Long clubId);
}