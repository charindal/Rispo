package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class UpdateClubRequest {
    private String name;
    private String description;
    private String address;
    private String city;
    private String suburb;
    private String contactEmail;
    private String contactPhone;
}
