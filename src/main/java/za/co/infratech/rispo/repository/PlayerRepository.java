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
    
    @Query("SELECT p FROM Player p WHERE p.club.id = :clubId AND p.isVerified = true ORDER BY p.name ASC")
    List<Player> findByClubIdAndIsVerifiedOrderByNameAsc(@Param("clubId") Long clubId);
    
    @Query("SELECT p FROM Player p WHERE p.club.id = :clubId AND p.isVerified = true AND LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ORDER BY p.name ASC")
    List<Player> searchByClubIdAndName(@Param("clubId") Long clubId, @Param("searchTerm") String searchTerm);
    
    List<Player> findByNameContainingIgnoreCaseOrderByRatingDesc(String name);
    
    List<Player> findAllByOrderByRatingDesc();
    
    List<Player> findTop10ByIsVerifiedTrueOrderByRatingDesc();
    
    Long countByIsVerifiedTrueAndRatingGreaterThan(Integer rating);
    
    List<Player> findByIsVerifiedTrueAndNameContainingIgnoreCaseOrderByRatingDesc(String name);
}
