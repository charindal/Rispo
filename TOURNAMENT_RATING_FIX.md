# Tournament Rating Issue - Quick Fix Guide

## Issue Summary
Tournament matches are being submitted but ratings are not being calculated.

## Root Cause Analysis

Based on the code review:
1. ✅ RabbitMQ is running
2. ✅ Rating calculation queue exists  
3. ✅ Code sends rating messages when `approve: true`
4. ✅ Frontend sends `approve: true` in the request

## Possible Causes & Solutions

### Cause 1: Application Not Connected to RabbitMQ
**Check:** View application logs for RabbitMQ connection errors

```powershell
podman logs rispo-app | Select-String -Pattern "RabbitMQ|AMQP|Connection refused"
```

**Solution:** Restart the application container
```powershell
podman compose -f docker-compose.yml restart app
```

### Cause 2: Match Status Not Being Saved as APPROVED
**Check:** The match might be updated but not saved properly

**Solution:** Add logging to verify. Check backend logs:
```powershell
podman logs -f rispo-app
```

Then submit a match result and watch for:
- "Received rating calculation message for match X"
- "Successfully processed rating calculation for match X"

### Cause 3: Rating Already Calculated
**Check:** If `is_rated` is already true, rating won't be recalculated

**Solution:** Check the match in the database:
```powershell
# Connect to database container
podman exec -it rispo-db psql -U rispo_admin -d rispo

# Check match status
SELECT id, status, is_rated, winner_id, player1_rating_before, player2_rating_before 
FROM match 
WHERE tournament_id IS NOT NULL 
ORDER BY id DESC 
LIMIT 10;

# Exit postgres
\q
```

### Cause 4: Transaction Not Committing
**Issue:** The @Transactional might be rolling back

**Solution:** Check for exceptions in logs:
```powershell
podman logs rispo-app | Select-String -Pattern "Exception|Error|Failed" | Select-Object -Last 50
```

## Manual Fix Steps

### Step 1: Check Current Match Status
```powershell
# Open PowerShell and connect to database
podman exec -it rispo-db psql -U rispo_admin -d rispo

# Check tournament matches
SELECT 
    m.id as match_id,
    m.status,
    m.is_rated,
    m.round,
    p1.name as player1,
    p2.name as player2,
    w.name as winner,
    m.player1_rating_before,
    m.player2_rating_before,
    m.player1_rating_after,
    m.player2_rating_after
FROM match m
LEFT JOIN player p1 ON m.player1_id = p1.id
LEFT JOIN player p2 ON m.player2_id = p2.id
LEFT JOIN player w ON m.winner_id = w.id
WHERE m.tournament_id IS NOT NULL
ORDER BY m.id DESC
LIMIT 10;
```

### Step 2: Manually Trigger Rating (If Needed)
```powershell
# If matches are APPROVED but not rated (is_rated = false)
# You can manually trigger rating calculation

# First, get the match IDs that need rating
SELECT id FROM match 
WHERE tournament_id IS NOT NULL 
AND status = 'APPROVED' 
AND is_rated = false;

# For each match ID, you can use the application's actuator to trigger rating
# (This would require adding a custom actuator endpoint)
```

### Step 3: Restart Services
```powershell
# Restart RabbitMQ
podman compose -f docker-compose.yml restart rabbitmq

# Wait 5 seconds
Start-Sleep -Seconds 5

# Restart Application
podman compose -f docker-compose.yml restart app

# Wait for startup
Start-Sleep -Seconds 15

# Check logs
podman logs -f rispo-app
```

## Testing the Fix

1. **Submit a new tournament match result:**
   - Go to Tournament Matches page
   - Enter a result for a pending match
   - Click "Submit & Approve"

2. **Watch the logs in real-time:**
   ```powershell
   podman logs -f rispo-app
   ```

3. **Look for these messages:**
   - ✅ "Received rating calculation message for match X"
   - ✅ "Successfully processed rating calculation for match X"
   - ✅ No errors or exceptions

