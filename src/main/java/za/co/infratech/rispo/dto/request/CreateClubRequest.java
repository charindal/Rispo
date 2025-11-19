package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class CreateClubRequest {
    private String name;
    private String description;
    private String address;
    private String contactEmail;
    private String contactPhone;
}
