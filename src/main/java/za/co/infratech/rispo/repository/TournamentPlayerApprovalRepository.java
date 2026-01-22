package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.entity.TournamentPlayerApproval;
import za.co.infratech.rispo.entity.TournamentPlayerApproval.ApprovalStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface TournamentPlayerApprovalRepository extends JpaRepository<TournamentPlayerApproval, Long> {
    List<TournamentPlayerApproval> findByTournamentId(Long tournamentId);
    List<TournamentPlayerApproval> findByTournamentIdAndApprovalStatus(Long tournamentId, ApprovalStatus status);
    Optional<TournamentPlayerApproval> findByTournamentIdAndPlayerId(Long tournamentId, Long playerId);
    List<TournamentPlayerApproval> findByTournamentIdOrderByApprovalStatusDesc(Long tournamentId);
    int countByTournamentIdAndApprovalStatus(Long tournamentId, ApprovalStatus status);
}
