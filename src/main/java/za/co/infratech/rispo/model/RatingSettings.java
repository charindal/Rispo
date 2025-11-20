package za.co.infratech.rispo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rating_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RatingSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "provisional_games_count", nullable = false)
    private Integer provisionalGamesCount = 100;

    @Column(name = "provisional_k_factor", nullable = false)
    private Integer provisionalKFactor = 40;

    @Column(name = "established_k_factor", nullable = false)
    private Integer establishedKFactor = 20;

    @Column(name = "min_rating", nullable = false)
    private Integer minRating = 400;

    @Column(name = "max_rating", nullable = false)
    private Integer maxRating = 3000;

    @Column(name = "default_rating", nullable = false)
    private Integer defaultRating = 1200;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne
    @JoinColumn(name = "updated_by")
    private UserEntity updatedBy;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
