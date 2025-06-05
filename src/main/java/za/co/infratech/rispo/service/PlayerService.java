package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import za.co.infratech.rispo.dto.request.PlayerRequest;
import za.co.infratech.rispo.dto.response.PlayerResponse;
import za.co.infratech.rispo.model.Player;
import za.co.infratech.rispo.model.UserEntity;
import za.co.infratech.rispo.repository.PlayerRepository;
import za.co.infratech.rispo.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class PlayerService {

    private final PlayerRepository playerRepository;
    private final UserRepository userRepository;

    public PlayerResponse createPlayer(PlayerRequest request) {
        UserEntity user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Player player = new Player();
        player.setName(request.getName());
        player.setUser(user);

        Player saved = playerRepository.save(player);

        PlayerResponse response = new PlayerResponse();
        response.setId(saved.getId());
        response.setName(saved.getName());
        response.setRating(saved.getRating());
        response.setMatchesPlayed(saved.getMatchesPlayed());
        response.setWins(saved.getWins());
        response.setLosses(saved.getLosses());

        return response;
    }
}
