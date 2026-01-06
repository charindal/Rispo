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
    private final ChallengeRepository challengeRepository;
    private final MessageProducerService messageProducer;

    @Transactional
    public MatchResponse submitMatch(SubmitMatchRequest request, Long submitterUserId) throws Exception {
        // Get submitter and their player profile
        UserEntity submitter = userRepository.findById(submitterUserId)
                .orElseThrow(() -> new Exception("User not found"));
        
        Player submitterPlayer = playerRepository.findByUserId(submitterUserId)
                .orElseThrow(() -> new Exception("Submitter must have a player profile"));

        // Get opponent
        Player opponent = playerRepository.findById(request.getOpponentPlayerId())
                .orElseThrow(() -> new Exception("Opponent player not found"));

        if (submitterPlayer.getId().equals(opponent.getId())) {
            throw new Exception("Cannot submit a match against yourself");
        }

        // Check if this is from an accepted challenge
        Challenge challenge = null;
        Match existingMatch = null;
        
        if (request.getChallengeId() != null) {
            challenge = challengeRepository.findById(request.getChallengeId())
                    .orElseThrow(() -> new Exception("Challenge not found"));
            
            if (challenge.getStatus() != Challenge.ChallengeStatus.ACCEPTED) {
                throw new Exception("Challenge must be accepted before submitting match result");
            }
            
            // Check if match already exists for this challenge
            existingMatch = matchRepository.findByChallenge(challenge).orElse(null);
            
            if (existingMatch != null && existingMatch.getSubmittedBy() != null) {
                throw new Exception("Match result has already been submitted for this challenge");
            }
        }

        // Create or update match
        Match match = existingMatch != null ? existingMatch : new Match();
        match.setPlayer1(submitterPlayer);
        match.setPlayer2(opponent);
        match.setSubmittedBy(submitter);
        match.setSubmittedAt(LocalDateTime.now());
        match.setStatus(Match.MatchStatus.PENDING_REVIEW);
        match.setIsRated(false);
        match.setTournament(null); // Individual match
        match.setRound(1);
        match.setChallenge(challenge);
        
        // Determine if admin created (SYSTEM_ADMIN cannot process match results)
        boolean isAdmin = submitter.getRole() == UserEntity.Role.RATING_ADMIN ||
                         submitter.getRole() == UserEntity.Role.SUPER_USER ||
                         submitter.getRole() == UserEntity.Role.CLUB_ADMIN;
        
        match.setAdminCreated(isAdmin);

        match = matchRepository.save(match);

        // Create games
        List<Game> games = new ArrayList<>();
        int gameNumber = 1;
        for (SubmitMatchRequest.GameResultRequest gameReq : request.getGames()) {
            Game game = new Game();
            game.setMatch(match);
            game.setPlayer1(submitterPlayer);
            game.setPlayer2(opponent);
            game.setGameNumber(gameNumber++);
            game.setPlayer1Score(gameReq.getPlayer1Score());
            game.setPlayer2Score(gameReq.getPlayer2Score());
            
            // Set result type
            try {
                game.setResultType(Game.GameResultType.valueOf(gameReq.getResultType()));
            } catch (Exception e) {
                game.setResultType(Game.GameResultType.COMPLETED);
            }

            // Set winner
            if (gameReq.getWinnerId() != null) {
                Player winner = playerRepository.findById(gameReq.getWinnerId())
                        .orElseThrow(() -> new Exception("Winner player not found"));
                game.setWinner(winner);
                
                // Set game result enum
                if (winner.getId().equals(submitterPlayer.getId())) {
                    game.setResult(za.co.infratech.rispo.dto.enums.GameResult.PLAYER1_WIN);
                } else {
                    game.setResult(za.co.infratech.rispo.dto.enums.GameResult.PLAYER2_WIN);
                }
            } else {
                game.setWinner(null);
                game.setResult(za.co.infratech.rispo.dto.enums.GameResult.DRAW);
            }

            games.add(gameRepository.save(game));
        }

        return convertToResponse(match, games);
    }

    @Transactional
    public MatchResponse reviewMatch(Long matchId, ReviewMatchRequest request, Long reviewerUserId) throws Exception {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new Exception("Match not found"));

        if (match.getStatus() != Match.MatchStatus.PENDING_REVIEW) {
            throw new Exception("Only pending matches can be reviewed");
        }

        UserEntity reviewer = userRepository.findById(reviewerUserId)
                .orElseThrow(() -> new Exception("Reviewer not found"));

        // Check if reviewer is an admin
        if (reviewer.getRole() != UserEntity.Role.RATING_ADMIN && 
            reviewer.getRole() != UserEntity.Role.SUPER_USER &&
            reviewer.getRole() != UserEntity.Role.SYSTEM_ADMIN &&
            reviewer.getRole() != UserEntity.Role.CLUB_ADMIN) {
            throw new Exception("Only SuperUser, System Admins, Rating Admins, and Club Admins can review matches");
        }

        // For club admins, verify they can only review matches from their club
        if (reviewer.getRole() == UserEntity.Role.CLUB_ADMIN) {
            if (reviewer.getClub() == null) {
                throw new Exception("Club admin must be affiliated with a club");
            }
            
            boolean player1InClub = match.getPlayer1().getClub() != null && 
                                   match.getPlayer1().getClub().getClubId().equals(reviewer.getClub().getClubId());
            boolean player2InClub = match.getPlayer2().getClub() != null && 
                                   match.getPlayer2().getClub().getClubId().equals(reviewer.getClub().getClubId());
            
            if (!player1InClub && !player2InClub) {
                throw new Exception("Club admins can only review matches involving players from their club");
            }
        }

        // Update match status
        Match.MatchStatus newStatus = Match.MatchStatus.valueOf(request.getStatus());
        match.setStatus(newStatus);
        match.setReviewedBy(reviewer);
        match.setReviewedAt(LocalDateTime.now());
        match.setReviewNotes(request.getReviewNotes());

        match = matchRepository.save(match);

        // If approved, publish rating calculation message for async processing
        if (newStatus == Match.MatchStatus.APPROVED) {
            // Publish to queue instead of calculating synchronously
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
            // Refresh match to get any updates (will be updated by async worker)
            match = matchRepository.findById(matchId).orElseThrow();
        }

        List<Game> games = gameRepository.findByMatchId(matchId);
        return convertToResponse(match, games);
    }

    public List<MatchResponse> getPendingMatches() {
        List<Match> matches = matchRepository.findByStatus(Match.MatchStatus.PENDING_REVIEW);
        return matches.stream()
                .map(match -> convertToResponse(match, gameRepository.findByMatchId(match.getId())))
                .collect(Collectors.toList());
    }



    public List<MatchResponse> getMatchesByPlayer(Long playerId) {
        List<Match> matches = matchRepository.findByPlayer1IdOrPlayer2Id(playerId, playerId);
        return matches.stream()
                .map(match -> convertToResponse(match, gameRepository.findByMatchId(match.getId())))
                .collect(Collectors.toList());
    }

    public MatchResponse getMatchById(Long matchId) throws Exception {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new Exception("Match not found"));
        List<Game> games = gameRepository.findByMatchId(matchId);
        return convertToResponse(match, games);
    }

    private MatchResponse convertToResponse(Match match, List<Game> games) {
        MatchResponse response = new MatchResponse();
        response.setMatchId(match.getId());
        response.setPlayer1Id(match.getPlayer1().getId());
        response.setPlayer2Id(match.getPlayer2().getId());
        response.setStatus(match.getStatus().toString());
        response.setIsRated(match.getIsRated());
        response.setChallengeId(match.getChallenge() != null ? match.getChallenge().getChallengeId() : null);
        response.setSubmittedAt(match.getSubmittedAt());
        response.setReviewedAt(match.getReviewedAt());
        response.setReviewNotes(match.getReviewNotes());

        // Player 1
        MatchResponse.PlayerSummary p1 = new MatchResponse.PlayerSummary();
        p1.setPlayerId(match.getPlayer1().getId());
        p1.setName(match.getPlayer1().getName());
        p1.setRating(match.getPlayer1().getRating());
        p1.setEmail(match.getPlayer1().getEmail());
        response.setPlayer1(p1);

        // Player 2
        MatchResponse.PlayerSummary p2 = new MatchResponse.PlayerSummary();
        p2.setPlayerId(match.getPlayer2().getId());
        p2.setName(match.getPlayer2().getName());
        p2.setRating(match.getPlayer2().getRating());
        p2.setEmail(match.getPlayer2().getEmail());
        response.setPlayer2(p2);

        // Winner
        if (match.getWinner() != null) {
            MatchResponse.PlayerSummary winner = new MatchResponse.PlayerSummary();
            winner.setPlayerId(match.getWinner().getId());
            winner.setName(match.getWinner().getName());
            winner.setRating(match.getWinner().getRating());
            response.setWinner(winner);
        }

        // Ratings
        response.setPlayer1RatingBefore(match.getPlayer1RatingBefore());
        response.setPlayer2RatingBefore(match.getPlayer2RatingBefore());
        response.setPlayer1RatingAfter(match.getPlayer1RatingAfter());
        response.setPlayer2RatingAfter(match.getPlayer2RatingAfter());
        response.setPlayer1RatingChange(match.getPlayer1RatingChange());
        response.setPlayer2RatingChange(match.getPlayer2RatingChange());

        // Submitter and reviewer
        if (match.getSubmittedBy() != null) {
            response.setSubmittedBy(match.getSubmittedBy().getUsername());
        }
        if (match.getReviewedBy() != null) {
            response.setReviewedBy(match.getReviewedBy().getUsername());
        }

        // Games
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

    public List<MatchResponse> getTournamentMatches(Long tournamentId, Integer round) {
        List<Match> matches;
        if (round != null) {
            matches = matchRepository.findByTournamentIdOrderByRoundAsc(tournamentId)
                    .stream()
                    .filter(m -> m.getRound() == round)
                    .collect(Collectors.toList());
        } else {
            matches = matchRepository.findByTournamentIdOrderByRoundAsc(tournamentId);
        }
        
        return matches.stream()
                .map(match -> {
                    List<Game> games = gameRepository.findByMatchId(match.getId());
                    return convertToResponse(match, games);
                })
                .collect(Collectors.toList());
    }
}
