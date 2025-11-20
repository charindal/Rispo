package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class AcknowledgeResultRequest {
    private Boolean acknowledged;
    private String notes;
}
