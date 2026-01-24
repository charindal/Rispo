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
    @CacheEvict(value = {"players", "clubPlayers"}, allEntries = true)
    public PlayerDTO verifyPlayer(Long playerId, Long adminUserId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        UserEntity admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin user not found"));

        // Check if admin has permission (all admin roles can verify)
        if (admin.getRole() != UserEntity.Role.SUPER_USER &&
            admin.getRole() != UserEntity.Role.SYSTEM_ADMIN &&
            admin.getRole() != UserEntity.Role.RATING_ADMIN &&
            admin.getRole() != UserEntity.Role.CLUB_ADMIN) {
            throw new RuntimeException("Only administrators can verify players");
        }

        // SuperUser and SystemAdmin can verify any player, skip club checks
        if (admin.getRole() == UserEntity.Role.SUPER_USER || 
            admin.getRole() == UserEntity.Role.SYSTEM_ADMIN) {
            // No restrictions
        }
        // Club admins can only verify players from their club
        else if (admin.getRole() == UserEntity.Role.CLUB_ADMIN) {
            if (admin.getClub() == null) {
                throw new RuntimeException("Admin is not associated with any club");
            }
            if (player.getClub() == null || !player.getClub().getClubId().equals(admin.getClub().getClubId())) {
                throw new RuntimeException("Club admins can only verify players from their own club");
            }
        }

        // Rating admins can verify players from their club (faster) or unaffiliated players
        else if (admin.getRole() == UserEntity.Role.RATING_ADMIN) {
            if (admin.getClub() != null && player.getClub() != null) {
                // If both have clubs, they must match
                if (!player.getClub().getClubId().equals(admin.getClub().getClubId())) {
                    throw new RuntimeException("Rating admins can only verify players from their club or unaffiliated players");
                }
            }
        }

        player.setIsVerified(true);
        player.setVerifiedBy(admin);
        player.setVerifiedAt(LocalDateTime.now());
        
        player = playerRepository.save(player);
        
        return convertToDTO(player);
    }

    @Transactional
    @CacheEvict(value = {"players", "clubPlayers"}, allEntries = true)
    public PlayerDTO unverifyPlayer(Long playerId, Long adminUserId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        UserEntity admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin user not found"));

        // Check if admin has permission (all admin roles can unverify)
        if (admin.getRole() != UserEntity.Role.SUPER_USER &&
            admin.getRole() != UserEntity.Role.SYSTEM_ADMIN &&
            admin.getRole() != UserEntity.Role.RATING_ADMIN &&
            admin.getRole() != UserEntity.Role.CLUB_ADMIN) {
            throw new RuntimeException("Only administrators can unverify players");
        }

        // SuperUser, SystemAdmin, and RatingAdmin can unverify any player
        if (admin.getRole() == UserEntity.Role.SUPER_USER || 
            admin.getRole() == UserEntity.Role.SYSTEM_ADMIN ||
            admin.getRole() == UserEntity.Role.RATING_ADMIN) {
            // No restrictions
        }
        // Club admins can only unverify players from their club
        else if (admin.getRole() == UserEntity.Role.CLUB_ADMIN) {
            if (admin.getClub() == null) {
                throw new RuntimeException("Admin is not associated with any club");
            }
            if (player.getClub() == null || !player.getClub().getClubId().equals(admin.getClub().getClubId())) {
                throw new RuntimeException("Club admins can only unverify players from their own club");
            }
        }

        player.setIsVerified(false);
        player.setVerifiedBy(null);
        player.setVerifiedAt(null);
        
        player = playerRepository.save(player);
        
        return convertToDTO(player);
    }

    @Cacheable(value = "clubPlayers", key = "#clubId + '_' + (#searchTerm ?: 'all')")
    public List<PlayerDTO> searchPlayersByClub(Long clubId, String searchTerm) {
        List<Player> players;
        
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            players = playerRepository.searchByClubIdAndName(clubId, searchTerm.trim());
        } else {
            players = playerRepository.findByClubIdAndIsVerifiedOrderByNameAsc(clubId);
        }
        
        return players.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PlayerDTO> searchPlayersGlobal(String name, Long clubId) {
        List<Player> players;
        
        if (name != null && !name.trim().isEmpty() && clubId != null) {
            // Search by both name and club
            players = playerRepository.searchByClubIdAndName(clubId, name.trim());
        } else if (name != null && !name.trim().isEmpty()) {
            // Search by name only
            players = playerRepository.findByNameContainingIgnoreCaseOrderByRatingDesc(name.trim());
        } else if (clubId != null) {
            // Search by club only
            players = playerRepository.findByClubIdAndIsVerifiedOrderByNameAsc(clubId);
        } else {
            // Return all players sorted by rating
            players = playerRepository.findAllByOrderByRatingDesc();
        }
        
        return players.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PlayerDTO> getTop10Players() {
        return playerRepository.findTop10ByIsVerifiedTrueOrderByRatingDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PlayerRankingDTO> getTop10Rankings() {
        List<Player> topPlayers = playerRepository.findTop10ByIsVerifiedTrueOrderByRatingDesc();
        List<PlayerRankingDTO> rankings = new ArrayList<>();
        
        for (int i = 0; i < topPlayers.size(); i++) {
            Player player = topPlayers.get(i);
            PlayerRankingDTO dto = convertToRankingDTO(player);
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
        
        // Get the rank by counting how many verified players have a higher rating
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
        dto.setName(player.getUser().getUsername()); // Use username for display
        dto.setRating(player.getRating());
        dto.setMatchesPlayed(player.getMatchesPlayed());
        dto.setWins(player.getWins());
        dto.setLosses(player.getLosses());
        dto.setDraws(player.getDraws());
        dto.setClubId(player.getClub() != null ? player.getClub().getClubId() : null);
        dto.setClubName(player.getClub() != null ? player.getClub().getName() : null);
        return dto;
    }

    private PlayerDTO convertToDTO(Player player) {
        PlayerDTO dto = new PlayerDTO();
        dto.setId(player.getId());
        dto.setUserId(player.getUser().getId());
        dto.setName(player.getUser().getUsername()); // Use username for display
        dto.setRealName(player.getName()); // Keep real name
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
        dto.setClubId(player.getClub() != null ? player.getClub().getClubId() : null);
        dto.setClubName(player.getClub() != null ? player.getClub().getName() : null);
        dto.setCreatedAt(player.getCreatedAt() != null ? player.getCreatedAt().toString() : null);
        return dto;
    }
}
