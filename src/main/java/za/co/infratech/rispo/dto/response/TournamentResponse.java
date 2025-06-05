package za.co.infratech.rispo.dto.response;

import lombok.Data;

import java.time.LocalDate;

@Data
public class TournamentResponse {
    private Long id;
    private String name;
    private String startDate;
    private String endDate;

    public TournamentResponse(Long id, String name, LocalDate startDate, LocalDate endDate) {
    }
}
