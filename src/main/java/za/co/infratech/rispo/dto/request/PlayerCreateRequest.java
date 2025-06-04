package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class PlayerCreateRequest {
    private String name;
    private Long userId;
}
