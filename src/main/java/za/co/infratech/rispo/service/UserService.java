package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import za.co.infratech.rispo.dto.request.UserLoginRequest;
import za.co.infratech.rispo.dto.request.UserRegisterRequest;
import za.co.infratech.rispo.dto.response.AuthResponse;
import za.co.infratech.rispo.dto.response.UserResponse;
import za.co.infratech.rispo.model.UserEntity;
import za.co.infratech.rispo.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse registerUser(UserRegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already taken");
        }

        UserEntity user = new UserEntity();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserEntity.Role.valueOf(request.getRole().toUpperCase()));

        UserEntity saved = userRepository.save(user);

        return mapToUserResponse(saved);
    }

    public AuthResponse login(UserLoginRequest request) {
        UserEntity user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        // Stub JWT token generation - we'll integrate proper JWT next
        String fakeToken = "fake-jwt-token-for-" + user.getUsername();
        return new AuthResponse(fakeToken);
    }

    public UserResponse getUserById(Long id) {
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(UserEntity user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setRole(user.getRole().name());
        return response;
    }
}

