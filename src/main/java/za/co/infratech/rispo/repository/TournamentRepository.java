package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.model.Tournament;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, Long> {
}

