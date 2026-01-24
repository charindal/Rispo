-- Drop the old unique constraint that prevents multiple tournaments per week
-- and create a new one that includes sequence_number to allow multiple tournaments

DROP INDEX IF EXISTS unique_knockout_tournament_club_year_week;

-- Create new unique constraint that includes sequence_number
-- This allows multiple tournaments per week as long as they have different sequence numbers
CREATE UNIQUE INDEX unique_knockout_tournament_club_year_week_seq 
ON knockout_tournament(club_id, tournament_year, week_number, sequence_number);

COMMENT ON INDEX unique_knockout_tournament_club_year_week_seq 
IS 'Ensures unique tournaments per club/year/week/sequence combination, allowing multiple tournaments per week';