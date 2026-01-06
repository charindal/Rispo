package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.infratech.rispo.dto.request.ChangePasswordRequest;
import za.co.infratech.rispo.dto.request.LoginRequest;
import za.co.infratech.rispo.dto.request.RegisterRequest;
import za.co.infratech.rispo.dto.request.UpdateProfileRequest;
import za.co.infratech.rispo.dto.response.AuthResponse;
import za.co.infratech.rispo.dto.response.UserProfileResponse;
import za.co.infratech.rispo.model.AdminToken;
import za.co.infratech.rispo.model.Club;
import za.co.infratech.rispo.model.Player;
import za.co.infratech.rispo.model.UserEntity;
import za.co.infratech.rispo.repository.AdminTokenRepository;
import za.co.infratech.rispo.repository.ClubRepository;
import za.co.infratech.rispo.repository.PlayerRepository;
import za.co.infratech.rispo.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PlayerRepository playerRepository;
    private final ClubRepository clubRepository;
    private final AdminTokenRepository adminTokenRepository;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate required fields
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            throw new RuntimeException("Phone number is required");
        }

        // Validate unique username
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        // Validate unique email
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // Validate unique national ID
        if (userRepository.findByNationalId(request.getNationalId()).isPresent()) {
            throw new RuntimeException("National ID already registered");
        }

        // Set role (default to PLAYER if not specified)
        String roleStr = request.getRole() != null ? request.getRole().toUpperCase() : "PLAYER";
        UserEntity.Role role = UserEntity.Role.valueOf(roleStr);

        // Validate admin token for admin roles
        AdminToken adminToken = null;
        Club tokenClub = null;
        if (role == UserEntity.Role.CLUB_ADMIN || role == UserEntity.Role.RATING_ADMIN) {
            if (request.getAdminToken() == null || request.getAdminToken().isEmpty()) {
                throw new RuntimeException("Admin token required for " + role + " registration");
            }

            adminToken = adminTokenRepository.findByToken(request.getAdminToken())
                    .orElseThrow(() -> new RuntimeException("Invalid admin token"));

            if (!adminToken.isValid()) {
                throw new RuntimeException("Token is expired or already used");
            }

            if (adminToken.getRole() != role) {
                throw new RuntimeException("Token is for " + adminToken.getRole() + ", not " + role);
            }

            tokenClub = adminToken.getClub();
        }

        // For CLUB_ADMIN, club creation is mandatory
        Club club = null;
        if (role == UserEntity.Role.CLUB_ADMIN) {
            if (request.getClubName() == null || request.getClubName().trim().isEmpty()) {
                throw new RuntimeException("Club name is required for Club Admin registration");
            }
            
            // Check if club name already exists
            if (clubRepository.findByName(request.getClubName()).isPresent()) {
                throw new RuntimeException("A club with this name already exists. Please choose a different name.");
            }
            
            // Create the club (user will be set after user creation)
            club = new Club();
            club.setName(request.getClubName());
            club.setDescription(request.getClubDescription());
            club.setAddress(request.getClubAddress());
            club.setCity(request.getClubCity());
            club.setSuburb(request.getClubSuburb());
            club.setContactEmail(request.getClubContactEmail() != null ? request.getClubContactEmail() : request.getEmail());
            club.setContactPhone(request.getClubContactPhone() != null ? request.getClubContactPhone() : request.getPhone());
            club.setStatus(Club.ClubStatus.ACTIVE);
            // Note: createdBy will be set after user creation
        } else if (request.getClubId() != null) {
            // Get club if specified for other roles
            club = clubRepository.findById(request.getClubId())
                    .orElseThrow(() -> new RuntimeException("Club not found"));
        } else if (tokenClub != null) {
            // Use club from token if no club specified
            club = tokenClub;
        }

        // Create user entity
        UserEntity user = new UserEntity();
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword()); // TODO: Add password encryption
        user.setEmail(request.getEmail());
        user.setNationalId(request.getNationalId());
        user.setIsActive(true);
        user.setRole(role);
        user.setClub(null); // Will be set after club is saved
        
        user = userRepository.save(user);
        
        // If CLUB_ADMIN, save the club with the user as creator, then update user's club
        if (role == UserEntity.Role.CLUB_ADMIN && club != null) {
            club.setCreatedBy(user);
            club = clubRepository.save(club);
            user.setClub(club);
            user = userRepository.save(user);
        } else if (club != null) {
            // For other roles, just set the club
            user.setClub(club);
            user = userRepository.save(user);
        }

        // Mark token as used
        if (adminToken != null) {
            adminToken.setIsUsed(true);
            adminToken.setUsedBy(user);
            adminToken.setUsedAt(LocalDateTime.now());
            adminTokenRepository.save(adminToken);
        }

        // Create player profile automatically for all roles except SUPER_USER
        Player player = null;
        if (role != UserEntity.Role.SUPER_USER) {
            player = new Player();
            player.setUser(user);
            player.setName(request.getName());
            player.setEmail(request.getEmail());
            player.setPhone(request.getPhone());
            player.setClub(club);
            player.setRating(1200); // Default rating
            player.setMatchesPlayed(0);
            player.setGamesPlayed(0);
            player.setWins(0);
            player.setLosses(0);
            player.setDraws(0);
            player.setIsVerified(false);
            
            player = playerRepository.save(player);
        }

        // Build response
        AuthResponse response = new AuthResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().toString());
        response.setPlayerId(player != null ? player.getId() : null);
        response.setIsVerified(player != null ? player.getIsVerified() : null);
        response.setMustChangePassword(user.getMustChangePassword());
        response.setMessage("Registration successful");
        response.setToken("mock-jwt-token-" + user.getId()); // TODO: Implement real JWT

        return response;
    }

    public AuthResponse login(LoginRequest request) {
        // Find user by username
        UserEntity user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        // Validate password (TODO: Add proper password hashing)
        if (!user.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        // Check if user is active
        if (!user.getIsActive()) {
            throw new RuntimeException("Account is not active");
        }

        // Get player info if user has a player profile (regardless of role)
        Player player = playerRepository.findByUserId(user.getId()).orElse(null);

        // Build response
        AuthResponse response = new AuthResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().toString());
        response.setPlayerId(player != null ? player.getId() : null);
        response.setIsVerified(player != null ? player.getIsVerified() : null);
        response.setMustChangePassword(user.getMustChangePassword());
        response.setMessage("Login successful");
        response.setToken("mock-jwt-token-" + user.getId()); // TODO: Implement real JWT

        return response;
    }

    public UserProfileResponse getUserProfile(Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserProfileResponse response = new UserProfileResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setNationalId(user.getNationalId());
        response.setRole(user.getRole().toString());
        
        if (user.getClub() != null) {
            response.setClubId(user.getClub().getClubId());
            response.setClubName(user.getClub().getName());
        }

        // Get player profile if exists
        Optional<Player> playerOpt = playerRepository.findByUserId(userId);
        if (playerOpt.isPresent()) {
            Player player = playerOpt.get();
            response.setPlayerId(player.getId());
            response.setName(player.getName());
            response.setPhone(player.getPhone());
            response.setRating(player.getRating());
            response.setIsVerified(player.getIsVerified());
        }

        return response;
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate required fields
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            throw new RuntimeException("Phone number is required");
        }

        // Check if email is being changed and if it's already taken
        if (!user.getEmail().equals(request.getEmail())) {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(request.getEmail());
        }

        // Update club if specified
        if (request.getClubId() != null) {
            Club club = clubRepository.findById(request.getClubId())
                    .orElseThrow(() -> new RuntimeException("Club not found"));
            user.setClub(club);
        }

        userRepository.save(user);

        // Update player profile if exists
        Optional<Player> playerOpt = playerRepository.findByUserId(userId);
        if (playerOpt.isPresent()) {
            Player player = playerOpt.get();
            
            if (request.getEmail() != null) {
                player.setEmail(request.getEmail());
            }
            
            if (request.getPhone() != null) {
                player.setPhone(request.getPhone());
            }
            
            if (request.getName() != null && !request.getName().trim().isEmpty()) {
                player.setName(request.getName());
            }
            
            if (request.getClubId() != null) {
                Club club = clubRepository.findById(request.getClubId())
                        .orElseThrow(() -> new RuntimeException("Club not found"));
                player.setClub(club);
            }
            
            playerRepository.save(player);
        }

        return getUserProfile(userId);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Validate old password
        if (!user.getPassword().equals(request.getOldPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Validate new password
        if (request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()) {
            throw new RuntimeException("New password cannot be empty");
        }

        if (request.getNewPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters long");
        }

        if (request.getNewPassword().equals(request.getOldPassword())) {
            throw new RuntimeException("New password must be different from current password");
        }

        // Update password
        user.setPassword(request.getNewPassword()); // TODO: Add password encryption
        user.setMustChangePassword(false);
        
        userRepository.save(user);
    }
}

