package za.co.infratech.rispo.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import za.co.infratech.rispo.dto.request.UpdateRatingSettingsRequest;
import za.co.infratech.rispo.dto.response.RatingSettingsResponse;
import za.co.infratech.rispo.service.RatingSettingsService;

@RestController
@RequestMapping("/api/rating-settings")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "https://135.125.133.211"})
public class RatingSettingsController {

    private final RatingSettingsService ratingSettingsService;

    @GetMapping
    public ResponseEntity<RatingSettingsResponse> getSettings() {
        return ResponseEntity.ok(ratingSettingsService.getCurrentSettings());
    }

    @PutMapping
    public ResponseEntity<?> updateSettings(
            @RequestBody UpdateRatingSettingsRequest request,
            @RequestHeader("X-User-Id") Long userId) {
        try {
            RatingSettingsResponse response = ratingSettingsService.updateSettings(request, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    private record ErrorResponse(String message) {}
}
