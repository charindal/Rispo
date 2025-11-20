package za.co.infratech.rispo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "match")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;

    @Column(nullable = false)
    private Integer round = 1;

    @ManyToOne
    @JoinColumn(name = "player1_id", nullable = false)
    private Player player1;

    @ManyToOne
    @JoinColumn(name = "player2_id", nullable = false)
    private Player player2;

    @ManyToOne
    @JoinColumn(name = "winner_id")
    private Player winner;

    @ManyToOne
    @JoinColumn(name = "challenge_id")
    private Challenge challenge;

    @Column(name = "admin_created", nullable = false)
    @Builder.Default
    private Boolean adminCreated = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MatchStatus status = MatchStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "acknowledgment_status", nullable = false)
    @Builder.Default
    private AcknowledgmentStatus acknowledgmentStatus = AcknowledgmentStatus.NOT_REQUIRED;

    @ManyToOne
    @JoinColumn(name = "result_recorded_by")
    private UserEntity resultRecordedBy;

    @Column(name = "result_recorded_at")
    private LocalDateTime resultRecordedAt;

    @ManyToOne
    @JoinColumn(name = "acknowledged_by")
    private UserEntity acknowledgedBy;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "acknowledgment_deadline")
    private LocalDateTime acknowledgmentDeadline;

    @ManyToOne
    @JoinColumn(name = "submitted_by")
    private UserEntity submittedBy;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @ManyToOne
    @JoinColumn(name = "reviewed_by")
    private UserEntity reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    @Column(name = "is_rated", nullable = false)
    @Builder.Default
    private Boolean isRated = false;

    @Column(name = "player1_rating_before")
    private Integer player1RatingBefore;

    @Column(name = "player2_rating_before")
    private Integer player2RatingBefore;

    @Column(name = "player1_rating_after")
    private Integer player1RatingAfter;

    @Column(name = "player2_rating_after")
    private Integer player2RatingAfter;

    @Column(name = "player1_rating_change")
    private Integer player1RatingChange;

    @Column(name = "player2_rating_change")
    private Integer player2RatingChange;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
    }

    public enum MatchStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    public enum AcknowledgmentStatus {
        NOT_REQUIRED,
        PENDING_ACKNOWLEDGMENT,
        ACKNOWLEDGED,
        DISPUTED,
        ACKNOWLEDGED_BY_ADMIN
    }
}
