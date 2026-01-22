package za.co.infratech.rispo.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import za.co.infratech.rispo.model.Player;

import java.time.LocalDateTime;

@Entity
@Table(name = "tournament_player_approval", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tournament_id", "player_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentPlayerApproval {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tournament_id", nullable = false)
    private Long tournamentId;
    
    @Column(name = "player_id", nullable = false)
    private Long playerId;
    
    @Column(name = "club_id", nullable = false)
    private Long clubId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", nullable = false)
    private ApprovalStatus approvalStatus = ApprovalStatus.PENDING;
    
    @Column(name = "approved_by")
    private Long approvedBy;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "approved_date")
    private LocalDateTime approvedDate;
    
    @Column(name = "rejection_reason")
    private String rejectionReason;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Column(name = "created_date")
    private LocalDateTime createdDate;
    
    @ManyToOne
    @JoinColumn(name = "player_id", insertable = false, updatable = false)
    private Player player;
    
    @PrePersist
    protected void onCreate() {
        if (createdDate == null) {
            createdDate = LocalDateTime.now();
        }
    }
    
    public enum ApprovalStatus {
        PENDING, APPROVED, REJECTED
    }
}
