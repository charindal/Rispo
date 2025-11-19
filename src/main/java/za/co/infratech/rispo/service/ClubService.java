package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.infratech.rispo.dto.request.ClubJoinRequestRequest;
import za.co.infratech.rispo.dto.request.CreateClubRequest;
import za.co.infratech.rispo.dto.request.GenerateTokenRequest;
import za.co.infratech.rispo.dto.request.ReviewJoinRequestRequest;
import za.co.infratech.rispo.dto.response.ClubJoinRequestResponse;
import za.co.infratech.rispo.dto.response.ClubResponse;
import za.co.infratech.rispo.dto.response.TokenResponse;
import za.co.infratech.rispo.model.*;
import za.co.infratech.rispo.repository.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClubService {

    private final ClubRepository clubRepository;
    private final AdminTokenRepository adminTokenRepository;
    private final UserRepository userRepository;
    private final ClubJoinRequestRepository joinRequestRepository;
    private final PlayerRepository playerRepository;

    @Transactional
    public ClubResponse createClub(CreateClubRequest request, Long systemAdminId) {
        UserEntity systemAdmin = userRepository.findById(systemAdminId)
                .orElseThrow(() -> new RuntimeException("System admin not found"));

        if (systemAdmin.getRole() != UserEntity.Role.SYSTEM_ADMIN) {
            throw new RuntimeException("Only system admins can create clubs");
        }

        if (clubRepository.findByName(request.getName()).isPresent()) {
            throw new RuntimeException("Club with this name already exists");
        }

        Club club = Club.builder()
                .name(request.getName())
                .description(request.getDescription())
                .address(request.getAddress())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .createdBy(systemAdmin)
                .status(Club.ClubStatus.ACTIVE)
                .build();

        club = clubRepository.save(club);
        return toClubResponse(club);
    }

    @Transactional
    public TokenResponse generateAdminToken(GenerateTokenRequest request, Long systemAdminId) {
        UserEntity systemAdmin = userRepository.findById(systemAdminId)
                .orElseThrow(() -> new RuntimeException("System admin not found"));

        if (systemAdmin.getRole() != UserEntity.Role.SYSTEM_ADMIN) {
            throw new RuntimeException("Only system admins can generate tokens");
        }

        Club club = null;
        if (request.getClubId() != null) {
            club = clubRepository.findById(request.getClubId())
                    .orElseThrow(() -> new RuntimeException("Club not found"));
        }

        UserEntity.Role role;
        try {
            role = UserEntity.Role.valueOf(request.getRole());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + request.getRole());
        }

        if (role == UserEntity.Role.PLAYER || role == UserEntity.Role.SYSTEM_ADMIN) {
            throw new RuntimeException("Cannot generate tokens for PLAYER or SYSTEM_ADMIN roles");
        }

        // Generate unique token
        String token = UUID.randomUUID().toString();

        AdminToken adminToken = AdminToken.builder()
                .token(token)
                .club(club)
                .role(role)
                .generatedBy(systemAdmin)
                .isUsed(false)
                .expiresAt(LocalDateTime.now().plusDays(request.getValidityDays()))
                .build();

        adminToken = adminTokenRepository.save(adminToken);
        return toTokenResponse(adminToken);
    }

    public List<ClubResponse> getAllClubs() {
        return clubRepository.findAll().stream()
                .map(this::toClubResponse)
                .collect(Collectors.toList());
    }

    public List<ClubResponse> getActiveClubs() {
        return clubRepository.findByStatus(Club.ClubStatus.ACTIVE).stream()
                .map(this::toClubResponse)
                .collect(Collectors.toList());
    }

    public ClubResponse getClubById(Long clubId) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found"));
        return toClubResponse(club);
    }

    public List<TokenResponse> getTokensByClub(Long clubId) {
        return adminTokenRepository.findByClub_ClubId(clubId).stream()
                .map(this::toTokenResponse)
                .collect(Collectors.toList());
    }

    public List<TokenResponse> getUnusedTokens() {
        return adminTokenRepository.findByIsUsedFalse().stream()
                .filter(AdminToken::isValid)
                .map(this::toTokenResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ClubResponse updateClubStatus(Long clubId, Club.ClubStatus status, Long systemAdminId) {
        UserEntity systemAdmin = userRepository.findById(systemAdminId)
                .orElseThrow(() -> new RuntimeException("System admin not found"));

        if (systemAdmin.getRole() != UserEntity.Role.SYSTEM_ADMIN) {
            throw new RuntimeException("Only system admins can update club status");
        }

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found"));

        club.setStatus(status);
        club = clubRepository.save(club);
        return toClubResponse(club);
    }

    // Club Join Request Methods
    @Transactional
    public ClubJoinRequestResponse requestToJoinClub(ClubJoinRequestRequest request, Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        Club club = clubRepository.findById(request.getClubId())
                .orElseThrow(() -> new RuntimeException("Club not found"));

        if (club.getStatus() != Club.ClubStatus.ACTIVE) {
            throw new RuntimeException("Club is not accepting new members");
        }

        // Check if player already has a club
        if (player.getClub() != null) {
            throw new RuntimeException("Player already belongs to a club");
        }

        // Check for existing pending request
        if (joinRequestRepository.findByPlayer_IdAndClub_ClubIdAndStatus(
                playerId, request.getClubId(), ClubJoinRequest.RequestStatus.PENDING).isPresent()) {
            throw new RuntimeException("You already have a pending request for this club");
        }

        ClubJoinRequest joinRequest = ClubJoinRequest.builder()
                .player(player)
                .club(club)
                .message(request.getMessage())
                .status(ClubJoinRequest.RequestStatus.PENDING)
                .build();

        joinRequest = joinRequestRepository.save(joinRequest);
        return toJoinRequestResponse(joinRequest);
    }

    @Transactional
    public ClubJoinRequestResponse reviewJoinRequest(Long requestId, ReviewJoinRequestRequest request, Long adminUserId) {
        ClubJoinRequest joinRequest = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        UserEntity admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        // Verify admin has permission
        if (admin.getRole() == UserEntity.Role.PLAYER) {
            throw new RuntimeException("Only admins can review join requests");
        }

        // Club admins can only review requests for their club
        if (admin.getRole() == UserEntity.Role.CLUB_ADMIN) {
            if (admin.getClub() == null || !admin.getClub().getClubId().equals(joinRequest.getClub().getClubId())) {
                throw new RuntimeException("Club admins can only review requests for their own club");
            }
        }

        if (joinRequest.getStatus() != ClubJoinRequest.RequestStatus.PENDING) {
            throw new RuntimeException("This request has already been reviewed");
        }

        ClubJoinRequest.RequestStatus newStatus = ClubJoinRequest.RequestStatus.valueOf(request.getStatus().toUpperCase());
        joinRequest.setStatus(newStatus);
        joinRequest.setReviewedBy(admin);
        joinRequest.setReviewedAt(LocalDateTime.now());
        joinRequest.setReviewNotes(request.getReviewNotes());

        // If approved, add player to club
        if (newStatus == ClubJoinRequest.RequestStatus.APPROVED) {
            Player player = joinRequest.getPlayer();
            player.setClub(joinRequest.getClub());
            playerRepository.save(player);
        }

        joinRequest = joinRequestRepository.save(joinRequest);
        return toJoinRequestResponse(joinRequest);
    }

    public List<ClubJoinRequestResponse> getClubJoinRequests(Long clubId, String status) {
        List<ClubJoinRequest> requests;
        
        if (status != null) {
            ClubJoinRequest.RequestStatus requestStatus = ClubJoinRequest.RequestStatus.valueOf(status.toUpperCase());
            requests = joinRequestRepository.findByClub_ClubIdAndStatus(clubId, requestStatus);
        } else {
            requests = joinRequestRepository.findByClub_ClubId(clubId);
        }

        return requests.stream()
                .map(this::toJoinRequestResponse)
                .collect(Collectors.toList());
    }

    public List<ClubJoinRequestResponse> getPlayerJoinRequests(Long playerId) {
        return joinRequestRepository.findByPlayer_Id(playerId).stream()
                .map(this::toJoinRequestResponse)
                .collect(Collectors.toList());
    }

    public List<ClubJoinRequestResponse> getPendingJoinRequests() {
        return joinRequestRepository.findByStatus(ClubJoinRequest.RequestStatus.PENDING).stream()
                .map(this::toJoinRequestResponse)
                .collect(Collectors.toList());
    }

    private ClubJoinRequestResponse toJoinRequestResponse(ClubJoinRequest request) {
        return ClubJoinRequestResponse.builder()
                .requestId(request.getRequestId())
                .playerId(request.getPlayer().getId())
                .playerName(request.getPlayer().getName())
                .clubId(request.getClub().getClubId())
                .clubName(request.getClub().getName())
                .status(request.getStatus().name())
                .message(request.getMessage())
                .requestedAt(request.getRequestedAt())
                .reviewedByUsername(request.getReviewedBy() != null ? request.getReviewedBy().getUsername() : null)
                .reviewedAt(request.getReviewedAt())
                .reviewNotes(request.getReviewNotes())
                .build();
    }

    private ClubResponse toClubResponse(Club club) {
        return ClubResponse.builder()
                .clubId(club.getClubId())
                .name(club.getName())
                .description(club.getDescription())
                .address(club.getAddress())
                .contactEmail(club.getContactEmail())
                .contactPhone(club.getContactPhone())
                .status(club.getStatus().name())
                .createdByUsername(club.getCreatedBy().getUsername())
                .createdAt(club.getCreatedAt())
                .build();
    }

    private TokenResponse toTokenResponse(AdminToken token) {
        return TokenResponse.builder()
                .tokenId(token.getTokenId())
                .token(token.getToken())
                .clubId(token.getClub() != null ? token.getClub().getClubId() : null)
                .clubName(token.getClub() != null ? token.getClub().getName() : null)
                .role(token.getRole().name())
                .isUsed(token.getIsUsed())
                .expiresAt(token.getExpiresAt())
                .createdAt(token.getCreatedAt())
                .usedByUsername(token.getUsedBy() != null ? token.getUsedBy().getUsername() : null)
                .build();
    }
}
