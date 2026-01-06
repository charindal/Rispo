package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.infratech.rispo.dto.request.TournamentCreateRequest;
import za.co.infratech.rispo.dto.request.TournamentUpdateRequest;
import za.co.infratech.rispo.dto.request.TournamentMatchResultRequest;
import za.co.infratech.rispo.dto.response.TournamentPlayerResponse;
import za.co.infratech.rispo.dto.response.TournamentResponse;
import za.co.infratech.rispo.model.*;
import za.co.infratech.rispo.repository.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TournamentService {

    private final TournamentRepository tournamentRepository;
    private final TournamentPlayerRepository tournamentPlayerRepository;
    private final UserRepository userRepository;
    private final ClubRepository clubRepository;
    private final PlayerRepository playerRepository;
    private final SwissPairingService swissPairingService;
    private final KnockoutPairingService knockoutPairingService;
    private final RoundRobinPairingService roundRobinPairingService;
    private final RandomPairingService randomPairingService;
    private final MatchRepository matchRepository;
    private final GameRepository gameRepository;
    private final RatingEngine ratingEngine;
    private final MessageProducerService messageProducer;

    @Transactional
    public TournamentResponse createTournament(TournamentCreateRequest request, Long userId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify user is an admin
        if (!isAdmin(user.getRole())) {
            throw new RuntimeException("Only administrators can create tournaments");
        }

        Tournament tournament = new Tournament();
        tournament.setName(request.getName());
        tournament.setDescription(request.getDescription());
        tournament.setStartDate(request.getStartDate());
        tournament.setCreatedBy(user);
        tournament.setMaxParticipants(request.getMaxParticipants());
        tournament.setVenue(request.getVenue());
        tournament.setRules(request.getRules());
        tournament.setStatus("DRAFT");
        
        // Set tournament format
        if (request.getFormat() != null) {
            try {
                tournament.setFormat(Tournament.TournamentFormat.valueOf(request.getFormat().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid tournament format. Must be SWISS, KNOCKOUT, ROUND_ROBIN, or RANDOM");
            }
        } else {
            tournament.setFormat(Tournament.TournamentFormat.SWISS); // Default to Swiss
        }

        // Set total rounds for Swiss/Random tournaments
        if (request.getTotalRounds() != null && request.getTotalRounds() > 0) {
            tournament.setTotalRounds(request.getTotalRounds());
        }

        // Set minimum participants
        if (request.getMinParticipants() != null && request.getMinParticipants() > 0) {
            tournament.setMinParticipants(request.getMinParticipants());
        }

        // Set everyonePlaysEveryone for RANDOM format
        if (request.getEveryonePlaysEveryone() != null) {
            tournament.setEveryonePlaysEveryone(request.getEveryonePlaysEveryone());
        }

        if (request.getClubId() != null) {
            Club club = clubRepository.findById(request.getClubId())
                    .orElseThrow(() -> new RuntimeException("Club not found"));
            tournament.setClub(club);
        }

        Tournament saved = tournamentRepository.save(tournament);
        return toResponse(saved);
    }

    @Transactional
    public TournamentResponse updateTournament(Long tournamentId, TournamentUpdateRequest request, Long userId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify user is admin and can modify
        if (!isAdmin(user.getRole())) {
            throw new RuntimeException("Only administrators can update tournaments");
        }

        if (request.getName() != null) tournament.setName(request.getName());
        if (request.getDescription() != null) tournament.setDescription(request.getDescription());
        if (request.getStartDate() != null) tournament.setStartDate(request.getStartDate());
        if (request.getMaxParticipants() != null) tournament.setMaxParticipants(request.getMaxParticipants());
        if (request.getVenue() != null) tournament.setVenue(request.getVenue());
        if (request.getRules() != null) tournament.setRules(request.getRules());

        Tournament updated = tournamentRepository.save(tournament);
        return toResponse(updated);
    }

    @Transactional
    public TournamentResponse publishTournament(Long tournamentId, Long userId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!isAdmin(user.getRole())) {
            throw new RuntimeException("Only administrators can publish tournaments");
        }

        if (!"DRAFT".equals(tournament.getStatus())) {
            throw new RuntimeException("Only draft tournaments can be published");
        }

        tournament.setStatus("PUBLISHED");
        Tournament updated = tournamentRepository.save(tournament);
        return toResponse(updated);
    }

    @Transactional
    public void deleteTournament(Long tournamentId, Long userId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!isAdmin(user.getRole())) {
            throw new RuntimeException("Only administrators can delete tournaments");
        }

        tournamentRepository.delete(tournament);
    }

    @Transactional
    public TournamentResponse closeTournament(Long tournamentId, Long userId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check permission: must be super user OR tournament creator
        boolean isSuperUser = user.getRole() == UserEntity.Role.SUPER_USER;
        boolean isTournamentCreator = tournament.getCreatedBy().getId().equals(userId);
        
        if (!isSuperUser && !isTournamentCreator) {
            throw new RuntimeException("Only the tournament creator or super users can close a tournament");
        }

        if ("COMPLETED".equals(tournament.getStatus()) || "CANCELLED".equals(tournament.getStatus())) {
            throw new RuntimeException("Tournament is already closed");
        }

        if ("DRAFT".equals(tournament.getStatus())) {
            throw new RuntimeException("Cannot close a draft tournament. Publish it first or delete it.");
        }

        tournament.setStatus("COMPLETED");
        tournament.setClosedAt(LocalDateTime.now());
        Tournament updated = tournamentRepository.save(tournament);
        return toResponse(updated);
    }

    public List<TournamentResponse> getAllTournaments() {
        return tournamentRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<TournamentResponse> getPublishedTournaments() {
        return tournamentRepository.findByStatusIn(Arrays.asList("PUBLISHED", "ONGOING"))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public TournamentResponse getTournamentById(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));
        return toResponse(tournament);
    }

    @Transactional
    public TournamentPlayerResponse joinTournament(Long tournamentId, Long playerId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        if (!"PUBLISHED".equals(tournament.getStatus())) {
            throw new RuntimeException("Tournament is not open for registration");
        }

        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        // Check club affiliation for club-specific tournaments
        if (tournament.getClub() != null) {
            // Tournament is affiliated with a club - only club members can join
            if (player.getClub() == null || !player.getClub().getClubId().equals(tournament.getClub().getClubId())) {
                throw new RuntimeException("This tournament is only open to members of " + tournament.getClub().getName());
            }
        }

        // Check if already joined or has pending request
        var existingRequest = tournamentPlayerRepository.findByTournamentIdAndPlayerId(tournamentId, playerId);
        if (existingRequest.isPresent()) {
            TournamentPlayer existing = existingRequest.get();
            String status = existing.getStatus();
            
            if ("APPROVED".equals(status)) {
                throw new RuntimeException("You are already a participant in this tournament");
            } else if ("PENDING".equals(status)) {
                throw new RuntimeException("Your join request is already pending approval");
            } else if ("REJECTED".equals(status)) {
                // Allow re-applying after rejection - update the existing record
                existing.setStatus("PENDING");
                existing.setRequestedAt(LocalDateTime.now());
                existing.setRespondedAt(null);
                existing.setRespondedBy(null);
                TournamentPlayer saved = tournamentPlayerRepository.save(existing);
                return toPlayerResponse(saved);
            }
        }

        // Check if tournament is full (approved players)
        if (tournament.getMaxParticipants() != null) {
            long approvedCount = tournamentPlayerRepository.countByTournamentIdAndStatus(tournamentId, "APPROVED");
            if (approvedCount >= tournament.getMaxParticipants()) {
                throw new RuntimeException("Tournament is full");
            }
        }

        TournamentPlayer tournamentPlayer = new TournamentPlayer();
        tournamentPlayer.setTournament(tournament);
        tournamentPlayer.setPlayer(player);
        tournamentPlayer.setStatus("PENDING");
        tournamentPlayer.setRequestedAt(LocalDateTime.now());

        TournamentPlayer saved = tournamentPlayerRepository.save(tournamentPlayer);
        return toPlayerResponse(saved);
    }

    @Transactional
    public TournamentPlayerResponse approveJoinRequest(Long tournamentId, Long playerId, Long adminUserId) {
        UserEntity admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!isAdmin(admin.getRole())) {
            throw new RuntimeException("Only administrators can approve join requests");
        }

        TournamentPlayer tournamentPlayer = tournamentPlayerRepository
                .findByTournamentIdAndPlayerId(tournamentId, playerId)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        if (!"PENDING".equals(tournamentPlayer.getStatus())) {
            throw new RuntimeException("Only pending requests can be approved");
        }

        // Check if tournament is full
        Tournament tournament = tournamentPlayer.getTournament();
        if (tournament.getMaxParticipants() != null) {
            long approvedCount = tournamentPlayerRepository.countByTournamentIdAndStatus(tournamentId, "APPROVED");
            if (approvedCount >= tournament.getMaxParticipants()) {
                throw new RuntimeException("Tournament is full");
            }
        }

        tournamentPlayer.setStatus("APPROVED");
        tournamentPlayer.setRespondedAt(LocalDateTime.now());
        tournamentPlayer.setRespondedBy(admin);

        TournamentPlayer updated = tournamentPlayerRepository.save(tournamentPlayer);
        return toPlayerResponse(updated);
    }

    @Transactional
    public TournamentPlayerResponse rejectJoinRequest(Long tournamentId, Long playerId, Long adminUserId) {
        UserEntity admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!isAdmin(admin.getRole())) {
            throw new RuntimeException("Only administrators can reject join requests");
        }

        TournamentPlayer tournamentPlayer = tournamentPlayerRepository
                .findByTournamentIdAndPlayerId(tournamentId, playerId)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        if (!"PENDING".equals(tournamentPlayer.getStatus())) {
            throw new RuntimeException("Only pending requests can be rejected");
        }

        tournamentPlayer.setStatus("REJECTED");
        tournamentPlayer.setRespondedAt(LocalDateTime.now());
        tournamentPlayer.setRespondedBy(admin);

        TournamentPlayer updated = tournamentPlayerRepository.save(tournamentPlayer);
        return toPlayerResponse(updated);
    }

    public List<TournamentPlayerResponse> getTournamentPlayers(Long tournamentId) {
        return tournamentPlayerRepository.findByTournamentId(tournamentId).stream()
                .map(this::toPlayerResponse)
                .collect(Collectors.toList());
    }

    public List<TournamentPlayerResponse> getTournamentPendingRequests(Long tournamentId) {
        return tournamentPlayerRepository.findByTournamentIdAndStatus(tournamentId, "PENDING")
                .stream()
                .map(this::toPlayerResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<Match> generateTournamentMatches(Long tournamentId, Integer roundNumber, Long adminUserId) {
        // Get user
        UserEntity user = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get tournament
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        // Check permission: must be super user OR tournament creator
        boolean isSuperUser = user.getRole() == UserEntity.Role.SUPER_USER;
        boolean isTournamentCreator = tournament.getCreatedBy().getId().equals(adminUserId);
        
        if (!isSuperUser && !isTournamentCreator) {
            throw new RuntimeException("Only the tournament creator or super users can generate tournament matches");
        }

        // Tournament must be ONGOING or PUBLISHED
        if (!"ONGOING".equals(tournament.getStatus()) && !"PUBLISHED".equals(tournament.getStatus())) {
            throw new RuntimeException("Tournament must be ONGOING or PUBLISHED to generate matches");
        }

        // Get approved players for this tournament
        List<TournamentPlayer> tournamentPlayers = tournamentPlayerRepository
                .findByTournamentIdAndStatus(tournamentId, "APPROVED");

        if (tournamentPlayers.isEmpty()) {
            throw new RuntimeException("No approved players in tournament");
        }

        if (tournamentPlayers.size() < 2) {
            throw new RuntimeException("Need at least 2 players to generate matches");
        }

        // Check minimum participants requirement
        if (tournament.getMinParticipants() != null && tournamentPlayers.size() < tournament.getMinParticipants()) {
            throw new RuntimeException("Minimum " + tournament.getMinParticipants() + 
                    " participants required to start the tournament. Currently only " + 
                    tournamentPlayers.size() + " approved players.");
        }

        List<Player> players = tournamentPlayers.stream()
                .map(TournamentPlayer::getPlayer)
                .collect(Collectors.toList());

        // Get previous matches for this tournament
        List<Match> previousMatches = matchRepository.findByTournamentIdOrderByRoundAsc(tournamentId);

        // Determine round number if not specified
        int round = roundNumber != null ? roundNumber : determineNextRound(previousMatches);

        // Check if matches already exist for this round
        long existingMatchesInRound = previousMatches.stream()
                .filter(m -> m.getRound() == round)
                .count();

        if (existingMatchesInRound > 0) {
            throw new RuntimeException("Matches already exist for round " + round + ". Please complete or delete them first.");
        }

        // Generate pairings based on tournament format
        List<Match> matches;
        
        if (tournament.getFormat() == Tournament.TournamentFormat.KNOCKOUT) {
            // For knockout, after round 1, only use winners plus bye players
            List<Player> activePlayers = players;
            if (round > 1) {
                // Get winners from previous round
                List<Player> winners = previousMatches.stream()
                        .filter(m -> m.getRound() == round - 1)
                        .filter(m -> m.getStatus() == Match.MatchStatus.APPROVED)
                        .filter(m -> m.getWinner() != null)
                        .map(Match::getWinner)
                        .collect(Collectors.toList());
                
                // Add bye players from round 1 to round 2
                if (round == 2) {
                    List<Player> byePlayers = knockoutPairingService.getByePlayers(players);
                    winners.addAll(byePlayers);
                    // Sort by rating to maintain seeding
                    winners.sort((p1, p2) -> Integer.compare(p2.getRating(), p1.getRating()));
                }
                
                activePlayers = winners;
                
                if (activePlayers.isEmpty()) {
                    throw new RuntimeException("Cannot generate round " + round + ": No winners from previous round");
                }
                
                if (activePlayers.size() == 1) {
                    throw new RuntimeException("Tournament is complete! Champion: " + activePlayers.get(0).getName());
                }
            }
            
            List<KnockoutPairingService.PlayerPair> knockoutPairings = 
                    knockoutPairingService.generateKnockoutPairings(activePlayers, previousMatches, round);
            
            if (knockoutPairings.isEmpty()) {
                throw new RuntimeException("Tournament is complete! Champion has been determined.");
            }
            
            matches = knockoutPairings.stream()
                    .map(pair -> {
                        Match match = Match.builder()
                                .tournament(tournament)
                                .round(round)
                                .player1(pair.getPlayer1())
                                .player2(pair.getPlayer2())
                                .adminCreated(true)
                                .status(Match.MatchStatus.PENDING_REVIEW)
                                .isRated(true)
                                .player1RatingBefore(pair.getPlayer1().getRating())
                                .player2RatingBefore(pair.getPlayer2().getRating())
                                .createdAt(LocalDateTime.now())
                                .build();
                        return matchRepository.save(match);
                    })
                    .collect(Collectors.toList());
                    
        } else if (tournament.getFormat() == Tournament.TournamentFormat.ROUND_ROBIN) {
            // Round Robin format - every player plays every other player
            List<RoundRobinPairingService.PlayerPair> roundRobinPairings = 
                    roundRobinPairingService.generateRoundRobinPairings(players, previousMatches, round);
            
            if (roundRobinPairings.isEmpty()) {
                throw new RuntimeException("All Round-Robin matches have been generated. Tournament is complete!");
            }
            
            matches = roundRobinPairings.stream()
                    .map(pair -> {
                        Match match = Match.builder()
                                .tournament(tournament)
                                .round(round)
                                .player1(pair.getPlayer1())
                                .player2(pair.getPlayer2())
                                .adminCreated(true)
                                .status(Match.MatchStatus.PENDING_REVIEW)
                                .isRated(true)
                                .player1RatingBefore(pair.getPlayer1().getRating())
                                .player2RatingBefore(pair.getPlayer2().getRating())
                                .createdAt(LocalDateTime.now())
                                .build();
                        return matchRepository.save(match);
                    })
                    .collect(Collectors.toList());
                    
        } else if (tournament.getFormat() == Tournament.TournamentFormat.RANDOM) {
            // Random format - random pairing with no rating seeding
            boolean everyonePlaysEveryone = Boolean.TRUE.equals(tournament.getEveryonePlaysEveryone());
            
            // Validate fixed rounds if not everyone-plays-everyone
            if (!everyonePlaysEveryone && tournament.getTotalRounds() != null) {
                if (round > tournament.getTotalRounds()) {
                    throw new RuntimeException("All " + tournament.getTotalRounds() + " rounds have been completed. Tournament is complete!");
                }
                if (tournament.getTotalRounds() >= players.size()) {
                    throw new RuntimeException("Total rounds (" + tournament.getTotalRounds() + 
                            ") must be less than number of players (" + players.size() + ")");
                }
            }
            
            List<RandomPairingService.PlayerPair> randomPairings = 
                    randomPairingService.generateRandomPairings(players, previousMatches, round, everyonePlaysEveryone);
            
            if (randomPairings.isEmpty()) {
                throw new RuntimeException("All random matches have been generated. Tournament is complete!");
            }
            
            matches = randomPairings.stream()
                    .map(pair -> {
                        Match match = Match.builder()
                                .tournament(tournament)
                                .round(round)
                                .player1(pair.getPlayer1())
                                .player2(pair.getPlayer2())
                                .adminCreated(true)
                                .status(Match.MatchStatus.PENDING_REVIEW)
                                .isRated(true)
                                .player1RatingBefore(pair.getPlayer1().getRating())
                                .player2RatingBefore(pair.getPlayer2().getRating())
                                .createdAt(LocalDateTime.now())
                                .build();
                        return matchRepository.save(match);
                    })
                    .collect(Collectors.toList());
                    
        } else {
            // Swiss format (default)
            SwissPairingService.SwissPairingResult swissResult = 
                    swissPairingService.generateSwissPairingsWithBye(players, previousMatches, round);

            matches = swissResult.getPairings().stream()
                    .map(pair -> {
                        Match match = Match.builder()
                                .tournament(tournament)
                                .round(round)
                                .player1(pair.getPlayer1())
                                .player2(pair.getPlayer2())
                                .adminCreated(true)
                                .status(Match.MatchStatus.PENDING_REVIEW)
                                .isRated(true)
                                .isBye(false)
                                .player1RatingBefore(pair.getPlayer1().getRating())
                                .player2RatingBefore(pair.getPlayer2().getRating())
                                .createdAt(LocalDateTime.now())
                                .build();
                        return matchRepository.save(match);
                    })
                    .collect(Collectors.toList());
            
            // Create bye match if there's a bye player
            if (swissResult.hasBye()) {
                Player byePlayer = swissResult.getByePlayer();
                // For bye, player plays against themselves (placeholder) - auto-approved, no rating change
                Match byeMatch = Match.builder()
                        .tournament(tournament)
                        .round(round)
                        .player1(byePlayer)
                        .player2(byePlayer)  // Self-match indicates bye
                        .winner(byePlayer)   // Bye player wins automatically
                        .adminCreated(true)
                        .status(Match.MatchStatus.APPROVED)  // Auto-approved
                        .isRated(false)  // Byes don't affect rating
                        .isBye(true)
                        .player1RatingBefore(byePlayer.getRating())
                        .player2RatingBefore(byePlayer.getRating())
                        .player1RatingAfter(byePlayer.getRating())
                        .player2RatingAfter(byePlayer.getRating())
                        .player1RatingChange(0)
                        .player2RatingChange(0)
                        .createdAt(LocalDateTime.now())
                        .reviewedAt(LocalDateTime.now())
                        .build();
                matches.add(matchRepository.save(byeMatch));
            }
        }

        // Set tournament to ONGOING if it was PUBLISHED
        if ("PUBLISHED".equals(tournament.getStatus())) {
            tournament.setStatus("ONGOING");
            tournamentRepository.save(tournament);
        }

        return matches;
    }

    /**
     * Determine the next round number based on existing matches.
     */
    private int determineNextRound(List<Match> previousMatches) {
        if (previousMatches.isEmpty()) {
            return 1;
        }

        // Find the highest round number
        int maxRound = previousMatches.stream()
                .mapToInt(Match::getRound)
                .max()
                .orElse(0);

        // Check if all matches in the highest round are completed
        long completedInMaxRound = previousMatches.stream()
                .filter(m -> m.getRound() == maxRound)
                .filter(m -> m.getStatus() == Match.MatchStatus.APPROVED)
                .count();

        long totalInMaxRound = previousMatches.stream()
                .filter(m -> m.getRound() == maxRound)
                .count();

        // If all matches in current round are approved, start next round
        if (completedInMaxRound == totalInMaxRound) {
            return maxRound + 1;
        }

        // Otherwise, continue current round
        return maxRound;
    }

    private boolean isAdmin(UserEntity.Role role) {
        return role == UserEntity.Role.SUPER_USER || 
               role == UserEntity.Role.SYSTEM_ADMIN || 
               role == UserEntity.Role.CLUB_ADMIN || 
               role == UserEntity.Role.RATING_ADMIN;
    }

    private TournamentResponse toResponse(Tournament tournament) {
        TournamentResponse response = new TournamentResponse();
        response.setId(tournament.getId());
        response.setTournamentId(tournament.getId()); // Alias for frontend compatibility
        response.setName(tournament.getName());
        response.setDescription(tournament.getDescription());
        response.setStartDate(tournament.getStartDate());
        response.setStatus(tournament.getStatus());
        response.setFormat(tournament.getFormat() != null ? tournament.getFormat().name() : "SWISS");
        response.setCreatedById(tournament.getCreatedBy().getId());
        response.setCreatedByUsername(tournament.getCreatedBy().getUsername());
        response.setClosedAt(tournament.getClosedAt());
        
        if (tournament.getClub() != null) {
            response.setClubId(tournament.getClub().getClubId());
            response.setClubName(tournament.getClub().getName());
        }
        
        response.setMaxParticipants(tournament.getMaxParticipants());
        response.setMinParticipants(tournament.getMinParticipants());
        response.setVenue(tournament.getVenue());
        response.setRules(tournament.getRules());
        response.setTotalRounds(tournament.getTotalRounds());
        response.setEveryonePlaysEveryone(tournament.getEveryonePlaysEveryone());
        response.setCreatedAt(tournament.getCreatedAt());
        response.setUpdatedAt(tournament.getUpdatedAt());

        // Count participants
        long approvedCount = tournamentPlayerRepository.countByTournamentIdAndStatus(tournament.getId(), "APPROVED");
        long pendingCount = tournamentPlayerRepository.countByTournamentIdAndStatus(tournament.getId(), "PENDING");
        response.setCurrentParticipants((int) approvedCount);
        response.setPendingRequests((int) pendingCount);

        // Check if minimum participants met
        Integer minParticipants = tournament.getMinParticipants();
        boolean canStart = minParticipants == null || approvedCount >= minParticipants;
        response.setCanStart(canStart);

        // Get current round from matches
        List<Match> matches = matchRepository.findByTournamentIdOrderByRoundAsc(tournament.getId());
        if (!matches.isEmpty()) {
            int maxRound = matches.stream().mapToInt(Match::getRound).max().orElse(0);
            response.setCurrentRound(maxRound);
        } else {
            response.setCurrentRound(0);
        }

        return response;
    }

    private TournamentPlayerResponse toPlayerResponse(TournamentPlayer tp) {
        TournamentPlayerResponse response = new TournamentPlayerResponse();
        response.setTournamentId(tp.getTournament().getId());
        response.setTournamentName(tp.getTournament().getName());
        response.setPlayerId(tp.getPlayer().getId());
        response.setPlayerName(tp.getPlayer().getName());
        response.setPlayerRating(tp.getPlayer().getRating());
        response.setStatus(tp.getStatus());
        response.setRequestedAt(tp.getRequestedAt());
        response.setRespondedAt(tp.getRespondedAt());
        
        if (tp.getRespondedBy() != null) {
            response.setRespondedById(tp.getRespondedBy().getId());
            response.setRespondedByUsername(tp.getRespondedBy().getUsername());
        }
        
        return response;
    }

    public List<Map<String, Object>> getTournamentStandings(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        // Get approved players
        List<TournamentPlayer> tournamentPlayers = tournamentPlayerRepository
                .findByTournamentIdAndStatus(tournamentId, "APPROVED");

        // Get all matches
        List<Match> matches = matchRepository.findByTournamentIdOrderByRoundAsc(tournamentId);

        // Calculate standings for each player
        List<Map<String, Object>> standings = new java.util.ArrayList<>();

        for (TournamentPlayer tp : tournamentPlayers) {
            Player player = tp.getPlayer();
            Map<String, Object> playerStanding = new java.util.HashMap<>();
            
            playerStanding.put("playerId", player.getId());
            playerStanding.put("playerName", player.getName());
            playerStanding.put("currentRating", player.getRating());
            
            // Calculate score from completed matches
            double score = 0;
            int matchesPlayed = 0;
            int wins = 0;
            int losses = 0;
            int draws = 0;
            int ratingChange = 0;

            for (Match match : matches) {
                if (match.getStatus() != Match.MatchStatus.APPROVED) continue;
                
                boolean isPlayer1 = match.getPlayer1().getId().equals(player.getId());
                boolean isPlayer2 = match.getPlayer2().getId().equals(player.getId());
                
                if (!isPlayer1 && !isPlayer2) continue;
                
                matchesPlayed++;
                
                if (match.getWinner() == null) {
                    // Draw
                    score += 0.5;
                    draws++;
                } else if (match.getWinner().getId().equals(player.getId())) {
                    // Win
                    score += 1;
                    wins++;
                } else {
                    // Loss
                    losses++;
                }

                // Calculate rating change
                if (isPlayer1 && match.getPlayer1RatingChange() != null) {
                    ratingChange += match.getPlayer1RatingChange();
                } else if (isPlayer2 && match.getPlayer2RatingChange() != null) {
                    ratingChange += match.getPlayer2RatingChange();
                }
            }

            playerStanding.put("score", score);
            playerStanding.put("matchesPlayed", matchesPlayed);
            playerStanding.put("wins", wins);
            playerStanding.put("losses", losses);
            playerStanding.put("draws", draws);
            playerStanding.put("ratingChange", ratingChange);
            
            standings.add(playerStanding);
        }

        // Sort by score (descending), then by rating (descending)
        standings.sort((a, b) -> {
            int scoreCompare = Double.compare((Double) b.get("score"), (Double) a.get("score"));
            if (scoreCompare != 0) return scoreCompare;
            return Integer.compare((Integer) b.get("currentRating"), (Integer) a.get("currentRating"));
        });

        // Add rank
        for (int i = 0; i < standings.size(); i++) {
            standings.get(i).put("rank", i + 1);
        }

        return standings;
    }

    public Map<String, Object> getTournamentCrossTable(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        // Get approved players sorted by standing
        List<Map<String, Object>> standings = getTournamentStandings(tournamentId);

        // Get all completed matches
        List<Match> matches = matchRepository.findByTournamentIdOrderByRoundAsc(tournamentId)
                .stream()
                .filter(m -> m.getStatus() == Match.MatchStatus.APPROVED)
                .collect(java.util.stream.Collectors.toList());

        // Build cross-table data
        List<Map<String, Object>> crossTableRows = new java.util.ArrayList<>();

        for (Map<String, Object> standing : standings) {
            Long playerId = (Long) standing.get("playerId");
            Map<String, Object> row = new java.util.HashMap<>();
            row.put("playerId", playerId);
            row.put("playerName", standing.get("playerName"));
            row.put("score", standing.get("score"));
            row.put("rank", standing.get("rank"));

            // Results against each opponent
            Map<Long, Object> results = new java.util.HashMap<>();
            
            for (Map<String, Object> opponent : standings) {
                Long opponentId = (Long) opponent.get("playerId");
                
                if (playerId.equals(opponentId)) {
                    results.put(opponentId, "X"); // Self
                    continue;
                }

                // Find match between these players
                Match foundMatch = null;
                for (Match match : matches) {
                    boolean isMatchBetween = 
                        (match.getPlayer1().getId().equals(playerId) && match.getPlayer2().getId().equals(opponentId)) ||
                        (match.getPlayer2().getId().equals(playerId) && match.getPlayer1().getId().equals(opponentId));
                    
                    if (isMatchBetween) {
                        foundMatch = match;
                        break;
                    }
                }

                if (foundMatch == null) {
                    results.put(opponentId, "-"); // Not played yet
                } else {
                    Map<String, Object> result = new java.util.HashMap<>();
                    boolean isPlayer1 = foundMatch.getPlayer1().getId().equals(playerId);
                    
                    if (foundMatch.getWinner() == null) {
                        result.put("result", "D"); // Draw
                        result.put("points", 0.5);
                    } else if (foundMatch.getWinner().getId().equals(playerId)) {
                        result.put("result", "W"); // Win
                        result.put("points", 1.0);
                    } else {
                        result.put("result", "L"); // Loss
                        result.put("points", 0.0);
                    }
                    
                    // Add rating changes
                    if (isPlayer1) {
                        result.put("ratingChange", foundMatch.getPlayer1RatingChange());
                    } else {
                        result.put("ratingChange", foundMatch.getPlayer2RatingChange());
                    }
                    result.put("round", foundMatch.getRound());
                    result.put("matchId", foundMatch.getId());
                    
                    results.put(opponentId, result);
                }
            }
            
            row.put("results", results);
            crossTableRows.add(row);
        }

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("tournamentId", tournamentId);
        response.put("tournamentName", tournament.getName());
        response.put("players", standings.stream()
                .map(s -> Map.of("playerId", s.get("playerId"), "playerName", s.get("playerName")))
                .collect(java.util.stream.Collectors.toList()));
        response.put("crossTable", crossTableRows);

        return response;
    }

    /**
     * Update tournament match result and optionally approve it.
     * Only the tournament creator or super users can manage tournament matches.
     */
    @Transactional
    public Match updateTournamentMatchResult(Long matchId, TournamentMatchResultRequest request, Long adminUserId) {
        // Get the user
        UserEntity user = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get the match
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        if (match.getTournament() == null) {
            throw new RuntimeException("This is not a tournament match");
        }

        // Check permission: must be super user OR tournament creator
        boolean isSuperUser = user.getRole() == UserEntity.Role.SUPER_USER;
        boolean isTournamentCreator = match.getTournament().getCreatedBy().getId().equals(adminUserId);
        
        if (!isSuperUser && !isTournamentCreator) {
            throw new RuntimeException("Only the tournament creator or super users can manage tournament matches");
        }

        if (match.getStatus() == Match.MatchStatus.APPROVED) {
            throw new RuntimeException("Cannot update an already approved match");
        }

        // Set winner if provided
        if (request.getWinnerId() != null) {
            Player winner = playerRepository.findById(request.getWinnerId())
                    .orElseThrow(() -> new RuntimeException("Winner player not found"));
            
            // Verify winner is one of the players
            if (!winner.getId().equals(match.getPlayer1().getId()) && 
                !winner.getId().equals(match.getPlayer2().getId())) {
                throw new RuntimeException("Winner must be one of the match players");
            }
            match.setWinner(winner);
        } else {
            match.setWinner(null); // Draw
        }

        // Update games if provided
        if (request.getGames() != null && !request.getGames().isEmpty()) {
            // Delete existing games
            List<Game> existingGames = gameRepository.findByMatchId(matchId);
            gameRepository.deleteAll(existingGames);

            // Create new games
            int gameNumber = 1;
            for (TournamentMatchResultRequest.GameResultRequest gameReq : request.getGames()) {
                Game game = new Game();
                game.setMatch(match);
                game.setPlayer1(match.getPlayer1());
                game.setPlayer2(match.getPlayer2());
                game.setGameNumber(gameNumber++);
                game.setPlayer1Score(gameReq.getPlayer1Score());
                game.setPlayer2Score(gameReq.getPlayer2Score());
                
                // Set result type
                try {
                    game.setResultType(Game.GameResultType.valueOf(
                            gameReq.getResultType() != null ? gameReq.getResultType() : "COMPLETED"));
                } catch (Exception e) {
                    game.setResultType(Game.GameResultType.COMPLETED);
                }

                // Set winner for the game
                if (gameReq.getWinnerId() != null) {
                    Player gameWinner = playerRepository.findById(gameReq.getWinnerId())
                            .orElseThrow(() -> new RuntimeException("Game winner player not found"));
                    game.setWinner(gameWinner);
                    
                    // Set game result enum
                    if (gameWinner.getId().equals(match.getPlayer1().getId())) {
                        game.setResult(za.co.infratech.rispo.dto.enums.GameResult.PLAYER1_WIN);
                    } else {
                        game.setResult(za.co.infratech.rispo.dto.enums.GameResult.PLAYER2_WIN);
                    }
                } else {
                    game.setWinner(null);
                    game.setResult(za.co.infratech.rispo.dto.enums.GameResult.DRAW);
                }

                gameRepository.save(game);
            }
        }

        match.setSubmittedBy(user);
        match.setSubmittedAt(LocalDateTime.now());

        // If approve flag is true, approve the match and trigger rating calculation
        if (Boolean.TRUE.equals(request.getApprove())) {
            match.setStatus(Match.MatchStatus.APPROVED);
            match.setReviewedBy(user);
            match.setReviewedAt(LocalDateTime.now());
            
            // Publish rating calculation message for async processing
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
        }

        return matchRepository.save(match);
    }
}
