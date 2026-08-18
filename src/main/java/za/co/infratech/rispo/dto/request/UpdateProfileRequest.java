package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String email;
    private String phone;
    private String name;
}
