package za.co.infratech.rispo.model;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    private String name;

    private Integer rating = 1200;
    private Integer matchesPlayed = 0;
    private Integer wins = 0;
    private Integer losses = 0;
}

