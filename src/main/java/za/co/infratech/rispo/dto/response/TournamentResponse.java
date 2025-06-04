package za.co.infratech.rispo.dto.response;

import lombok.Data;

@Data
public class TournamentResponse {
    private Long id;
    private String name;
    private String startDate;
    private String endDate;
}
