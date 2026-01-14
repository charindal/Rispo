package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.model.Tournament;

import java.util.List;

@Repository
public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    List<Tournament> findByStatus(String status);
    List<Tournament> findByStatusIn(List<String> statuses);
    List<Tournament> findByCreatedById(Long userId);
    List<Tournament> findByClubClubId(Long clubId);
    List<Tournament> findByClubClubIdAndApprovalStatus(Long clubId, String approvalStatus);
    List<Tournament> findByClubClubIdAndApprovalStatusIn(Long clubId, List<String> approvalStatuses);
}

