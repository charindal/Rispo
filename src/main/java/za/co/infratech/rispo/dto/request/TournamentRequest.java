package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class TournamentCreateRequest {
    private String name;
    private String startDate;
    private String endDate;
}

