package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.infratech.rispo.dto.request.SubmitMatchRequest;
import za.co.infratech.rispo.dto.request.ReviewMatchRequest;
import za.co.infratech.rispo.dto.response.MatchResponse;
import za.co.infratech.rispo.model.*;
import za.co.infratech.rispo.repository.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchService {

    private final MatchRepository matchRepository;
    private final PlayerRepository playerRepository;
    private final GameRepository gameRepository;
    private final UserRepository userRepository;
    private final RatingEngine ratingEngine;
    private final MessageProducerService messageProducer;

    /**
     * Submit a match result. Any authenticated user can submit a match;
     * a SYSTEM_ADMIN submission is auto-approved and triggers rating calculation.
     * A PLAYER submission enters PENDING_REVIEW status for admin approval.
     */
    @Transactional
    public MatchResponse submitMatch(SubmitMatchRequest request, Long submitterUserId) throws Exception {
        UserEntity submitter = userRepository.findById(submitterUserId)
                .orElseThrow(() -> new Exception("User not found"));

        Player player1 = playerRepository.findById(request.getPlayer1Id())
                .orElseThrow(() -> new Exception("Player 1 not found"));

        Player player2 = playerRepository.findById(request.getPlayer2Id())
                .orElseThrow(() -> new Exception("Player 2 not found"));

        if (player1.getId().equals(player2.getId())) {
            throw new Exception("Cannot submit a match between the same player");
        }

        Match match = new Match();
        match.setPlayer1(player1);
        match.setPlayer2(player2);
        match.setSubmittedBy(submitter);
        match.setSubmittedAt(LocalDateTime.now());
        match.setRound(request.getRound() != null ? request.getRound() : 1);
        match.setIsRated(false);

        boolean isAdmin = submitter.getRole() == UserEntity.Role.SYSTEM_ADMIN;

        if (isAdmin) {
            // Admin uploads are auto-approved
            match.setStatus(Match.MatchStatus.APPROVED);
            match.setReviewedBy(submitter);
            match.setReviewedAt(LocalDateTime.now());
        } else {
            match.setStatus(Match.MatchStatus.PENDING_REVIEW);
        }

        // Set winner if provided
        if (request.getWinnerId() != null) {
            Player winner = playerRepository.findById(request.getWinnerId())
                    .orElseThrow(() -> new Exception("Winner player not found"));
            if (!winner.getId().equals(player1.getId()) && !winner.getId().equals(player2.getId())) {
                throw new Exception("Winner must be one of the two players");
            }
            match.setWinner(winner);
        }

        match = matchRepository.save(match);

        // Save individual game records if provided
        List<Game> games = new ArrayList<>();
        if (request.getGames() != null) {
            int gameNumber = 1;
            for (SubmitMatchRequest.GameResultRequest gameReq : request.getGames()) {
                Game game = new Game();
                game.setMatch(match);
                game.setPlayer1(player1);
                game.setPlayer2(player2);
                game.setGameNumber(gameNumber++);
                game.setPlayer1Score(gameReq.getPlayer1Score());
                game.setPlayer2Score(gameReq.getPlayer2Score());
                try {
                    game.setResultType(Game.GameResultType.valueOf(gameReq.getResultType()));
                } catch (Exception e) {
                    game.setResultType(Game.GameResultType.COMPLETED);
                }
                if (gameReq.getWinnerId() != null) {
                    Player gameWinner = playerRepository.findById(gameReq.getWinnerId())
                            .orElseThrow(() -> new Exception("Game winner player not found"));
                    game.setWinner(gameWinner);
                    game.setResult(gameWinner.getId().equals(player1.getId())
                            ? za.co.infratech.rispo.dto.enums.GameResult.PLAYER1_WIN
                            : za.co.infratech.rispo.dto.enums.GameResult.PLAYER2_WIN);
                } else {
                    game.setResult(za.co.infratech.rispo.dto.enums.GameResult.DRAW);
                }
                games.add(gameRepository.save(game));
            }
        }

        // Trigger async rating calculation for auto-approved admin submissions
        if (isAdmin && match.getStatus() == Match.MatchStatus.APPROVED) {
            Long winnerId = match.getWinner() != null ? match.getWinner().getId() : null;
            messageProducer.sendRatingCalculationMessage(
                    za.co.infratech.rispo.dto.request.RatingCalculationMessage.builder()
                            .matchId(match.getId())
                            .player1Id(player1.getId())
                            .player2Id(player2.getId())
                            .winnerId(winnerId)
                            .calculationType("MATCH_APPROVE")
                            .build()
            );
        }

        return convertToResponse(match, games);
    }

    /**
     * Review a pending match result. Only SYSTEM_ADMIN can approve/reject.
     */
    @Transactional
    public MatchResponse reviewMatch(Long matchId, ReviewMatchRequest request, Long reviewerUserId) throws Exception {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new Exception("Match not found"));

        if (match.getStatus() != Match.MatchStatus.PENDING_REVIEW) {
            throw new Exception("Only pending matches can be reviewed");
        }

        UserEntity reviewer = userRepository.findById(reviewerUserId)
                .orElseThrow(() -> new Exception("Reviewer not found"));

        if (reviewer.getRole() != UserEntity.Role.SYSTEM_ADMIN) {
            throw new Exception("Only System Administrators can review matches");
        }

        Match.MatchStatus newStatus = Match.MatchStatus.valueOf(request.getStatus());
        match.setStatus(newStatus);
        match.setReviewedBy(reviewer);
        match.setReviewedAt(LocalDateTime.now());
        match.setReviewNotes(request.getReviewNotes());
        match = matchRepository.save(match);

        if (newStatus == Match.MatchStatus.APPROVED) {
            Long winnerId = match.getWinner() != null ? match.getWinner().getId() : null;
            messageProducer.sendRatingCalculationMessage(
                    za.co.infratech.rispo.dto.request.RatingCalculationMessage.builder()
                            .matchId(matchId)
                            .player1Id(match.getPlayer1().getId())
                            .player2Id(match.getPlayer2().getId())
                            .winnerId(winnerId)
                            .calculationType("MATCH_APPROVE")
                            .build()
            );
            match = matchRepository.findById(matchId).orElseThrow();
        }

        List<Game> games = gameRepository.findByMatchId(matchId);
        return convertToResponse(match, games);
    }

    public List<MatchResponse> getPendingMatches() {
        return matchRepository.findByStatus(Match.MatchStatus.PENDING_REVIEW).stream()
                .map(match -> convertToResponse(match, gameRepository.findByMatchId(match.getId())))
                .collect(Collectors.toList());
    }

    public List<MatchResponse> getMatchesByPlayer(Long playerId) {
        return matchRepository.findByPlayer1IdOrPlayer2Id(playerId, playerId).stream()
                .map(match -> convertToResponse(match, gameRepository.findByMatchId(match.getId())))
                .collect(Collectors.toList());
    }

    public MatchResponse getMatchById(Long matchId) throws Exception {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new Exception("Match not found"));
        List<Game> games = gameRepository.findByMatchId(matchId);
        return convertToResponse(match, games);
    }

    public List<MatchResponse> getAllMatches() {
        return matchRepository.findAll().stream()
                .map(match -> convertToResponse(match, gameRepository.findByMatchId(match.getId())))
                .collect(Collectors.toList());
    }

    private MatchResponse convertToResponse(Match match, List<Game> games) {
        MatchResponse response = new MatchResponse();
        response.setMatchId(match.getId());
        response.setPlayer1Id(match.getPlayer1().getId());
        response.setPlayer2Id(match.getPlayer2().getId());
        response.setStatus(match.getStatus().toString());
        response.setIsRated(match.getIsRated());
        response.setRound(match.getRound());
        response.setSubmittedAt(match.getSubmittedAt());
        response.setReviewedAt(match.getReviewedAt());
        response.setReviewNotes(match.getReviewNotes());

        MatchResponse.PlayerSummary p1 = new MatchResponse.PlayerSummary();
        p1.setPlayerId(match.getPlayer1().getId());
        p1.setName(match.getPlayer1().getUser().getUsername());
        p1.setRating(match.getPlayer1().getRating());
        p1.setEmail(match.getPlayer1().getEmail());
        response.setPlayer1(p1);

        MatchResponse.PlayerSummary p2 = new MatchResponse.PlayerSummary();
        p2.setPlayerId(match.getPlayer2().getId());
        p2.setName(match.getPlayer2().getUser().getUsername());
        p2.setRating(match.getPlayer2().getRating());
        p2.setEmail(match.getPlayer2().getEmail());
        response.setPlayer2(p2);

        if (match.getWinner() != null) {
            MatchResponse.PlayerSummary winner = new MatchResponse.PlayerSummary();
            winner.setPlayerId(match.getWinner().getId());
            winner.setName(match.getWinner().getUser().getUsername());
            winner.setRating(match.getWinner().getRating());
            response.setWinner(winner);
        }

        response.setPlayer1RatingBefore(match.getPlayer1RatingBefore());
        response.setPlayer2RatingBefore(match.getPlayer2RatingBefore());
        response.setPlayer1RatingAfter(match.getPlayer1RatingAfter());
        response.setPlayer2RatingAfter(match.getPlayer2RatingAfter());
        response.setPlayer1RatingChange(match.getPlayer1RatingChange());
        response.setPlayer2RatingChange(match.getPlayer2RatingChange());

        if (match.getSubmittedBy() != null) response.setSubmittedBy(match.getSubmittedBy().getUsername());
        if (match.getReviewedBy() != null) response.setReviewedBy(match.getReviewedBy().getUsername());

        List<MatchResponse.GameSummary> gameSummaries = games.stream()
                .map(game -> {
                    MatchResponse.GameSummary gs = new MatchResponse.GameSummary();
                    gs.setGameId(game.getId());
                    gs.setGameNumber(game.getGameNumber());
                    gs.setPlayer1Score(game.getPlayer1Score());
                    gs.setPlayer2Score(game.getPlayer2Score());
                    gs.setResultType(game.getResultType().toString());
                    if (game.getWinner() != null) {
                        gs.setWinnerId(game.getWinner().getId());
                        gs.setWinnerName(game.getWinner().getName());
                    }
                    return gs;
                })
                .collect(Collectors.toList());
        response.setGames(gameSummaries);

        return response;
    }
}
