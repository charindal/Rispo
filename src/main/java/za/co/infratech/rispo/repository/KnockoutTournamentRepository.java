package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.entity.KnockoutTournament;

import java.util.List;
import java.util.Optional;

@Repository
public interface KnockoutTournamentRepository extends JpaRepository<KnockoutTournament, Long> {
    
    List<KnockoutTournament> findByClubIdOrderByCreatedDateDesc(Long clubId);
    
    List<KnockoutTournament> findByClubIdAndTournamentYearOrderByWeekNumberDesc(Long clubId, Integer year);
    
    @Query("SELECT kt FROM KnockoutTournament kt WHERE kt.clubId = :clubId AND kt.tournamentYear = :year AND kt.weekNumber = :weekNumber")
    List<KnockoutTournament> findByClubIdAndYearAndWeek(@Param("clubId") Long clubId, 
                                                        @Param("year") Integer year, 
                                                        @Param("weekNumber") Integer weekNumber);
    
    @Query("SELECT COALESCE(MAX(kt.sequenceNumber), 0) FROM KnockoutTournament kt WHERE kt.clubId = :clubId AND kt.tournamentYear = :year AND kt.weekNumber = :weekNumber")
    Integer findMaxSequenceNumberForWeek(@Param("clubId") Long clubId, 
                                         @Param("year") Integer year, 
                                         @Param("weekNumber") Integer weekNumber);
    
    @Query("SELECT MAX(kt.weekNumber) FROM KnockoutTournament kt WHERE kt.clubId = :clubId AND kt.tournamentYear = :year")
    Optional<Integer> findMaxWeekNumberForYear(@Param("clubId") Long clubId, @Param("year") Integer year);
    
    List<KnockoutTournament> findByClubIdAndStatusOrderByCreatedDateDesc(Long clubId, KnockoutTournament.TournamentStatus status);
}