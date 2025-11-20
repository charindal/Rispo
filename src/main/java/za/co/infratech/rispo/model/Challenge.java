package za.co.infratech.rispo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "challenge")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Challenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "challenge_id")
    private Long challengeId;

    @ManyToOne
    @JoinColumn(name = "challenger_id", nullable = false)
    private Player challenger;

    @ManyToOne
    @JoinColumn(name = "challenged_id", nullable = false)
    private Player challenged;

    @Column(name = "challenge_name")
    private String challengeName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ChallengeStatus status = ChallengeStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (expiresAt == null) {
            // Challenges expire after 7 days
            expiresAt = createdAt.plusDays(7);
        }
    }

    public enum ChallengeStatus {
        PENDING,
        ACCEPTED,
        REJECTED,
        EXPIRED,
        CANCELLED
    }
}
