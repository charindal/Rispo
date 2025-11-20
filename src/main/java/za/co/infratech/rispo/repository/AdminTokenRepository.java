package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.model.AdminToken;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminTokenRepository extends JpaRepository<AdminToken, Long> {
    
    Optional<AdminToken> findByToken(String token);
    
    List<AdminToken> findByClub_ClubId(Long clubId);
    
    List<AdminToken> findByGeneratedBy_Id(Long userId);
    
    List<AdminToken> findByIsUsedFalse();
    
    List<AdminToken> findByClub_ClubIdAndIsUsedFalse(Long clubId);
}
