package za.co.infratech.rispo.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.infratech.rispo.dto.request.AcknowledgeResultRequest;
import za.co.infratech.rispo.dto.request.CreateChallengeRequest;
import za.co.infratech.rispo.dto.request.ResolveFlagRequest;
import za.co.infratech.rispo.dto.response.ChallengeResponse;
import za.co.infratech.rispo.dto.response.PlayerFlagResponse;
import za.co.infratech.rispo.model.*;
import za.co.infratech.rispo.repository.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final PlayerRepository playerRepository;
    private final PlayerFlagRepository playerFlagRepository;
    private final MatchRepository matchRepository;
    private final UserRepository userRepository;

    private static final int FLAG_THRESHOLD_FOR_TOURNAMENT = 3;
    private static final int ACKNOWLEDGMENT_DEADLINE_DAYS = 7;

    @Transactional
    public ChallengeResponse createChallenge(Long userId, CreateChallengeRequest request) {
        log.info("User {} creating challenge to player {}", userId, request.getChallengedPlayerId());

        Player challenger = playerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Challenger not found"));

        Player challenged = playerRepository.findById(request.getChallengedPlayerId())
                .orElseThrow(() -> new RuntimeException("Challenged player not found"));

        if (challenger.getId().equals(request.getChallengedPlayerId())) {
            throw new RuntimeException("Cannot challenge yourself");
        }

        Challenge challenge = Challenge.builder()
                .challenger(challenger)
                .challenged(challenged)
                .challengeName(request.getChallengeName())
                .message(request.getMessage())
                .build();

        challenge = challengeRepository.save(challenge);
        log.info("Challenge created with ID: {}", challenge.getChallengeId());

        return convertToResponse(challenge);
    }

    @Transactional
    public ChallengeResponse acceptChallenge(Long challengeId, Long userId) {
        log.info("User {} accepting challenge {}", userId, challengeId);

        Player player = playerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new RuntimeException("Challenge not found"));

        if (!challenge.getChallenged().getId().equals(player.getId())) {
            throw new RuntimeException("Only the challenged player can accept this challenge");
        }

        if (challenge.getStatus() != Challenge.ChallengeStatus.PENDING) {
            throw new RuntimeException("Challenge is not pending");
        }

        if (LocalDateTime.now().isAfter(challenge.getExpiresAt())) {
            challenge.setStatus(Challenge.ChallengeStatus.EXPIRED);
            challengeRepository.save(challenge);
            throw new RuntimeException("Challenge has expired");
        }

        challenge.setStatus(Challenge.ChallengeStatus.ACCEPTED);
        challenge.setRespondedAt(LocalDateTime.now());
        challenge = challengeRepository.save(challenge);

        // Auto-create match when challenge is accepted
        Match match = Match.builder()
                .player1(challenge.getChallenger())
                .player2(challenge.getChallenged())
                .challenge(challenge)
                .round(1)
                .adminCreated(false)
                .status(Match.MatchStatus.PENDING)
                .acknowledgmentStatus(Match.AcknowledgmentStatus.NOT_REQUIRED)
                .build();

        matchRepository.save(match);
        log.info("Match auto-created for challenge {}", challengeId);

        log.info("Challenge {} accepted", challengeId);
        return convertToResponse(challenge);
    }

    @Transactional
    public ChallengeResponse rejectChallenge(Long challengeId, Long userId) {
        log.info("User {} rejecting challenge {}", userId, challengeId);

        Player player = playerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new RuntimeException("Challenge not found"));

        if (!challenge.getChallenged().getId().equals(player.getId())) {
            throw new RuntimeException("Only the challenged player can reject this challenge");
        }

        if (challenge.getStatus() != Challenge.ChallengeStatus.PENDING) {
            throw new RuntimeException("Challenge is not pending");
        }

        challenge.setStatus(Challenge.ChallengeStatus.REJECTED);
        challenge.setRespondedAt(LocalDateTime.now());
        challenge = challengeRepository.save(challenge);

        log.info("Challenge {} rejected", challengeId);
        return convertToResponse(challenge);
    }

    @Transactional
    public ChallengeResponse cancelChallenge(Long challengeId, Long userId) {
        log.info("User {} cancelling challenge {}", userId, challengeId);

        Player player = playerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        Challenge challenge = challengeRepository.findById(challengeId)
                .orElseThrow(() -> new RuntimeException("Challenge not found"));

        if (!challenge.getChallenger().getId().equals(player.getId())) {
            throw new RuntimeException("Only the challenger can cancel this challenge");
        }

        if (challenge.getStatus() != Challenge.ChallengeStatus.PENDING) {
            throw new RuntimeException("Only pending challenges can be cancelled");
        }

        challenge.setStatus(Challenge.ChallengeStatus.CANCELLED);
        challenge = challengeRepository.save(challenge);

        log.info("Challenge {} cancelled", challengeId);
        return convertToResponse(challenge);
    }

    @Transactional
    public void acknowledgeMatchResult(Long matchId, Long playerId, AcknowledgeResultRequest request) {
        log.info("Player {} acknowledging match result for match {}", playerId, matchId);

        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        if (match.getAcknowledgmentStatus() != Match.AcknowledgmentStatus.PENDING_ACKNOWLEDGMENT) {
            throw new RuntimeException("Match is not pending acknowledgment");
        }

        // Determine which player should acknowledge
        Player player1 = match.getPlayer1();
        Player player2 = match.getPlayer2();
        
        Player recordedByPlayer = match.getResultRecordedBy() != null ?
                playerRepository.findByUserId(match.getResultRecordedBy().getId()).orElse(null) : null;

        if (recordedByPlayer == null) {
            throw new RuntimeException("Cannot determine who recorded the result");
        }

        Long acknowledgerPlayerId = null;
        if (recordedByPlayer.getId().equals(player1.getId())) {
            acknowledgerPlayerId = player2.getId();
        } else if (recordedByPlayer.getId().equals(player2.getId())) {
            acknowledgerPlayerId = player1.getId();
        }

        if (!playerId.equals(acknowledgerPlayerId)) {
            throw new RuntimeException("Only the opponent can acknowledge this result");
        }

        Player acknowledgerPlayer = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        UserEntity acknowledger = userRepository.findById(acknowledgerPlayer.getUser().getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getAcknowledged()) {
            match.setAcknowledgmentStatus(Match.AcknowledgmentStatus.ACKNOWLEDGED);
            match.setAcknowledgedBy(acknowledger);
            match.setAcknowledgedAt(LocalDateTime.now());
            log.info("Match {} acknowledged by player {}", matchId, playerId);
        } else {
            match.setAcknowledgmentStatus(Match.AcknowledgmentStatus.DISPUTED);
            log.info("Match {} disputed by player {}", matchId, playerId);

            // Create a flag for the player who recorded the result
            flagPlayer(recordedByPlayer, match, PlayerFlag.FlagType.DISPUTE,
                    "Result disputed: " + (request.getNotes() != null ? request.getNotes() : "No reason provided"),
                    acknowledger);
        }

        matchRepository.save(match);
    }

    @Transactional
    public void checkAcknowledgmentDeadlines() {
        log.info("Checking acknowledgment deadlines");

        List<Match> pendingMatches = matchRepository.findByAcknowledgmentStatus(
                Match.AcknowledgmentStatus.PENDING_ACKNOWLEDGMENT);

        LocalDateTime now = LocalDateTime.now();
        for (Match match : pendingMatches) {
            if (match.getAcknowledgmentDeadline() != null &&
                    now.isAfter(match.getAcknowledgmentDeadline())) {

                // Determine which player failed to acknowledge
                Player player1 = match.getPlayer1();
                Player player2 = match.getPlayer2();
                
                Player recordedByPlayer = match.getResultRecordedBy() != null ?
                        playerRepository.findByUserId(match.getResultRecordedBy().getId()).orElse(null) : null;

                Player failedToAcknowledge = null;
                if (recordedByPlayer != null) {
                    if (recordedByPlayer.getId().equals(player1.getId())) {
                        failedToAcknowledge = player2;
                    } else if (recordedByPlayer.getId().equals(player2.getId())) {
                        failedToAcknowledge = player1;
                    }
                }

                if (failedToAcknowledge != null) {
                    log.warn("Player {} failed to acknowledge match {} by deadline", 
                            failedToAcknowledge.getId(), match.getId());

                    flagPlayer(failedToAcknowledge, match, PlayerFlag.FlagType.NO_ACKNOWLEDGMENT,
                            "Failed to acknowledge match result within " + ACKNOWLEDGMENT_DEADLINE_DAYS + " days",
                            null);

                    // Match still goes to admin for review
                    match.setAcknowledgmentStatus(Match.AcknowledgmentStatus.DISPUTED);
                    matchRepository.save(match);
                }
            }
        }
    }

    @Transactional
    public void expireChallenges() {
        log.info("Expiring old challenges");

        List<Challenge> expiredChallenges = challengeRepository.findByStatusAndExpiresAtBefore(
                Challenge.ChallengeStatus.PENDING, LocalDateTime.now());

        for (Challenge challenge : expiredChallenges) {
            challenge.setStatus(Challenge.ChallengeStatus.EXPIRED);
            challengeRepository.save(challenge);
            log.info("Challenge {} expired", challenge.getChallengeId());
        }
    }

    @Transactional
    public void flagPlayer(Player player, Match match, PlayerFlag.FlagType flagType,
                          String description, UserEntity flaggedBy) {
        log.info("Flagging player {} for match {} with type {}", player.getId(), match.getId(), flagType);

        PlayerFlag flag = PlayerFlag.builder()
                .player(player)
                .match(match)
                .flagType(flagType)
                .description(description)
                .flaggedBy(flaggedBy)
                .build();

        playerFlagRepository.save(flag);

        // Update player flag counters
        player.setUnresolvedFlagsCount(player.getUnresolvedFlagsCount() + 1);
        player.setTotalFlagsCount(player.getTotalFlagsCount() + 1);

        // Check tournament eligibility
        if (player.getUnresolvedFlagsCount() >= FLAG_THRESHOLD_FOR_TOURNAMENT) {
            player.setIsTournamentEligible(false);
            log.warn("Player {} is no longer tournament eligible due to {} unresolved flags",
                    player.getId(), player.getUnresolvedFlagsCount());
        }

        playerRepository.save(player);
    }

    @Transactional
    public void resolveFlag(Long flagId, Long adminUserId, ResolveFlagRequest request) {
        log.info("Admin user {} resolving flag {}", adminUserId, flagId);

        PlayerFlag flag = playerFlagRepository.findById(flagId)
                .orElseThrow(() -> new RuntimeException("Flag not found"));

        if (flag.getResolved()) {
            throw new RuntimeException("Flag is already resolved");
        }

        UserEntity admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new RuntimeException("Admin user not found"));

        flag.setResolved(true);
        flag.setResolvedAt(LocalDateTime.now());
        flag.setResolvedBy(admin);
        flag.setResolutionNotes(request.getResolutionNotes());
        playerFlagRepository.save(flag);

        // Update player counters
        Player player = flag.getPlayer();
        player.setUnresolvedFlagsCount(Math.max(0, player.getUnresolvedFlagsCount() - 1));

        // Restore tournament eligibility if flags dropped below threshold
        if (player.getUnresolvedFlagsCount() < FLAG_THRESHOLD_FOR_TOURNAMENT) {
            player.setIsTournamentEligible(true);
            log.info("Player {} is now tournament eligible again", player.getId());
        }

        playerRepository.save(player);
    }

    @Transactional(readOnly = true)
    public List<ChallengeResponse> getIncomingChallenges(Long userId) {
        Player player = playerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        return challengeRepository.findByChallengedOrderByCreatedAtDesc(player)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ChallengeResponse> getOutgoingChallenges(Long userId) {
        Player player = playerRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        return challengeRepository.findByChallengerOrderByCreatedAtDesc(player)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlayerFlagResponse> getPlayerFlags(Long playerId) {
        Player player = playerRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Player not found"));

        return playerFlagRepository.findByPlayerOrderByFlaggedAtDesc(player)
                .stream()
                .map(this::convertFlagToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlayerFlagResponse> getUnresolvedFlags() {
        return playerFlagRepository.findByResolvedOrderByFlaggedAtDesc(false)
                .stream()
                .map(this::convertFlagToResponse)
                .collect(Collectors.toList());
    }

    private ChallengeResponse convertToResponse(Challenge challenge) {
        // Find associated match if challenge is accepted
        Long matchId = null;
        if (challenge.getStatus() == Challenge.ChallengeStatus.ACCEPTED) {
            matchId = matchRepository.findByChallenge(challenge)
                    .map(Match::getId)
                    .orElse(null);
        }

        return ChallengeResponse.builder()
                .challengeId(challenge.getChallengeId())
                .challengerId(challenge.getChallenger().getId())
                .challengerName(challenge.getChallenger().getName())
                .challengedId(challenge.getChallenged().getId())
                .challengedName(challenge.getChallenged().getName())
                .challengeName(challenge.getChallengeName())
                .status(challenge.getStatus().name())
                .message(challenge.getMessage())
                .matchId(matchId)
                .createdAt(challenge.getCreatedAt())
                .respondedAt(challenge.getRespondedAt())
                .expiresAt(challenge.getExpiresAt())
                .build();
    }

    private PlayerFlagResponse convertFlagToResponse(PlayerFlag flag) {
        return PlayerFlagResponse.builder()
                .flagId(flag.getFlagId())
                .playerId(flag.getPlayer().getId())
                .playerName(flag.getPlayer().getName())
                .matchId(flag.getMatch().getId())
                .flagType(flag.getFlagType().name())
                .description(flag.getDescription())
                .flaggedAt(flag.getFlaggedAt())
                .flaggedByName(flag.getFlaggedBy() != null ? flag.getFlaggedBy().getUsername() : "System")
                .resolved(flag.getResolved())
                .resolvedAt(flag.getResolvedAt())
                .resolvedByName(flag.getResolvedBy() != null ? flag.getResolvedBy().getUsername() : null)
                .resolutionNotes(flag.getResolutionNotes())
                .build();
    }
}
