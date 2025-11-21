package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.infratech.rispo.model.UserEntity;
import za.co.infratech.rispo.repository.UserRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitService implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public void run(String... args) {
        initializeSuperUser();
    }

    private void initializeSuperUser() {
        // Check if SuperUser already exists
        if (userRepository.findByRole(UserEntity.Role.SUPER_USER).isEmpty()) {
            log.info("No SuperUser found. Creating default SuperUser...");
            
            UserEntity superUser = new UserEntity();
            superUser.setUsername("admin");
            superUser.setPassword("admin"); // TODO: Add password encryption
            superUser.setEmail("admin@rispo.system");
            superUser.setNationalId("SUPERUSER-001");
            superUser.setRole(UserEntity.Role.SUPER_USER);
            superUser.setIsActive(true);
            superUser.setMustChangePassword(true); // Force password change on first login
            
            userRepository.save(superUser);
            
            log.info("SuperUser created successfully with username: admin, password: admin");
            log.warn("IMPORTANT: Please change the default SuperUser password immediately!");
        } else {
            log.info("SuperUser already exists. Skipping initialization.");
        }
    }
}
