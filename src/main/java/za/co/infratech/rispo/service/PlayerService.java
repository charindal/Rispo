package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.infratech.rispo.dto.response.PlayerDTO;
import za.co.infratech.rispo.dto.response.PlayerRankingDTO;
import za.co.infratech.rispo.model.Player;
import za.co.infratech.rispo.model.UserEntity;
import za.co.infratech.rispo.repository.PlayerRepository;
import za.co.infratech.rispo.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final UserRepository userRepository;

    @Cacheable(value = "players", key = "'all'")
    public List<PlayerDTO> getAllPlayers() {
        return playerRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PlayerDTO getPlayerById(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        return convertToDTO(player);
    }

    public List<PlayerDTO> getUnverifiedPlayers() {
        return playerRepository.findByIsVerified(false).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "players", allEntries = true)
    public PlayerDTO verifyPlayer(Long playerId, Long adminUserId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        UserEntity admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin user not found"));

        if (admin.getRole() != UserEntity.Role.SYSTEM_ADMIN) {
            throw new RuntimeException("Only System Administrators can verify players");
        }

        player.setIsVerified(true);
        player.setVerifiedBy(admin);
        player.setVerifiedAt(LocalDateTime.now());
        return convertToDTO(playerRepository.save(player));
    }

    @Transactional
    @CacheEvict(value = "players", allEntries = true)
    public PlayerDTO unverifyPlayer(Long playerId, Long adminUserId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        UserEntity admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin user not found"));

        if (admin.getRole() != UserEntity.Role.SYSTEM_ADMIN) {
            throw new RuntimeException("Only System Administrators can unverify players");
        }

        player.setIsVerified(false);
        player.setVerifiedBy(null);
        player.setVerifiedAt(null);
        return convertToDTO(playerRepository.save(player));
    }

    public List<PlayerDTO> searchPlayersGlobal(String name) {
        List<Player> players;
        if (name != null && !name.trim().isEmpty()) {
            players = playerRepository.findByNameContainingIgnoreCaseOrderByRatingDesc(name.trim());
        } else {
            players = playerRepository.findAllByOrderByRatingDesc();
        }
        return players.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<PlayerDTO> getTop10Players() {
        return playerRepository.findTop10ByIsVerifiedTrueOrderByRatingDesc()
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<PlayerRankingDTO> getTop10Rankings() {
        List<Player> topPlayers = playerRepository.findTop10ByIsVerifiedTrueOrderByRatingDesc();
        List<PlayerRankingDTO> rankings = new ArrayList<>();
        for (int i = 0; i < topPlayers.size(); i++) {
            PlayerRankingDTO dto = convertToRankingDTO(topPlayers.get(i));
            dto.setRank(i + 1);
            dto.setIsCurrentUser(false);
            rankings.add(dto);
        }
        return rankings;
    }

    public PlayerRankingDTO getPlayerRanking(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        if (!player.getIsVerified()) {
            throw new RuntimeException("Player is not verified");
        }
        Long rank = playerRepository.countByIsVerifiedTrueAndRatingGreaterThan(player.getRating()) + 1;
        PlayerRankingDTO dto = convertToRankingDTO(player);
        dto.setRank(rank.intValue());
        dto.setIsCurrentUser(false);
        return dto;
    }

    public List<PlayerRankingDTO> searchPlayerRankings(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return new ArrayList<>();
        }
        List<Player> players = playerRepository.findByIsVerifiedTrueAndNameContainingIgnoreCaseOrderByRatingDesc(searchTerm.trim());
        List<PlayerRankingDTO> rankings = new ArrayList<>();
        for (Player player : players) {
            Long rank = playerRepository.countByIsVerifiedTrueAndRatingGreaterThan(player.getRating()) + 1;
            PlayerRankingDTO dto = convertToRankingDTO(player);
            dto.setRank(rank.intValue());
            dto.setIsCurrentUser(false);
            rankings.add(dto);
        }
        return rankings;
    }

    private PlayerRankingDTO convertToRankingDTO(Player player) {
        PlayerRankingDTO dto = new PlayerRankingDTO();
        dto.setId(player.getId());
        dto.setUserId(player.getUser().getId());
        dto.setName(player.getUser().getUsername());
        dto.setRating(player.getRating());
        dto.setMatchesPlayed(player.getMatchesPlayed());
        dto.setWins(player.getWins());
        dto.setLosses(player.getLosses());
        dto.setDraws(player.getDraws());
        return dto;
    }

    private PlayerDTO convertToDTO(Player player) {
        PlayerDTO dto = new PlayerDTO();
        dto.setId(player.getId());
        dto.setUserId(player.getUser().getId());
        dto.setName(player.getUser().getUsername());
        dto.setRealName(player.getName());
        dto.setEmail(player.getEmail());
        dto.setPhone(player.getPhone());
        dto.setRating(player.getRating());
        dto.setMatchesPlayed(player.getMatchesPlayed());
        dto.setGamesPlayed(player.getGamesPlayed());
        dto.setWins(player.getWins());
        dto.setLosses(player.getLosses());
        dto.setDraws(player.getDraws());
        dto.setIsVerified(player.getIsVerified());
        dto.setVerifiedBy(player.getVerifiedBy() != null ? player.getVerifiedBy().getUsername() : null);
        dto.setVerifiedAt(player.getVerifiedAt() != null ? player.getVerifiedAt().toString() : null);
        dto.setCreatedAt(player.getCreatedAt() != null ? player.getCreatedAt().toString() : null);
        return dto;
    }
}
