package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.model.TournamentTemplate;

import java.util.List;

@Repository
public interface TournamentTemplateRepository extends JpaRepository<TournamentTemplate, Long> {
    
    List<TournamentTemplate> findByIsActiveTrue();
    
    List<TournamentTemplate> findByTournamentType(String tournamentType);
    
    List<TournamentTemplate> findByIsActiveTrueOrderByCreatedAtDesc();
}
