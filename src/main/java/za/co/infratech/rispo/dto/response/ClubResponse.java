package za.co.infratech.rispo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClubResponse {
    private Long clubId;
    private String name;
    private String description;
    private String address;
    private String contactEmail;
    private String contactPhone;
    private String status;
    private String createdByUsername;
    private LocalDateTime createdAt;
}
