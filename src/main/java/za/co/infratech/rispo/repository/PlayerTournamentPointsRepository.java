package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.entity.PlayerTournamentPoints;

import java.util.List;

@Repository
public interface PlayerTournamentPointsRepository extends JpaRepository<PlayerTournamentPoints, Long> {
    
    List<PlayerTournamentPoints> findByPlayerIdAndClubIdAndTournamentYear(Long playerId, Long clubId, Integer year);
    
    @Query("SELECT ptp.playerId, SUM(ptp.pointsEarned) as totalPoints, COUNT(ptp.id) as tournamentCount " +
           "FROM PlayerTournamentPoints ptp " +
           "WHERE ptp.clubId = :clubId AND ptp.tournamentYear = :year " +
           "GROUP BY ptp.playerId " +
           "ORDER BY totalPoints DESC")
    List<Object[]> findLeaderboardByClubAndYear(@Param("clubId") Long clubId, @Param("year") Integer year);
    
    List<PlayerTournamentPoints> findByTournamentId(Long tournamentId);
}