package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class ReviewJoinRequestRequest {
    private String status; // APPROVED or REJECTED
    private String reviewNotes;
}
