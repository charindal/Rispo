package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.model.RatingSettings;

import java.util.Optional;

@Repository
public interface RatingSettingsRepository extends JpaRepository<RatingSettings, Long> {
    Optional<RatingSettings> findFirstByOrderByIdDesc();
}
