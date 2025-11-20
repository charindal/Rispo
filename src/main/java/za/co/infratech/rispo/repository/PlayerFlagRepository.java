package za.co.infratech.rispo.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.infratech.rispo.model.Match;
import za.co.infratech.rispo.model.Player;
import za.co.infratech.rispo.model.PlayerFlag;

import java.util.List;

@Repository
public interface PlayerFlagRepository extends JpaRepository<PlayerFlag, Long> {

    List<PlayerFlag> findByPlayerOrderByFlaggedAtDesc(Player player);

    List<PlayerFlag> findByPlayerAndResolvedOrderByFlaggedAtDesc(Player player, Boolean resolved);

    List<PlayerFlag> findByMatchOrderByFlaggedAtDesc(Match match);

    List<PlayerFlag> findByResolvedOrderByFlaggedAtDesc(Boolean resolved);

    Long countByPlayerAndResolved(Player player, Boolean resolved);
}
