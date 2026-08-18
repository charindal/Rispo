package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.infratech.rispo.dto.request.UpdateRatingSettingsRequest;
import za.co.infratech.rispo.dto.response.RatingSettingsResponse;
import za.co.infratech.rispo.model.RatingSettings;
import za.co.infratech.rispo.model.UserEntity;
import za.co.infratech.rispo.repository.RatingSettingsRepository;
import za.co.infratech.rispo.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class RatingSettingsService {

    private final RatingSettingsRepository ratingSettingsRepository;
    private final UserRepository userRepository;

    public RatingSettingsResponse getCurrentSettings() {
        RatingSettings settings = ratingSettingsRepository.findFirstByOrderByIdDesc()
                .orElseGet(() -> {
                    // Return defaults if none exist
                    RatingSettings defaults = new RatingSettings();
                    defaults.setProvisionalGamesCount(100);
                    defaults.setProvisionalKFactor(40);
                    defaults.setEstablishedKFactor(20);
                    defaults.setMinRating(400);
                    defaults.setMaxRating(3000);
                    defaults.setDefaultRating(1200);
                    return defaults;
                });
        
        return convertToResponse(settings);
    }

    @Transactional
    public RatingSettingsResponse updateSettings(UpdateRatingSettingsRequest request, Long userId) throws Exception {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new Exception("User not found"));

        // Only SYSTEM_ADMIN can update rating settings
        if (user.getRole() != UserEntity.Role.SYSTEM_ADMIN) {
            throw new Exception("Only System Administrators can update rating settings");
        }

        // Get current settings or create new
        RatingSettings settings = ratingSettingsRepository.findFirstByOrderByIdDesc()
                .orElse(new RatingSettings());

        // Update fields
        if (request.getProvisionalGamesCount() != null) {
            settings.setProvisionalGamesCount(request.getProvisionalGamesCount());
        }
        if (request.getProvisionalKFactor() != null) {
            settings.setProvisionalKFactor(request.getProvisionalKFactor());
        }
        if (request.getEstablishedKFactor() != null) {
            settings.setEstablishedKFactor(request.getEstablishedKFactor());
        }
        if (request.getMinRating() != null) {
            settings.setMinRating(request.getMinRating());
        }
        if (request.getMaxRating() != null) {
            settings.setMaxRating(request.getMaxRating());
        }
        if (request.getDefaultRating() != null) {
            settings.setDefaultRating(request.getDefaultRating());
        }

        settings.setUpdatedBy(user);
        settings = ratingSettingsRepository.save(settings);

        return convertToResponse(settings);
    }

    private RatingSettingsResponse convertToResponse(RatingSettings settings) {
        RatingSettingsResponse response = new RatingSettingsResponse();
        response.setId(settings.getId());
        response.setProvisionalGamesCount(settings.getProvisionalGamesCount());
        response.setProvisionalKFactor(settings.getProvisionalKFactor());
        response.setEstablishedKFactor(settings.getEstablishedKFactor());
        response.setMinRating(settings.getMinRating());
        response.setMaxRating(settings.getMaxRating());
        response.setDefaultRating(settings.getDefaultRating());
        
        if (settings.getUpdatedBy() != null) {
            response.setUpdatedBy(settings.getUpdatedBy().getUsername());
        }
        if (settings.getUpdatedAt() != null) {
            response.setUpdatedAt(settings.getUpdatedAt().toString());
        }
        
        return response;
    }
}
