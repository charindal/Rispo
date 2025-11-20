package za.co.infratech.rispo.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "player_flag")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlayerFlag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "flag_id")
    private Long flagId;

    @ManyToOne
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Enumerated(EnumType.STRING)
    @Column(name = "flag_type", nullable = false)
    private FlagType flagType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "flagged_at")
    private LocalDateTime flaggedAt;

    @ManyToOne
    @JoinColumn(name = "flagged_by")
    private UserEntity flaggedBy;

    @Column(nullable = false)
    @Builder.Default
    private Boolean resolved = false;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @ManyToOne
    @JoinColumn(name = "resolved_by")
    private UserEntity resolvedBy;

    @Column(name = "resolution_notes", columnDefinition = "TEXT")
    private String resolutionNotes;

    @PrePersist
    protected void onCreate() {
        if (flaggedAt == null) {
            flaggedAt = LocalDateTime.now();
        }
    }

    public enum FlagType {
        NO_ACKNOWLEDGMENT,
        FALSE_RESULT,
        DISPUTE,
        OTHER
    }
}
