package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.infratech.rispo.model.UserEntity;
import za.co.infratech.rispo.repository.UserRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitService implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Override
    @Transactional
    public void run(String... args) {
        initializeSystemAdmin();
    }

    private void initializeSystemAdmin() {
        if (userRepository.findByRole(UserEntity.Role.SYSTEM_ADMIN).isEmpty()) {
            log.info("No System Admin found. Creating default System Admin...");

            UserEntity admin = new UserEntity();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin"));
            admin.setEmail("admin@rispo.system");
            admin.setNationalId("SYSADMIN-001");
            admin.setRole(UserEntity.Role.SYSTEM_ADMIN);
            admin.setIsActive(true);
            admin.setMustChangePassword(true);

            userRepository.save(admin);

            log.info("System Admin created with username: admin, password: admin");
            log.warn("IMPORTANT: Please change the default System Admin password immediately!");
        } else {
            log.info("System Admin already exists. Skipping initialization.");
        }
    }
}
