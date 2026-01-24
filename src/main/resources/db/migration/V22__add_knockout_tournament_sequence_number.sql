-- Add sequence_number column to knockout_tournament table
-- This allows multiple tournaments per week/day

ALTER TABLE knockout_tournament ADD COLUMN sequence_number INTEGER NOT NULL DEFAULT 1;

-- Create an index for efficient queries
CREATE INDEX idx_knockout_tournament_club_year_week_seq 
ON knockout_tournament(club_id, tournament_year, week_number, sequence_number);

-- Update existing tournaments to have sequence_number = 1 (they were the first/only tournament for their week)
-- This is already handled by the DEFAULT 1 constraint above

COMMENT ON COLUMN knockout_tournament.sequence_number IS 'Sequence number for multiple tournaments in the same week (1, 2, 3, ...)';