4. **Verify in the UI:**
   - Check Rankings page
   - Verify "Games Played" increased
   - Verify ratings changed

## Common Log Messages

### Good (Working):
```
Received rating calculation message for match 123: type=MATCH_APPROVE
Tournament match 123 rated using winner (no games): player1Score=1.0
Successfully processed rating calculation for match 123
```

### Bad (Not Working):
```
Failed to process rating calculation for match 123: Match has already been rated
Connection refused: rabbitmq:5672
RabbitMQ connection lost
```

## Database Query to Check Player Stats

```sql
SELECT 
    p.id,
    p.name,
    p.rating,
    p.matches_played,
    p.wins,
    p.losses,
    p.draws,
    p.games_played
FROM player p
WHERE p.id IN (
    SELECT DISTINCT player1_id FROM match WHERE tournament_id IS NOT NULL
    UNION
    SELECT DISTINCT player2_id FROM match WHERE tournament_id IS NOT NULL
)
ORDER BY p.rating DESC;
```

## Prevention - Enable Debug Logging

Add to `application.properties`:
```properties
logging.level.za.co.infratech.rispo.service.MessageConsumerService=DEBUG
logging.level.za.co.infratech.rispo.service.RatingEngine=DEBUG
logging.level.za.co.infratech.rispo.service.TournamentService=DEBUG
logging.level.org.springframework.amqp=DEBUG
```

Then restart:
```powershell
podman compose -f docker-compose.yml restart app
```

## Quick Diagnostic Command

```powershell
# Run this one-liner to check everything:
Write-Host "=== Container Status ===" -ForegroundColor Cyan
podman ps | Select-String "rispo"
Write-Host "`n=== RabbitMQ Queue ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "http://localhost:15672/api/queues/%2F/rating-calculation-queue" -Headers @{Authorization=("Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("rispo_admin:R!#po123##")))} | Select-Object name, messages, messages_ready
Write-Host "`n=== Recent App Logs ===" -ForegroundColor Cyan
podman logs --tail 50 rispo-app | Select-String -Pattern "rating|tournament" -Context 1,0
```

## If All Else Fails - Code Fix

If the issue persists, there might be a bug in the code. The fix would be in:

**File:** `src/main/java/za/co/infratech/rispo/service/TournamentService.java`

**Line ~1080:** Ensure the message is being sent BEFORE saving:

```java
// If approve flag is true, approve the match and trigger rating calculation
if (Boolean.TRUE.equals(request.getApprove())) {
    match.setStatus(Match.MatchStatus.APPROVED);
    match.setReviewedBy(user);
    match.setReviewedAt(LocalDateTime.now());
    
    // Save first to ensure transaction commits
    match = matchRepository.save(match);
    
    // Then publish rating calculation message
    Long winnerId = match.getWinner() != null ? match.getWinner().getId() : null;
    try {
        messageProducer.sendRatingCalculationMessage(
            za.co.infratech.rispo.dto.request.RatingCalculationMessage.builder()
                .matchId(matchId)
                .player1Id(match.getPlayer1().getId())
                .player2Id(match.getPlayer2().getId())
                .winnerId(winnerId)
                .calculationType("MATCH_APPROVE")
                .build()
        );
        log.info("Sent rating calculation message for tournament match {}", matchId);
    } catch (Exception e) {
        log.error("Failed to send rating calculation message for match {}: {}", matchId, e.getMessage());
        // Don't fail the entire operation if message sending fails
    }
}
```

## Contact

If none of these solutions work, provide:
1. Output of: `podman logs rispo-app | Select-String -Pattern "Exception|Error" | Select-Object -Last 20`
2. Output of: `podman exec -it rispo-db psql -U rispo_admin -d rispo -c "SELECT id, status, is_rated FROM match WHERE tournament_id IS NOT NULL ORDER BY id DESC LIMIT 5;"`
3. Screenshot of the match submission in the UI
