package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.infratech.rispo.dto.request.ChangePasswordRequest;
import za.co.infratech.rispo.dto.request.LoginRequest;
import za.co.infratech.rispo.dto.request.RegisterRequest;
import za.co.infratech.rispo.dto.request.UpdateProfileRequest;
import za.co.infratech.rispo.dto.response.AuthResponse;
import za.co.infratech.rispo.dto.response.UserProfileResponse;
import za.co.infratech.rispo.model.Player;
import za.co.infratech.rispo.model.UserEntity;
import za.co.infratech.rispo.repository.PlayerRepository;
import za.co.infratech.rispo.repository.UserRepository;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PlayerRepository playerRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            throw new RuntimeException("Phone number is required");
        }
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        if (userRepository.findByNationalId(request.getNationalId()).isPresent()) {
            throw new RuntimeException("National ID already registered");
        }

        // Only PLAYER registrations are allowed via this endpoint.
        // SYSTEM_ADMIN must be created directly in the database or via the init service.
        UserEntity user = new UserEntity();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setNationalId(request.getNationalId());
        user.setIsActive(true);
        user.setRole(UserEntity.Role.PLAYER);
        user = userRepository.save(user);

        Player player = new Player();
        player.setUser(user);
        player.setName(request.getName());
        player.setEmail(request.getEmail());
        player.setPhone(request.getPhone());
        player.setRating(1200);
        player.setMatchesPlayed(0);
        player.setGamesPlayed(0);
        player.setWins(0);
        player.setLosses(0);
        player.setDraws(0);
        player.setIsVerified(false);
        player = playerRepository.save(player);

        AuthResponse response = new AuthResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().toString());
        response.setPlayerId(player.getId());
        response.setIsVerified(player.getIsVerified());
        response.setMustChangePassword(user.getMustChangePassword());
        response.setMessage("Registration successful");
        response.setToken("mock-jwt-token-" + user.getId());

        return response;
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for username: {}", request.getUsername());

        UserEntity user = userRepository.findByUsernameIgnoreCase(request.getUsername())
                .orElseThrow(() -> {
                    log.warn("Login failed - Invalid username: {}", request.getUsername());
                    return new RuntimeException("Invalid username or password");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Login failed - Invalid password for username: {}", request.getUsername());
            throw new RuntimeException("Invalid username or password");
        }

        if (!user.getIsActive()) {
            log.warn("Login failed - Inactive account for username: {}", request.getUsername());
            throw new RuntimeException("Account is not active");
        }

        Player player = playerRepository.findByUserId(user.getId()).orElse(null);

        log.info("Login successful for username: {} (userId: {}, role: {})",
                request.getUsername(), user.getId(), user.getRole());

        AuthResponse response = new AuthResponse();
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setRole(user.getRole().toString());
        response.setPlayerId(player != null ? player.getId() : null);
        response.setIsVerified(player != null ? player.getIsVerified() : null);
        response.setMustChangePassword(user.getMustChangePassword());
        response.setMessage("Login successful");
        response.setToken("mock-jwt-token-" + user.getId());

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

        Optional<Player> playerOpt = playerRepository.findByUserId(userId);
        if (playerOpt.isPresent()) {
            Player player = playerOpt.get();
            response.setPlayerId(player.getId());
            response.setName(player.getUser().getUsername());
            response.setRealName(player.getName());
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

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        if (request.getPhone() == null || request.getPhone().trim().isEmpty()) {
            throw new RuntimeException("Phone number is required");
        }

        if (!user.getEmail().equals(request.getEmail())) {
            if (userRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("Email already in use");
            }
            user.setEmail(request.getEmail());
        }

        userRepository.save(user);

        Optional<Player> playerOpt = playerRepository.findByUserId(userId);
        if (playerOpt.isPresent()) {
            Player player = playerOpt.get();
            if (request.getEmail() != null) player.setEmail(request.getEmail());
            if (request.getPhone() != null) player.setPhone(request.getPhone());
            if (request.getName() != null && !request.getName().trim().isEmpty()) {
                player.setName(request.getName());
            }
            playerRepository.save(player);
        }

        return getUserProfile(userId);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        if (request.getNewPassword() == null || request.getNewPassword().trim().isEmpty()) {
            throw new RuntimeException("New password cannot be empty");
        }
        if (request.getNewPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters long");
        }
        if (request.getNewPassword().equals(request.getOldPassword())) {
            throw new RuntimeException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }
}
