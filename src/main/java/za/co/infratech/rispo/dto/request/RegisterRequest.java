package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String email;
    private String nationalId;
    private String name;
    private String phone;
}
