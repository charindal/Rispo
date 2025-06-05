package za.co.infratech.rispo.dto.request;

import lombok.Data;

@Data
public class TournamentRequest {
    private String name;
    private String startDate;
    private String endDate;
}

