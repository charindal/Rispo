package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.model.ClubJoinRequest;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClubJoinRequestRepository extends JpaRepository<ClubJoinRequest, Long> {
    
    List<ClubJoinRequest> findByClub_ClubId(Long clubId);
    
    List<ClubJoinRequest> findByPlayer_Id(Long playerId);
    
    List<ClubJoinRequest> findByPlayer_IdOrderByRequestedAtDesc(Long playerId);
    
    List<ClubJoinRequest> findByStatus(ClubJoinRequest.RequestStatus status);
    
    List<ClubJoinRequest> findByClub_ClubIdAndStatus(Long clubId, ClubJoinRequest.RequestStatus status);
    
    Optional<ClubJoinRequest> findByPlayer_IdAndClub_ClubIdAndStatus(Long playerId, Long clubId, ClubJoinRequest.RequestStatus status);
}
