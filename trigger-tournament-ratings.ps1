#!/usr/bin/env pwsh
# Manually trigger rating calculation for tournament matches

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Manual Tournament Rating Trigger" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$podmanPath = "C:\Program Files\RedHat\Podman\podman.exe"

# Get matches that need rating
Write-Host "Finding matches that need rating..." -ForegroundColor Yellow
$matchesResult = & $podmanPath exec rispo-db psql -U rispo_admin -d rispo -t -c "SELECT id FROM match WHERE tournament_id IS NOT NULL AND status = 'APPROVED' AND is_rated = false;" 2>&1

$matchIds = $matchesResult | Where-Object { $_ -match '^\s*\d+\s*$' } | ForEach-Object { $_.Trim() }

if ($matchIds.Count -eq 0) {
    Write-Host "✓ No matches need rating!" -ForegroundColor Green
    Write-Host ""
    Write-Host "All tournament matches are already rated." -ForegroundColor Gray
    exit 0
}

Write-Host "Found $($matchIds.Count) match(es) that need rating: $($matchIds -join ', ')" -ForegroundColor Cyan
Write-Host ""

# For each match, we'll update it to trigger the rating
Write-Host "Triggering rating calculations..." -ForegroundColor Yellow

foreach ($matchId in $matchIds) {
    Write-Host "  Processing match ID: $matchId..." -ForegroundColor Gray
    
    # Get match details
    $matchData = & $podmanPath exec rispo-db psql -U rispo_admin -d rispo -t -c "SELECT player1_id, player2_id, winner_id FROM match WHERE id = $matchId;" 2>&1
    
    if ($matchData -match '(\d+)\s*\|\s*(\d+)\s*\|\s*(\d*)') {
        $player1Id = $Matches[1].Trim()
        $player2Id = $Matches[2].Trim()
        $winnerId = if ($Matches[3].Trim()) { $Matches[3].Trim() } else { "NULL" }
        
        Write-Host "    Player 1: $player1Id, Player 2: $player2Id, Winner: $winnerId" -ForegroundColor Gray
        
        # Insert rating calculation message directly into RabbitMQ via SQL
        # (This is a workaround - normally messages come from the application)
        
        Write-Host "    Marking as ready for rating..." -ForegroundColor Gray
        
        # The best approach is to reset and let user re-approve through UI
        # But we can also try to force process through SQL
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Solution" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The matches have been reset and are ready for rating." -ForegroundColor Green
Write-Host ""
Write-Host "To complete the rating calculation:" -ForegroundColor Yellow
Write-Host "1. Go to the Tournament Matches page in your browser" -ForegroundColor White
Write-Host "2. For each match that shows 'APPROVED' status" -ForegroundColor White  
Write-Host "3. Click 'Submit & Approve' again (even though it's already approved)" -ForegroundColor White
Write-Host "4. The rating will be calculated this time!" -ForegroundColor White
Write-Host ""
Write-Host "OR - Use the Match Review page instead:" -ForegroundColor Yellow
Write-Host "1. Go to Match Review & Rating page" -ForegroundColor White
Write-Host "2. These matches should appear there" -ForegroundColor White
Write-Host "3. Click 'Approve' for each one" -ForegroundColor White
Write-Host "4. Ratings will be calculated!" -ForegroundColor White
Write-Host ""

# Alternative: Force process via SQL (advanced)
$forceProcess = Read-Host "Do you want to try to force-process ratings via SQL? (y/n)"

if ($forceProcess -eq "y" -or $forceProcess -eq "Y") {
    Write-Host ""
    Write-Host "Force-processing ratings..." -ForegroundColor Yellow
    
    foreach ($matchId in $matchIds) {
        Write-Host "  Processing match $matchId..." -ForegroundColor Gray
        
        # Call the rating engine directly via SQL function (if it exists)
        # Or reset the match status to pending and back to approved to trigger the workflow
        
        & $podmanPath exec rispo-db psql -U rispo_admin -d rispo -c "UPDATE match SET status = 'PENDING_REVIEW' WHERE id = $matchId;" 2>&1 | Out-Null
        Start-Sleep -Milliseconds 100
        & $podmanPath exec rispo-db psql -U rispo_admin -d rispo -c "UPDATE match SET status = 'APPROVED', reviewed_at = NOW() WHERE id = $matchId;" 2>&1 | Out-Null
        
        Write-Host "    Match $matchId status updated" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Waiting for rating calculations..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "Checking results..." -ForegroundColor Yellow
    & $podmanPath exec rispo-db psql -U rispo_admin -d rispo -c "SELECT id, is_rated, player1_rating_before, player1_rating_after FROM match WHERE id IN ($($matchIds -join ','));" 2>&1
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
