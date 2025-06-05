package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import za.co.infratech.rispo.dto.enums.MatchResult;
import za.co.infratech.rispo.dto.request.MatchRequest;
import za.co.infratech.rispo.dto.response.MatchResponse;
import za.co.infratech.rispo.model.Match;
import za.co.infratech.rispo.model.Player;
import za.co.infratech.rispo.repository.MatchRepository;
import za.co.infratech.rispo.repository.PlayerRepository;
import za.co.infratech.rispo.util.RatingCalculator;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final PlayerRepository playerRepository;
    private static final int BASE_RATING_CHANGE = 16;

    public MatchResponse createMatch(MatchRequest request) {
        log.info("Creating match: {}", request);

        Player player1 = playerRepository.findById(request.getPlayer1Id())
                .orElseThrow(() -> new IllegalArgumentException("Player 1 not found"));
        Player player2 = playerRepository.findById(request.getPlayer2Id())
                .orElseThrow(() -> new IllegalArgumentException("Player 2 not found"));

        // Calculate rating changes
        Map<String, Integer> ratingChanges = RatingCalculator.calculate(player1.getRating(), player2.getRating(), request.getResult());
        int player1Change = ratingChanges.get("player1");
        int player2Change = ratingChanges.get("player2");

        log.info("Rating changes - Player1: {}, Player2: {}", player1Change, player2Change);

        // Apply rating and match stats
        player1.setRating(player1.getRating() + player1Change);
        player2.setRating(player2.getRating() + player2Change);

        player1.setMatchesPlayed(player1.getMatchesPlayed() + 1);
        player2.setMatchesPlayed(player2.getMatchesPlayed() + 1);

        if (request.getResult() == MatchResult.PLAYER1_WIN) {
            player1.setWins(player1.getWins() + 1);
            player2.setLosses(player2.getLosses() + 1);
        } else if (request.getResult() == MatchResult.PLAYER2_WIN) {
            player2.setWins(player2.getWins() + 1);
            player1.setLosses(player1.getLosses() + 1);
        }

        playerRepository.save(player1);
        playerRepository.save(player2);

        Match match = new Match();
        match.setPlayer1(player1);
        match.setPlayer2(player2);
        match.setDatePlayed(request.getDatePlayed());
        match.setPlayer1RatingChange(player1Change);
        match.setPlayer2RatingChange(player2Change);

        if (request.getResult() == MatchResult.PLAYER1_WIN) {
            match.setWinner(player1);
        } else if (request.getResult() == MatchResult.PLAYER2_WIN) {
            match.setWinner(player2);
        } else {
            match.setWinner(null);
        }

        Match savedMatch = matchRepository.save(match);

        return new MatchResponse(
                savedMatch.getId(),
                player1.getId(),
                player2.getId(),
                request.getResult(),
                match.getWinner() != null ? match.getWinner().getId() : null,
                player1Change,
                player2Change,
                savedMatch.getDatePlayed()
        );
    }


}
