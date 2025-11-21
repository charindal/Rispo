package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.model.Club;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubRepository extends JpaRepository<Club, Long> {
    
    Optional<Club> findByName(String name);
    
    List<Club> findByStatus(Club.ClubStatus status);
    
    List<Club> findByCreatedBy_Id(Long userId);
    
    List<Club> findByNameContainingIgnoreCase(String name);
    
    List<Club> findByCityContainingIgnoreCase(String city);
    
    List<Club> findBySuburbContainingIgnoreCase(String suburb);
    
    List<Club> findByNameContainingIgnoreCaseAndCityContainingIgnoreCase(String name, String city);
    
    List<Club> findByNameContainingIgnoreCaseAndSuburbContainingIgnoreCase(String name, String suburb);
    
    List<Club> findByCityContainingIgnoreCaseAndSuburbContainingIgnoreCase(String city, String suburb);
    
    List<Club> findByNameContainingIgnoreCaseAndCityContainingIgnoreCaseAndSuburbContainingIgnoreCase(String name, String city, String suburb);
}
